/**
 * Proxy IA (fonction api) : limitation de débit transactionnelle, taille des
 * entrées, journaux sans donnée personnelle (O-03, D43). Émulateurs Firestore
 * et Auth (firebase emulators:exec).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let quota: typeof import("../src/tenant/aiQuota.js");
let api: typeof import("../src/tenant/api.js");
let logger: typeof import("firebase-functions").logger;

const PROJECT = () => process.env.GCLOUD_PROJECT!;
const LIMITS = { perUserDaily: 3, perUserPerMinute: 100, perSchoolDaily: 100, globalDaily: 1000 };
const NOON = new Date("2026-10-22T12:00:00Z");

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

async function teacher(username: string, schoolId = "alfajr"): Promise<{ uid: string; token: string }> {
  const rec = await admin.adminAuth().createUser({ email: `${username}@alfajr.local`, password: "motdepasse-2026" });
  const db = admin.adminDb();
  await db.doc(`schools/${schoolId}`).set({ name: schoolId }, { merge: true });
  await db.doc(`schools/${schoolId}/members/${rec.uid}`).set({ uid: rec.uid, schoolId, role: "مدرس", isActive: true });
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${username}@alfajr.local`, password: "motdepasse-2026", returnSecureToken: true }),
  });
  return { uid: rec.uid, token: (await res.json()).idToken };
}

function fakeRes() {
  const out: { status: number; body: any; headers: Record<string, string> } = { status: 200, body: null, headers: {} };
  const res: any = {
    status(code: number) { out.status = code; return res; },
    json(b: unknown) { out.body = b; },
    set(k: string, v: string) { out.headers[k] = v; },
  };
  return { res, out };
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  quota = await import("../src/tenant/aiQuota.js");
  api = await import("../src/tenant/api.js");
  logger = (await import("firebase-functions")).logger;
});

beforeEach(clear);
afterEach(() => vi.restoreAllMocks());

describe("consumeAiQuota (compteurs transactionnels)", () => {
  it("par utilisateur et par jour : la limite est exacte, les autres utilisateurs ne sont pas touchés, le lendemain repart à zéro", async () => {
    const db = admin.adminDb();
    for (let i = 0; i < 3; i++) expect((await quota.consumeAiQuota(db, "u1", "alfajr", LIMITS, NOON)).allowed).toBe(true);
    const denied = await quota.consumeAiQuota(db, "u1", "alfajr", LIMITS, NOON);
    expect(denied).toMatchObject({ allowed: false, scope: "user", retryAfterSeconds: 12 * 3600 });
    expect((await quota.consumeAiQuota(db, "u2", "alfajr", LIMITS, NOON)).allowed).toBe(true);
    expect((await quota.consumeAiQuota(db, "u1", "alfajr", LIMITS, new Date("2026-10-23T00:00:01Z"))).allowed).toBe(true);
    // Un refus ne consomme rien.
    expect((await db.doc("aiQuota/u_u1_2026-10-22").get()).data()?.count).toBe(3);
    expect((await db.doc("aiQuota/s_alfajr_2026-10-22").get()).data()?.count).toBe(4);
    expect((await db.doc("aiQuota/g_2026-10-22").get()).data()?.expiresAt).toBeTruthy();
  });

  it("par école, par minute et global ; une limite à 0 ferme le service", async () => {
    const db = admin.adminDb();
    const school = { ...LIMITS, perUserDaily: 100, perSchoolDaily: 2 };
    expect((await quota.consumeAiQuota(db, "a", "alfajr", school, NOON)).allowed).toBe(true);
    expect((await quota.consumeAiQuota(db, "b", "alfajr", school, NOON)).allowed).toBe(true);
    expect(await quota.consumeAiQuota(db, "c", "alfajr", school, NOON)).toMatchObject({ allowed: false, scope: "school" });
    expect((await quota.consumeAiQuota(db, "c", "annour", school, NOON)).allowed).toBe(true);

    const burst = { ...LIMITS, perUserDaily: 100, perUserPerMinute: 1 };
    expect((await quota.consumeAiQuota(db, "d", "annour", burst, NOON)).allowed).toBe(true);
    expect(await quota.consumeAiQuota(db, "d", "annour", burst, new Date("2026-10-22T12:00:30Z"))).toMatchObject({ allowed: false, scope: "user-minute", retryAfterSeconds: 30 });
    expect((await quota.consumeAiQuota(db, "d", "annour", burst, new Date("2026-10-22T12:01:00Z"))).allowed).toBe(true);

    expect(await quota.consumeAiQuota(db, "e", "annour", { ...LIMITS, globalDaily: 0 }, NOON)).toMatchObject({ allowed: false, scope: "global" });
  });

  it("des requêtes simultanées ne dépassent jamais la limite", async () => {
    const db = admin.adminDb();
    const results = await Promise.all(Array.from({ length: 8 }, () => quota.consumeAiQuota(db, "u_course", "alfajr", LIMITS, NOON)));
    expect(results.filter((r) => r.allowed).length).toBe(3);
    expect((await db.doc("aiQuota/u_u_course_2026-10-22").get()).data()?.count).toBe(3);
  });

  it("valeurs par défaut des paramètres : 30 par jour et par utilisateur", () => {
    expect(quota.currentLimits()).toEqual({ perUserDaily: 30, perUserPerMinute: 5, perSchoolDaily: 300, globalDaily: 1000 });
  });
});

describe("fonction api : quota, taille et journaux", () => {
  const body = { schoolId: "alfajr", studentName: "ياسين الفلاني", notes: "ملاحظة سرية", hizbCount: 3, attendanceRate: 90 };

  it("429 avec Retry-After au-delà du quota, sans appel au modèle", async () => {
    const { token } = await teacher("prof_quota");
    let calls = 0;
    const gen = async () => { calls++; return JSON.stringify({ summary: "ok" }); };
    const statuses: number[] = [];
    let last: ReturnType<typeof fakeRes>["out"] | null = null;
    for (let i = 0; i < 4; i++) {
      const { res, out } = fakeRes();
      await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: { authorization: `Bearer ${token}` }, body }, res, gen, { limits: LIMITS, now: () => NOON });
      statuses.push(out.status);
      last = out;
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(calls).toBe(3);
    expect(last!.body).toMatchObject({ error: "rate-limited", scope: "user" });
    expect(last!.headers["Retry-After"]).toBe(String(12 * 3600));
  });

  it("413 au-delà de la taille maximale, avant toute vérification ou consommation", async () => {
    const { token } = await teacher("prof_gros");
    const { res, out } = fakeRes();
    const huge = { ...body, notes: "x".repeat(api.MAX_BODY_BYTES) };
    await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: { authorization: `Bearer ${token}` }, body: huge }, res, async () => "{}", { limits: LIMITS });
    expect(out.status).toBe(413);
    expect((await admin.adminDb().collection("aiQuota").get()).size).toBe(0);
    const raw = fakeRes();
    await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: {}, body: {}, rawBody: Buffer.alloc(api.MAX_BODY_BYTES + 1) }, raw.res);
    expect(raw.out.status).toBe(413);
  });

  it("les journaux ne contiennent ni nom d'élève, ni notes, ni uid, ni invite, ni message d'erreur brut", async () => {
    const { uid, token } = await teacher("prof_logs");
    const lines: unknown[] = [];
    vi.spyOn(logger, "info").mockImplementation((...a: unknown[]) => { lines.push(a); });
    vi.spyOn(logger, "error").mockImplementation((...a: unknown[]) => { lines.push(a); });
    vi.spyOn(logger, "warn").mockImplementation((...a: unknown[]) => { lines.push(a); });
    for (const gen of [async () => JSON.stringify({ summary: "ممتاز" }), async () => { throw new Error(`échec pour ${body.studentName} : clé secrète`); }]) {
      const { res } = fakeRes();
      await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: { authorization: `Bearer ${token}` }, body }, res, gen, { limits: LIMITS, now: () => NOON });
    }
    const { res } = fakeRes();
    await api.handleApi({ method: "POST", path: "/api/gemini/analyze", headers: { authorization: "Bearer faux" }, body }, res);
    const text = JSON.stringify(lines);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    for (const secret of [body.studentName, body.notes, uid, "secrète", "أنت معلم"]) expect(text).not.toContain(secret);
    expect(text).toContain(quota.pseudonym(uid));
    expect(text).toContain("fallback-error");
  });
});
