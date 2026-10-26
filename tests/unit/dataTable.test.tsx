/**
 * DataTable (UI-06, D89) : tableau à partir de `md`, cartes en dessous
 * (une seule variante rendue), actions conservées dans les deux cas.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { DataTable, type DataColumn } from "../../src/ui/DataTable";

interface Row { id: string; name: string; phone: string; hizb: number; docs: string }
const ROWS: Row[] = [
  { id: "a", name: "ياسين العلمي", phone: "0661000001", hizb: 12, docs: "كاملة" },
  { id: "b", name: "مريم العلمي", phone: "0661000002", hizb: 7, docs: "ناقصة" },
];
const COLUMNS: DataColumn<Row>[] = [
  { id: "name", header: "الطالب", card: "title", cell: (r) => <b>{r.name}</b> },
  { id: "phone", header: "الهاتف", card: "field", cell: (r) => r.phone },
  { id: "hizb", header: "الأحزاب", card: "field", cardLabel: "الحفظ", cell: (r) => r.hizb },
  { id: "docs", header: "الأوراق", cell: (r) => r.docs },
];

function render(matches: boolean, extra: Record<string, unknown> = {}) {
  (globalThis as any).window = { matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }) };
  return renderToStaticMarkup(
    <DataTable label="قائمة" rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS} actions={(r) => <button>تعديل {r.name}</button>} {...extra} />,
  );
}

afterEach(() => { delete (globalThis as any).window; });

describe("DataTable", () => {
  it("à partir de md : un tableau, toutes les colonnes, actions en dernière colonne", () => {
    const html = render(true);
    expect(html).toContain("<table");
    expect(html).not.toContain("data-data-cards");
    for (const h of ["الطالب", "الهاتف", "الأحزاب", "الأوراق", "الإجراءات"]) expect(html).toContain(h);
    expect(html.match(/<tr/g)).toHaveLength(3);
  });

  it("sous md : des cartes (nom en titre, champs libellés, actions en pied), sans tableau", () => {
    const html = render(false);
    expect(html).not.toContain("<table");
    expect(html).toContain("data-data-cards");
    expect(html.match(/data-card=""/g)).toHaveLength(2);
    expect(html).toContain("ياسين العلمي");
    expect(html).toContain("<dt");
    expect(html).toContain("الحفظ"); // libellé propre à la carte
    expect(html).toContain("الهاتف");
    expect(html).not.toContain("الأوراق"); // colonne réservée au tableau
    expect(html).toContain("تعديل مريم العلمي");
  });

  it("ligne cliquable : la carte porte un vrai bouton", () => {
    const html = render(false, { onRowClick: () => {}, isSelected: (r: Row) => r.id === "a" });
    expect(html.match(/<button[^>]*aria-pressed/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="true"');
  });
});
