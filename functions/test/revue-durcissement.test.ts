/**
 * Revue adversariale du durcissement — proxy IA (fonction `api`, D43, D67).
 * Hypothèses d'attaque contre les quotas : faire payer une autre école,
 * consommer sans droit, contourner par un rôle non pédagogique, réponses mises
 * en cache. Voir docs/revues/REVUE-SECURITE-DURCISSEMENT.md.
 * Émulateurs Firestore et Auth (firebase emulators:exec).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let api: typeof import("../src/tenant/api.js");
let accounts: typeof import("../src/tenant/accounts.js");
let archive: typeof import("../src/tenant/archiveSync.js");

const PROJECT = () => process.env.GCLOUD_PROJECT!;
const LIMITS = { perUserDaily: 2, perUserPerMinute: 100, perSchoolDaily: 3, globalDaily: 1000 };
const NOON = new Date("2026-10-22T12:00:00Z");

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

async function member(username: string, schoolId: string, role: string, isActive = true): Promise<string> {
  const email = `${username}@alfajr.local`;
  const rec = await admin.adminAuth().createUser({ email, password: "motdepasse-2026" });
  const db = admin.adminDb();
  await db.doc(`schools/${schoolId}`).set({ name: schoolId }, { merge: true });
  await db.doc(`schools/${schoolId}/members/${rec.uid}`).set({ uid: rec.uid, schoolId, role, isActive });
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "motdepasse-2026", returnSecureToken: true }),
  });
  return (await res.json()).idToken;
}

async function call(token: string, body: Record<string, unknown>) {
  const out: { status: number; body: any; headers: Record<string, string> } = { status: 200, body: null, headers: {} };
  const res: any = {
    status(code: number) { out.status = code; return res; },
    json(b: unknown) { out.body = b; },
    set(k: string, v: string) { out.headers[k] = v; },
  };
  await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: { authorization: `Bearer ${token}` }, body }, res, async () => JSON.stringify({ summary: "ok" }), { limits: LIMITS, now: () => NOON });
  return out;
}

const counters = async () => (await admin.adminDb().collection("aiQuota").get()).docs.map((d) => d.id).sort();

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  api = await import("../src/tenant/api.js");
  accounts = await import("../src/tenant/accounts.js");
  archive = await import("../src/tenant/archiveSync.js");
});

beforeEach(clear);

describe("hypothèses réfutées : quotas du proxy IA", () => {
  it("un enseignant de A ne consomme pas le quota de B en citant son schoolId (refus avant tout compteur)", async () => {
    const tokenA = await member("prof_a", "alfajr", "مدرس");
    await admin.adminDb().doc("schools/annour").set({ name: "annour" });
    const out = await call(tokenA, { schoolId: "annour", studentName: "x" });
    expect(out.status).toBe(403);
    expect(await counters()).toEqual([]);
  });

  it("familles, bénévoles, membres suspendus et requêtes incomplètes : refusés sans rien consommer", async () => {
    const cases: [string, string, boolean, Record<string, unknown>, number][] = [
      ["parent", "ولي أمر", true, { schoolId: "alfajr", studentName: "x" }, 403],
      ["eleve", "طالب", true, { schoolId: "alfajr", studentName: "x" }, 403],
      ["benevole", "متطوع", true, { schoolId: "alfajr", studentName: "x" }, 403],
      ["suspendu", "مدرس", false, { schoolId: "alfajr", studentName: "x" }, 403],
      ["incomplet", "مدرس", true, { schoolId: "alfajr", studentName: "   " }, 400],
    ];
    for (const [username, role, active, body, status] of cases) {
      const token = await member(username, "alfajr", role, active);
      expect((await call(token, body)).status, username).toBe(status);
    }
    expect(await counters()).toEqual([]);
  });

  it("multiplier les comptes d'une même école ne dépasse pas le quota de l'école", async () => {
    const statuses: number[] = [];
    for (const u of ["p1", "p2", "p3"]) {
      const token = await member(u, "alfajr", "مدرس");
      for (let i = 0; i < 2; i++) statuses.push((await call(token, { schoolId: "alfajr", studentName: "x" })).status);
    }
    // Quota école = 3 : les 3 premiers rapports passent, puis 429 pour tous.
    expect(statuses).toEqual([200, 200, 200, 429, 429, 429]);
    const school = (await admin.adminDb().doc("aiQuota/s_alfajr_2026-10-22").get()).data();
    expect(school?.count).toBe(3);
  });

  it("le corps de la requête ne peut pas choisir les compteurs (uid, jour, quota) : ils viennent du jeton et de l'horloge du serveur", async () => {
    const token = await member("prof_spoof", "alfajr", "مدرس");
    const out = await call(token, { schoolId: "alfajr", studentName: "x", uid: "autre", day: "2000-01-01", count: -100, limits: { perUserDaily: 1e9 } });
    expect(out.status).toBe(200);
    const ids = await counters();
    expect(ids.some((id) => id.includes("autre") || id.includes("2000-01-01"))).toBe(false);
    expect(ids.filter((id) => id.startsWith("u_"))).toHaveLength(1);
  });
});

describe("D67 : réponses du proxy IA jamais mises en cache", () => {
  it("Cache-Control: private, no-store sur le succès, le refus et le quota dépassé", async () => {
    const token = await member("prof_cache", "alfajr", "مدرس");
    const ok = await call(token, { schoolId: "alfajr", studentName: "x" });
    expect(ok.status).toBe(200);
    expect(ok.headers["Cache-Control"]).toBe("private, no-store");
    const refused = await call(token, { schoolId: "annour", studentName: "x" });
    expect(refused.headers["Cache-Control"]).toBe("private, no-store");
    await call(token, { schoolId: "alfajr", studentName: "x" });
    const limited = await call(token, { schoolId: "alfajr", studentName: "x" });
    expect(limited.status).toBe(429);
    expect(limited.headers["Cache-Control"]).toBe("private, no-store");
  });
});

describe("D72 : un directeur ne peut pas bloquer le compte du super-admin", () => {
  async function setup() {
    const db = admin.adminDb();
    const auth = admin.adminAuth();
    const sup = (await auth.createUser({ email: "plateforme@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    await auth.setCustomUserClaims(sup, { superAdmin: true });
    const dir = (await auth.createUser({ email: "dir_nouvelle@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    const prof = (await auth.createUser({ email: "prof_nouvelle@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    // École créée par le super-admin avec makeMeDirector (parcours de l'interface), puis vrai directeur.
    for (const [uid, role] of [[sup, "مدير"], [dir, "مدير"], [prof, "مدرس"]] as const) {
      await db.doc(`schools/nouvelle/members/${uid}`).set({ uid, schoolId: "nouvelle", role, isActive: true, isArchived: false, linkedStudentIds: [], linkedTeacherId: null });
      await db.doc(`users/${uid}`).set({ schoolIds: ["nouvelle"], lastSchoolId: "nouvelle" });
    }
    return { sup, dir, prof };
  }

  it("retrait du super-admin de sa seule école : appartenance supprimée, compte Auth NON désactivé", async () => {
    const { sup, dir, prof } = await setup();
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "nouvelle", sup, {}, true);
    expect((await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).exists).toBe(false);
    expect((await admin.adminAuth().getUser(sup)).disabled).toBe(false);
    // Comportement normal conservé pour un compte ordinaire.
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "nouvelle", prof, {}, true);
    expect((await admin.adminAuth().getUser(prof)).disabled).toBe(true);
  });

  it("archivage d'une fiche liée au super-admin : membre suspendu dans l'école, compte Auth NON désactivé", async () => {
    const { sup } = await setup();
    const member = { uid: sup, data: (await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).data()! };
    expect(await archive.setMemberArchived("nouvelle", member, true)).toBe(true);
    expect((await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).data()?.isActive).toBe(false);
    expect((await admin.adminAuth().getUser(sup)).disabled).toBe(false);
  });
});
