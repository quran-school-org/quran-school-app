import { describe, expect, it } from "vitest";
import { childActivityState, sortFamilyActivities } from "../../src/screens/family/familyActivities";
import type { ActivityParticipant, ActivityTrip } from "../../src/types";

const act = (id: string, startDate: string, status: ActivityTrip["status"], extra: Partial<ActivityTrip> = {}) =>
  ({ id, title: id, type: "رحلة استكشافية", startDate, location: "x", leaderIds: [], contributionFee: 10, status, targetAudience: "عام", createdAt: "2026-01-01", ...extra }) as ActivityTrip;
const part = (extra: Partial<ActivityParticipant>) =>
  ({ id: "p", activityId: "a1", participantType: "طالب", referenceId: "S-1", fullName: "x", fee: 50, paidAmount: 0, paymentStatus: "غير مدفوع", registeredAt: "2026-01-01", ...extra }) as ActivityParticipant;

describe("sortFamilyActivities", () => {
  it("à venir par date croissante, puis passées de la plus récente à la plus ancienne, archivées écartées", () => {
    const list = [
      act("vieille", "2026-01-01", "مكتمل"),
      act("loin", "2026-12-01", "مخطط له"),
      act("proche", "2026-11-01", "قيد التسجيل"),
      act("encours", "2026-10-20", "قيد التنفيذ", { endDate: "2026-10-28" }),
      act("recente", "2026-10-01", "مكتمل"),
      act("annulee", "2026-11-05", "ملغى"),
      act("archivee", "2026-11-02", "مخطط له", { isArchived: true }),
    ];
    expect(sortFamilyActivities(list, "2026-10-26").map((a) => a.id)).toEqual(["encours", "proche", "loin", "annulee", "recente", "vieille"]);
  });
});

describe("childActivityState", () => {
  it("non inscrit : aucun participant, ou participant du personnel / d'un autre élève", () => {
    expect(childActivityState([], "a1", "S-1")).toEqual({ kind: "none" });
    expect(childActivityState([part({ participantType: "أستاذ / محفظ" })], "a1", "S-1")).toEqual({ kind: "none" });
    expect(childActivityState([part({ referenceId: "S-2" })], "a1", "S-1")).toEqual({ kind: "none" });
    expect(childActivityState([part({ activityId: "a2" })], "a1", "S-1")).toEqual({ kind: "none" });
  });

  it("inscrit : payé, partiel, non payé, exonéré", () => {
    expect(childActivityState([part({ paidAmount: 50, paymentStatus: "مدفوع" })], "a1", "S-1")).toMatchObject({ kind: "registered", payment: "paid", remaining: 0 });
    expect(childActivityState([part({ paidAmount: 20, paymentStatus: "مدفوع جزئياً" })], "a1", "S-1")).toMatchObject({ payment: "partial", paid: 20, remaining: 30 });
    expect(childActivityState([part({})], "a1", "S-1")).toMatchObject({ payment: "unpaid", remaining: 50 });
    expect(childActivityState([part({ paymentStatus: "معفى" })], "a1", "S-1")).toMatchObject({ payment: "exempt" });
    expect(childActivityState([part({ fee: 0 })], "a1", "S-1")).toMatchObject({ payment: "exempt" });
  });
});

describe("textes de présentation pour la famille", () => {
  it("repli : long ou sur plus de 4 lignes ; court ou vide non", async () => {
    const { isLongText, FAMILY_TEXT_FOLD_CHARS } = await import("../../src/screens/family/familyActivities");
    expect(isLongText("")).toBe(false);
    expect(isLongText("   ")).toBe(false);
    expect(isLongText(undefined)).toBe(false);
    expect(isLongText("نص قصير")).toBe(false);
    expect(isLongText("ا".repeat(FAMILY_TEXT_FOLD_CHARS))).toBe(false);
    expect(isLongText("ا".repeat(FAMILY_TEXT_FOLD_CHARS + 1))).toBe(true);
    expect(isLongText("1\n2\n3\n4")).toBe(false);
    expect(isLongText("1\n2\n3\n4\n5")).toBe(true);
    expect(isLongText("1\n\n\n2\n3\n4")).toBe(false); // lignes vides non comptées
  });

  it("ne reprend que description, programme et rendez-vous, aucune donnée financière", async () => {
    const { familyActivityTexts } = await import("../../src/screens/family/familyActivities");
    const t = familyActivityTexts(act("a", "2026-11-01", "مخطط له", { description: " وصف ", programDetails: "08:00 انطلاق", meetingPoint: " أمام المقر ", syncedNetBalance: 123, maxCapacity: 40 }));
    expect(t).toEqual({ description: "وصف", program: "08:00 انطلاق", meetingPoint: "أمام المقر" });
    expect(familyActivityTexts(act("b", "2026-11-01", "مخطط له"))).toEqual({ description: "", program: "", meetingPoint: "" });
  });
});
