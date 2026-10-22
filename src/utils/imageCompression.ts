/**
 * Filet de sécurité de la couche données pour les photos encore stockées en
 * base64 dans les documents (D51) : une photo trop lourde est recompressée
 * avant l'écriture Firestore. Sans cela, une fiche du personnel avec une photo
 * de 2 Mo (base64 ≈ 2,7 Mo) dépassait la limite de 1 Mio d'un document et
 * l'enregistrement échouait EN SILENCE (perte de la fiche entière).
 */

/** Champs image connus des documents (élèves, personnel, paramètres de l'école). */
export const PHOTO_FIELDS = ["photo", "photoUrl", "associationLogo", "logo"] as const;

/** Au-delà de ce nombre de caractères (~300 Ko de base64), l'image est recompressée. */
export const MAX_INLINE_PHOTO_CHARS = 400_000;

export type DataUrlCompressor = (dataUrl: string, maxSide: number, quality: number) => Promise<string>;

/** Compression par canvas (navigateur) ; renvoie l'image d'origine en cas d'échec. */
export const canvasCompressor: DataUrlCompressor = (dataUrl, maxSide, quality) =>
  new Promise((resolve) => {
    if (typeof document === "undefined" || typeof Image === "undefined") return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const isDataImage = (v: unknown): v is string => typeof v === "string" && v.startsWith("data:image/");

/**
 * Recompresse les champs image en base64 trop lourds (512 px puis 320 px si
 * besoin). Les URL (http, chemins) et les petites images sont laissées telles
 * quelles. Ne modifie pas l'objet reçu.
 */
export async function shrinkInlinePhotos<T extends Record<string, any>>(
  data: T,
  compress: DataUrlCompressor = canvasCompressor,
  maxChars = MAX_INLINE_PHOTO_CHARS,
): Promise<T> {
  let out: T = data;
  for (const field of PHOTO_FIELDS) {
    const value = data[field];
    if (!isDataImage(value) || value.length <= maxChars) continue;
    let next = await compress(value, 512, 0.8);
    if (next.length > maxChars) next = await compress(value, 320, 0.7);
    if (next.length < value.length) out = { ...out, [field]: next };
  }
  return out;
}
