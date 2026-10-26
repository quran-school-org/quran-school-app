/**
 * Inscriptions aux activités lisibles par la famille (D94), sur émulateurs,
 * données FICTIVES. Une famille ne lit que les inscriptions de SES enfants
 * (participant de type « طالب » dont referenceId est un élève lié), jamais
 * celles du personnel ou d'externes, n'écrit rien et n'accède pas aux dépenses.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from "firebase/firestore";

const S = "ecole";
const AUTRE = "autre";
let env: RulesTestEnvironment;

const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const parts = (db: Firestore, s = S) => collection(db, "schools", s, "activityParticipants");
const ids = (snap: { docs: { id: string }[] }) => snap.docs.map((d) => d.id).sort();
/** Requête telle que l'abonnement de la famille (src/firebase.ts). */
const familyQuery = (db: Firestore, studentIds: string[], s = S) =>
  getDocs(query(parts(db, s), where("participantType", "==", "طالب"), where("referenceId", "in", studentIds)));

const participant = (id: string, referenceId: string | undefined, type: string, s = S) => ({
  schoolId: s, activityId: "act1", participantType: type, fullName: `Fictif ${id}`, fee: 50, paidAmount: 20,
  paymentStatus: "مدفوع جزئياً", registeredAt: "2026-10-02", ...(referenceId ? { referenceId } : {}),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-activites-famille", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const member = (s: string, uid: string, role: string, linked: string[] = []) =>
      setDoc(doc(db, "schools", s, "members", uid), { uid, schoolId: s, role, isActive: true, linkedStudentIds: linked });
    await setDoc(doc(db, "schools", S), { name: "École fictive" });
    await setDoc(doc(db, "schools", AUTRE), { name: "Autre école fictive" });
    await member(S, "parent", "ولي أمر", ["S-1", "S-2"]);
    await member(S, "eleve", "طالب", ["S-1"]);
    await member(S, "autreParent", "ولي أمر", ["S-9"]);
    await member(S, "directeur", "مدير");
    await member(S, "prof", "مدرس");
    await member(S, "benevole", "متطوع");
    await member(S, "menage", "عامل نظافة / صيانة");
    await member(AUTRE, "parentAutreEcole", "ولي أمر", ["S-1"]);
    await setDoc(doc(db, "schools", S, "activityParticipants", "p1"), participant("p1", "S-1", "طالب"));
    await setDoc(doc(db, "schools", S, "activityParticipants", "p2"), participant("p2", "S-2", "طالب"));
    await setDoc(doc(db, "schools", S, "activityParticipants", "p3"), participant("p3", "S-3", "طالب"));
    // Personnel dont l'identifiant coïncide (par hasard) avec un élève lié, et externe sans référence.
    await setDoc(doc(db, "schools", S, "activityParticipants", "p_staff"), participant("p_staff", "S-1", "أستاذ / محفظ"));
    await setDoc(doc(db, "schools", S, "activityParticipants", "p_ext"), participant("p_ext", undefined, "مشارك خارجي"));
    await setDoc(doc(db, "schools", S, "activityParticipants", "p_notype"), { schoolId: S, activityId: "act1", referenceId: "S-1", fullName: "Sans type" });
    await setDoc(doc(db, "schools", AUTRE, "activityParticipants", "q1"), participant("q1", "S-1", "طالب", AUTRE));
    await setDoc(doc(db, "schools", S, "activityExpenses", "e1"), { schoolId: S, activityId: "act1", title: "Bus", amount: 400 });
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("inscriptions aux activités : lecture par la famille", () => {
  it("le parent lit l'inscription de son enfant (document et requête filtrée)", async () => {
    const db = as("parent");
    await assertSucceeds(getDoc(doc(db, "schools", S, "activityParticipants", "p1")));
    await assertSucceeds(getDoc(doc(db, "schools", S, "activityParticipants", "p2")));
    const snap = await assertSucceeds(familyQuery(db, ["S-1", "S-2"]));
    expect(ids(snap)).toEqual(["p1", "p2"]);
  });

  it("le parent ne lit pas l'inscription d'un autre enfant", async () => {
    const db = as("parent");
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p3")));
    await assertFails(familyQuery(db, ["S-1", "S-3"]));
    await assertFails(familyQuery(db, ["S-3"]));
    expect(ids(await assertSucceeds(familyQuery(as("autreParent"), ["S-9"])))).toEqual([]);
  });

  it("le parent ne lit ni un participant du personnel, ni un externe, ni un participant sans type", async () => {
    const db = as("parent");
    // « p_staff » porte referenceId S-1 (élève lié) mais n'est pas de type « طالب ».
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p_staff")));
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p_ext")));
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p_notype")));
    await assertFails(getDocs(query(parts(db), where("participantType", "==", "أستاذ / محفظ"), where("referenceId", "in", ["S-1"]))));
    // La requête filtrée de la famille ne renvoie jamais ces documents.
    expect(ids(await assertSucceeds(familyQuery(db, ["S-1"])))).toEqual(["p1"]);
  });

  it("le parent ne peut pas lister toute la collection, ni filtrer sur un seul champ", async () => {
    const db = as("parent");
    await assertFails(getDocs(parts(db)));
    await assertFails(getDocs(query(parts(db), where("referenceId", "in", ["S-1", "S-2"]))));
    await assertFails(getDocs(query(parts(db), where("participantType", "==", "طالب"))));
    await assertFails(getDocs(query(parts(db), where("activityId", "==", "act1"))));
  });

  it("l'élève lit seulement la sienne", async () => {
    const db = as("eleve");
    await assertSucceeds(getDoc(doc(db, "schools", S, "activityParticipants", "p1")));
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p2")));
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p_staff")));
    expect(ids(await assertSucceeds(familyQuery(db, ["S-1"])))).toEqual(["p1"]);
    await assertFails(familyQuery(db, ["S-1", "S-2"]));
    await assertFails(getDocs(parts(db)));
  });

  it("la famille n'écrit rien : ni création, ni modification, ni suppression", async () => {
    for (const uid of ["parent", "eleve"]) {
      const db = as(uid);
      await assertFails(setDoc(doc(db, "schools", S, "activityParticipants", "nouveau"), participant("nouveau", "S-1", "طالب")));
      await assertFails(updateDoc(doc(db, "schools", S, "activityParticipants", "p1"), { paidAmount: 50, paymentStatus: "مدفوع" }));
      await assertFails(deleteDoc(doc(db, "schools", S, "activityParticipants", "p1")));
    }
  });

  it("aucun accès aux dépenses d'activité pour la famille", async () => {
    for (const uid of ["parent", "eleve"]) {
      const db = as(uid);
      await assertFails(getDoc(doc(db, "schools", S, "activityExpenses", "e1")));
      await assertFails(getDocs(collection(db, "schools", S, "activityExpenses")));
      await assertFails(getDocs(query(collection(db, "schools", S, "activityExpenses"), where("activityId", "==", "act1"))));
    }
  });

  it("le personnel garde ses droits (lecture complète, écriture éducateurs), sauf entretien", async () => {
    for (const uid of ["directeur", "prof", "benevole"]) {
      expect(ids(await assertSucceeds(getDocs(parts(as(uid)))))).toEqual(["p1", "p2", "p3", "p_ext", "p_notype", "p_staff"]);
    }
    await assertSucceeds(setDoc(doc(as("directeur"), "schools", S, "activityParticipants", "n1"), participant("n1", "S-3", "طالب")));
    await assertSucceeds(updateDoc(doc(as("prof"), "schools", S, "activityParticipants", "n1"), { paidAmount: 50 }));
    await assertFails(setDoc(doc(as("benevole"), "schools", S, "activityParticipants", "n2"), participant("n2", "S-3", "طالب")));
    await assertSucceeds(deleteDoc(doc(as("directeur"), "schools", S, "activityParticipants", "n1")));
    await assertFails(getDocs(parts(as("menage"))));
    await assertFails(getDoc(doc(as("menage"), "schools", S, "activityParticipants", "p1")));
    await assertSucceeds(getDocs(collection(as("directeur"), "schools", S, "activityExpenses")));
  });

  it("une autre école est refusée", async () => {
    // Parent de l'école « autre » (même élève S-1) : rien dans l'école « ecole ».
    const db = as("parentAutreEcole");
    await assertFails(getDoc(doc(db, "schools", S, "activityParticipants", "p1")));
    await assertFails(familyQuery(db, ["S-1"], S));
    // Et ce qui est lu chez soi reste cloisonné.
    expect(ids(await assertSucceeds(familyQuery(db, ["S-1"], AUTRE)))).toEqual(["q1"]);
    // Le parent de « ecole » ne lit rien dans « autre » ; le directeur de « ecole » non plus.
    await assertFails(getDoc(doc(as("parent"), "schools", AUTRE, "activityParticipants", "q1")));
    await assertFails(familyQuery(as("parent"), ["S-1"], AUTRE));
    await assertFails(getDocs(parts(as("directeur"), AUTRE)));
  });
});
