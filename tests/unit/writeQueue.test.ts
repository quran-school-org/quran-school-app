/** File d'écritures par document : plus de commits concurrents sur le même document (D100). */
import { describe, expect, it } from "vitest";
import { serializeWrites } from "../../src/utils/writeQueue";

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("serializeWrites", () => {
  it("n'exécute jamais deux tâches d'une même clé en même temps, dans l'ordre d'appel", async () => {
    let running = 0;
    let maxRunning = 0;
    const order: string[] = [];
    const task = (name: string, ms: number) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await tick(ms);
      order.push(name);
      running--;
      return name;
    };
    const results = await Promise.all([
      serializeWrites("users/u1", task("lastSchoolId", 20)),
      serializeWrites("users/u1", task("lastLogin", 1)),
      serializeWrites("users/u1", task("passwordChangedAt", 5)),
    ]);
    expect(results).toEqual(["lastSchoolId", "lastLogin", "passwordChangedAt"]);
    expect(order).toEqual(["lastSchoolId", "lastLogin", "passwordChangedAt"]);
    expect(maxRunning).toBe(1);
  });

  it("laisse des clés différentes s'exécuter en parallèle", async () => {
    let running = 0;
    let maxRunning = 0;
    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await tick(15);
      running--;
    };
    await Promise.all([serializeWrites("users/u1", task), serializeWrites("schools/a/members/u1", task)]);
    expect(maxRunning).toBe(2);
  });

  it("une tâche en échec rejette son appelant mais ne bloque pas la suivante", async () => {
    const failing = serializeWrites("users/u2", async () => {
      throw new Error("refusée");
    });
    const next = serializeWrites("users/u2", async () => "suite");
    await expect(failing).rejects.toThrow("refusée");
    await expect(next).resolves.toBe("suite");
  });

  it("une écriture lancée après la fin des précédentes part tout de suite", async () => {
    await serializeWrites("users/u3", async () => 1);
    await expect(serializeWrites("users/u3", async () => 2)).resolves.toBe(2);
  });
});
