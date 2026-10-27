/** Ordre des notifications : la plus récente d'abord, stable quel que soit l'ordre d'arrivée. */
import { describe, expect, it } from "vitest";
import { compareNotificationsNewestFirst, sortNotificationsNewestFirst, type Notification } from "../../src/types";

const n = (id: string, date: string): Notification => ({ id, title: id, message: "", date, type: "نجاح", isRead: false });

describe("sortNotificationsNewestFirst", () => {
  it("trie par jour, la plus récente d'abord", () => {
    const list = [n("a", "2026-09-01"), n("b", "2026-10-25"), n("c", "2026-10-20")];
    expect(sortNotificationsNewestFirst(list).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("même jour : l'horodatage de l'identifiant départage", () => {
    const list = [n("n_1761500000000", "2026-10-26"), n("n_1761560000000", "2026-10-26"), n("n_1761530000000", "2026-10-26")];
    expect(sortNotificationsNewestFirst(list).map((x) => x.id)).toEqual(["n_1761560000000", "n_1761530000000", "n_1761500000000"]);
  });

  it("même résultat quel que soit l'ordre d'arrivée (cache local ou Firestore)", () => {
    const list = [n("n_1761500000000", "2026-10-26"), n("x", "2026-10-27"), n("n_1761560000000", "2026-10-26"), n("old", "2026-01-01")];
    const a = sortNotificationsNewestFirst(list).map((x) => x.id);
    const b = sortNotificationsNewestFirst([...list].reverse()).map((x) => x.id);
    expect(a).toEqual(["x", "n_1761560000000", "n_1761500000000", "old"]);
    expect(b).toEqual(a);
  });

  it("ne modifie pas la liste d'origine ; date absente en dernier", () => {
    const list = [n("sans", ""), n("b", "2026-10-25")];
    const copy = [...list];
    expect(sortNotificationsNewestFirst(list).map((x) => x.id)).toEqual(["b", "sans"]);
    expect(list).toEqual(copy);
    expect(compareNotificationsNewestFirst(list[1], list[1])).toBe(0);
  });
});
