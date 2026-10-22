import { describe, expect, it } from "vitest";

import { MAX_INLINE_PHOTO_CHARS, shrinkInlinePhotos, type DataUrlCompressor } from "../../src/utils/imageCompression";

const big = "data:image/png;base64," + "A".repeat(MAX_INLINE_PHOTO_CHARS + 10);

describe("photos base64 : filet de sécurité avant écriture (D51)", () => {
  it("recompresse une photo trop lourde, laisse le reste intact", async () => {
    const calls: number[] = [];
    const fake: DataUrlCompressor = async (_d, side) => { calls.push(side); return "data:image/jpeg;base64,PETITE"; };
    const input = { id: "t1", fullName: "x", photo: big, phone: "06" };
    const out = await shrinkInlinePhotos(input, fake);
    expect(out).toEqual({ id: "t1", fullName: "x", photo: "data:image/jpeg;base64,PETITE", phone: "06" });
    expect(input.photo).toBe(big); // objet d'origine non modifié
    expect(calls).toEqual([512]);
  });

  it("deuxième passe plus forte si la première ne suffit pas ; jamais plus gros qu'avant", async () => {
    const calls: number[] = [];
    const stillBig: DataUrlCompressor = async (_d, side) => { calls.push(side); return side === 512 ? big + "X" : "data:image/jpeg;base64,OK"; };
    expect((await shrinkInlinePhotos({ associationLogo: big }, stillBig)).associationLogo).toBe("data:image/jpeg;base64,OK");
    expect(calls).toEqual([512, 320]);
    const worse: DataUrlCompressor = async () => big + "XXXX";
    expect((await shrinkInlinePhotos({ photo: big }, worse)).photo).toBe(big);
  });

  it("URL, petites images et champs absents : aucun appel", async () => {
    let called = false;
    const spy: DataUrlCompressor = async (d) => { called = true; return d; };
    const doc = { photo: "https://images.unsplash.com/x.jpg", photoUrl: "data:image/jpeg;base64,abc", logo: undefined };
    expect(await shrinkInlinePhotos(doc, spy)).toBe(doc);
    expect(called).toBe(false);
  });

  it("hors navigateur, le compresseur par défaut renvoie l'image telle quelle", async () => {
    const { canvasCompressor } = await import("../../src/utils/imageCompression");
    expect(await canvasCompressor("data:image/png;base64,xx", 512, 0.8)).toBe("data:image/png;base64,xx");
  });
});
