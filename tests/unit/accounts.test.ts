import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as client from "../../src/security/accounts";
import * as fn from "../../functions/src/shared/accounts";

describe("correspondance compte applicatif ↔ Firebase Auth", () => {
  it("email technique déterministe et normalisé", () => {
    expect(client.usernameToEmail("  Admin_Alfajr ")).toBe("admin_alfajr@alfajr.local");
  });

  it("conserve la règle historique _secure_fajr pour les mots de passe < 6 caractères", () => {
    expect(client.normalizeAuthPassword("123")).toBe("123_secure_fajr");
    expect(client.normalizeAuthPassword("12345")).toBe("12345_secure_fajr");
    expect(client.normalizeAuthPassword("123456")).toBe("123456");
  });

  it("valide les nouveaux mots de passe (8 caractères minimum)", () => {
    expect(client.validateNewPassword("1234567")).not.toBeNull();
    expect(client.validateNewPassword(" espace-au-debut")).not.toBeNull();
    expect(client.validateNewPassword("motdepasse")).toBeNull();
  });

  it("accepte les identifiants historiques et refuse les caractères arabes", () => {
    expect(client.isValidUsername("mohammed_alaoui_2")).toBe(true);
    expect(client.isValidUsername("fatima.naciri")).toBe(true);
    expect(client.isValidUsername("أحمد")).toBe(false);
    expect(client.isValidUsername("a")).toBe(false);
  });

  it("la copie des Cloud Functions est identique au module client", () => {
    for (const key of Object.keys(client) as (keyof typeof client)[]) {
      expect(String((fn as any)[key]), key).toBe(String(client[key]));
    }
    const strip = (s: string) => s.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "");
    expect(strip(readFileSync("functions/src/shared/accounts.ts", "utf8"))).toBe(strip(readFileSync("src/security/accounts.ts", "utf8")));
  });
});
