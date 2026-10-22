/**
 * Carte du ḥifẓ (maquette « خريطة الحفظ ») : 60 colonnes, une par ḥizb, un point
 * par élève ; un clic sur un ḥizb affiche les noms de ses élèves.
 */
import React, { useMemo } from "react";
import { cx } from "./cx";
import { GeometricPattern } from "./GeometricPattern";

export interface HifzStudent {
  id: string;
  name: string;
  hizb: number;
}

const MAX_DOTS = 20;

export function hizbOf(count: number | string | undefined | null): number {
  const n = Math.round(Number(count) || 0);
  return Math.max(0, Math.min(60, n));
}

export function HifzMap({ students, selected, onSelect, title = "خريطة الحفظ", description, className }: {
  students: HifzStudent[];
  selected: number;
  onSelect: (hizb: number) => void;
  title?: string;
  description?: React.ReactNode;
  className?: string;
}) {
  const byHizb: Map<number, HifzStudent[]> = useMemo(() => {
    const m = new Map<number, HifzStudent[]>();
    for (const s of students) {
      const h = hizbOf(s.hizb);
      if (h < 1) continue;
      if (!m.has(h)) m.set(h, []);
      m.get(h)!.push(s);
    }
    return m;
  }, [students]);
  const onMap = Array.from(byHizb.values()).reduce((a, l) => a + l.length, 0);
  const furthest = byHizb.size ? Math.max(...byHizb.keys()) : 0;
  const selList = byHizb.get(selected) || [];
  const selCount = selList.length === 0 ? "لا يوجد طالب في هذا الحزب بعد" : selList.length === 1 ? "طالب واحد" : `${selList.length} طلاب`;

  return (
    <section aria-labelledby="hifz-map-title" className={cx("relative bg-night rounded-3xl px-5 sm:px-7 pt-6 sm:pt-7 pb-6 text-night-text overflow-hidden", className)}>
      <GeometricPattern size={64} opacity={0.09} />
      <div className="relative flex flex-wrap justify-between items-start gap-x-8 gap-y-4">
        <div className="flex flex-col gap-1.5 max-w-[56ch]">
          <h2 id="hifz-map-title" className="m-0 font-display font-semibold text-[24px] sm:text-[28px] text-gold-100">{title}</h2>
          <p className="m-0 text-[15px] text-night-muted leading-[1.7]">
            {description || "موقع كل طالب على الأحزاب الستين. كل نقطة طالب. اختر حزباً لعرض أسماء طلابه."}
          </p>
        </div>
        <div className="flex gap-7">
          <div className="flex flex-col">
            <span className="text-[34px] font-bold text-white tabular-nums leading-[1.1]">{onMap}</span>
            <span className="text-[13px] text-night-muted">طالباً على الخريطة</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[34px] font-bold text-gold tabular-nums leading-[1.1]">{furthest}</span>
            <span className="text-[13px] text-night-muted">أبعد حزب بلغه طالب</span>
          </div>
        </div>
      </div>

      <div className="relative mt-6 overflow-x-auto pb-1" tabIndex={0} role="region" aria-label="الأحزاب الستون، مرّر أفقياً">
        <div className="min-w-[760px]">
          <div role="group" aria-label="الأحزاب الستون" className="grid gap-0.5 h-[236px] items-stretch" style={{ gridTemplateColumns: "repeat(60, minmax(0, 1fr))" }}>
            {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
              const here = byHizb.get(n) || [];
              const on = n === selected;
              const shown = here.slice(0, MAX_DOTS);
              return (
                <button
                  key={n}
                  type="button"
                  data-hizb={n}
                  onClick={() => onSelect(n)}
                  aria-label={`الحزب ${n}، ${here.length} طالب`}
                  aria-pressed={on}
                  className={cx("flex flex-col-reverse items-center gap-[3px] py-1 border-0 rounded-md min-w-0 cursor-pointer transition-colors", on ? "bg-gold/[0.22]" : "bg-transparent hover:bg-gold/[0.12]")}
                >
                  {shown.map((s, i) => (
                    <span key={s.id} className="hifz-dot w-2 h-2 rounded-full shrink-0" style={{ background: on ? "#FFE08A" : "#D4A017", animationDelay: `${120 + n * 45 + i * 28}ms` }} />
                  ))}
                  {here.length > MAX_DOTS && <span className="text-[9px] font-bold text-gold-light leading-none">+{here.length - MAX_DOTS}</span>}
                </button>
              );
            })}
          </div>
          <div aria-hidden="true" className="grid gap-0.5 border-t border-night-line pt-1" style={{ gridTemplateColumns: "repeat(60, minmax(0, 1fr))" }}>
            {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
              const major = n === 1 || n % 10 === 0;
              return (
                <span key={n} className="flex flex-col items-center gap-1 min-w-0">
                  <span className="w-px" style={{ height: major ? 10 : 4, background: major ? "#D4A017" : "#3A5785" }} />
                  <span className="text-[11.5px] text-night-muted tabular-nums h-[15px] whitespace-nowrap">{major ? n : ""}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div aria-live="polite" className="relative mt-[18px] flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-4 py-3.5 rounded-[14px] bg-white/[0.06] border border-night-line">
        <span className="font-display text-[18px] text-gold-100">الحزب {selected}</span>
        <span className="text-[14px] text-night-muted">{selCount}</span>
        <span className="flex flex-wrap gap-1.5">
          {selList.map((s) => (
            <span key={s.id} className="text-[13.5px] px-2.5 py-1 rounded-full bg-gold/[0.16] text-[#FFF2C7]">{s.name}</span>
          ))}
        </span>
      </div>
    </section>
  );
}
