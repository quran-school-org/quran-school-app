/**
 * « الأنشطة والرحلات » des familles (parents et élèves ; D94) : vue simplifiée,
 * en lecture seule. Liste des activités et, pour chaque activité, la situation
 * de chaque enfant du compte (inscrit ou non, payé ou non). Aucune dépense,
 * aucun budget, aucun total financier, aucune liste d'autres participants.
 */
import { useId, useMemo, useState } from "react";
import { Calendar, ChevronDown, Clock, Compass, MapPin, Search, Wallet } from "lucide-react";
import type { ActivityParticipant, ActivityTrip, Student } from "../../types";
import { Card, EmptyState, Ltr, PageHeader, Pill, SearchInput, Select, type PillTone } from "../../ui";
import { foldForSearch } from "../../ui/textSearch";
import { formatMoney } from "../../utils/format";
import { FAMILY_ACTIVITIES_SEARCH_MIN, childActivityState, familyActivityTexts, isLongText, sortFamilyActivities } from "./familyActivities";

const STATUS_TONE: Record<string, PillTone> = { "مكتمل": "neutral", "قيد التسجيل": "primary", "قيد التنفيذ": "success", "ملغى": "danger", "مخطط له": "warn" };
const STATUSES = ["مخطط له", "قيد التسجيل", "قيد التنفيذ", "مكتمل", "ملغى"];
const ic = (C: any, cls = "w-3.5 h-3.5") => <C className={cls} strokeWidth={1.75} aria-hidden="true" />;

export interface FamilyActivitiesProps {
  activities: ActivityTrip[];
  participants: ActivityParticipant[];
  /** Enfants du compte (l'élève lui-même pour un compte élève). */
  children: Student[];
  isParent: boolean;
  today: string;
}

/** Texte libre de l'activité : replié (4 lignes) s'il est long, avec un vrai bouton « عرض المزيد / عرض أقل ». */
function FoldableText({ title, text, attr }: { title: string; text: string; attr: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const long = isLongText(text);
  return (
    <section data-activity-text={attr} aria-labelledby={`${id}-t`} className="flex flex-col gap-1">
      <h3 id={`${id}-t`} className="m-0 text-[13px] font-semibold text-ink-2">{title}</h3>
      <p id={`${id}-p`} className={`m-0 text-[14px] leading-relaxed text-ink whitespace-pre-line break-words ${long && !open ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-p`}
          onClick={() => setOpen((v) => !v)}
          className="self-start inline-flex items-center gap-1 min-h-11 -my-2 px-1 bg-transparent border-0 text-primary text-[13.5px] font-semibold cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded-md"
        >
          <span>{open ? "عرض أقل" : "عرض المزيد"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function ChildState({ participants, activityId, child }: { participants: ActivityParticipant[]; activityId: string; child: Student }) {
  const s = childActivityState(participants, activityId, child.id);
  return (
    <li data-child-state={child.id} data-registered={s.kind === "registered" ? "yes" : "no"} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5 border-t border-line-faint first:border-t-0">
      <span className="font-semibold text-[14.5px] text-ink min-w-0">{child.fullName}</span>
      {s.kind === "none" ? (
        <Pill tone="neutral">غير مسجّل</Pill>
      ) : (
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill tone="primary">مسجّل</Pill>
          {s.payment === "paid" && <Pill tone="success">مدفوع</Pill>}
          {s.payment === "exempt" && <Pill tone="neutral">معفى من المساهمة</Pill>}
          {s.payment === "unpaid" && <Pill tone="danger">غير مدفوع</Pill>}
          {s.payment === "partial" && <Pill tone="warn">مدفوع جزئياً</Pill>}
          {(s.payment === "partial" || s.payment === "unpaid") && (
            <span className="text-[13px] text-ink-2">
              {s.payment === "partial" && <>المدفوع: <strong className="text-ink tabular-nums">{formatMoney(s.paid)}</strong> · </>}
              المتبقي: <strong className="text-ink tabular-nums">{formatMoney(s.remaining)}</strong>
            </span>
          )}
        </span>
      )}
    </li>
  );
}

export default function FamilyActivities({ activities, participants, children, isParent, today }: FamilyActivitiesProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const sorted = useMemo(() => sortFamilyActivities(activities, today), [activities, today]);
  const withTools = sorted.length > FAMILY_ACTIVITIES_SEARCH_MIN;
  const q = foldForSearch(query);
  const shown = withTools
    ? sorted.filter((a) => (status === "all" || a.status === status) && (!q || foldForSearch(`${a.title} ${a.location || ""}`).includes(q)))
    : sorted;

  return (
    <div data-screen="activities" data-view="family" className="flex flex-col gap-6">
      <PageHeader
        title="الأنشطة والرحلات"
        description={isParent ? "الأنشطة والرحلات التي تنظمها المدرسة، ووضع تسجيل أبنائك ومساهماتهم في كل منها." : "الأنشطة والرحلات التي تنظمها المدرسة، ووضع تسجيلك ومساهمتك في كل منها."}
      />

      {withTools && (
        <div className="flex flex-wrap items-end gap-3">
          <SearchInput aria-label="بحث في الأنشطة" icon={ic(Search, "w-4 h-4")} value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder="بحث باسم النشاط أو الوجهة..." className="flex-[1_1_240px] max-w-sm" />
          <Select aria-label="حالة النشاط" value={status} onChange={(v) => setStatus(v)} className="w-full sm:w-auto">
            <option value="all">كل الحالات</option>
            {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
          </Select>
          <p role="status" className="m-0 text-[13px] text-ink-2">{shown.length} من {sorted.length}</p>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState icon={<Compass className="w-8 h-8" strokeWidth={1.5} />} title={sorted.length === 0 ? "لا توجد أنشطة حالياً" : "لا توجد أنشطة مطابقة للبحث"}>
          {sorted.length === 0 ? "ستظهر هنا الأنشطة والرحلات بمجرد أن تعلن عنها المدرسة." : undefined}
        </EmptyState>
      ) : (
        <ul className="m-0 p-0 list-none grid grid-cols-1 xl:grid-cols-2 gap-5 items-start" aria-label="قائمة الأنشطة">
          {shown.map((a) => {
            const t = familyActivityTexts(a);
            return (
            <li key={a.id} className="min-w-0">
              <Card as="article" data-activity={a.id} aria-labelledby={`act-${a.id}`} className="flex flex-col gap-3.5">
                <header className="flex flex-col gap-2">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Pill tone="primary" className="max-w-full whitespace-normal! text-start">{a.type}</Pill>
                    <Pill tone={STATUS_TONE[a.status] || "neutral"} className="max-w-full whitespace-normal! text-start">{a.status}</Pill>
                  </span>
                  <h2 id={`act-${a.id}`} className="m-0 font-display font-semibold text-[20px] leading-snug text-primary">{a.title}</h2>
                </header>
                <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-2">
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">التاريخ</dt>
                    {ic(Calendar)}
                    <dd className="m-0"><Ltr>{a.startDate}</Ltr>{a.endDate && a.endDate !== a.startDate && <> – <Ltr>{a.endDate}</Ltr></>}</dd>
                  </div>
                  {a.location && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <dt className="sr-only">المكان</dt>
                      {ic(MapPin)}
                      <dd className="m-0">{a.location}</dd>
                    </div>
                  )}
                  {t.meetingPoint && (
                    <div className="flex items-center gap-1.5 min-w-0" data-activity-meeting>
                      <dt className="sr-only">نقطة وساعة الانطلاق</dt>
                      {ic(Clock)}
                      <dd className="m-0">{t.meetingPoint}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ink-2 flex items-center gap-1.5">{ic(Wallet)}واجب المساهمة</dt>
                    <dd className="m-0"><strong className="text-primary tabular-nums">{formatMoney(a.contributionFee)}</strong></dd>
                  </div>
                </dl>
                {t.description && <FoldableText attr="description" title="الأهداف والوصف العام" text={t.description} />}
                {t.program && <FoldableText attr="program" title="البرنامج الزمني والتفصيلي" text={t.program} />}
                {children.length > 0 && (
                  <section aria-label={isParent ? "وضع تسجيل الأبناء" : "وضع تسجيلك"} className="rounded-xl bg-surface-2 border border-line-soft px-3.5 py-1">
                    <ul className="m-0 p-0 list-none">
                      {children.map((c) => <ChildState key={c.id} participants={participants} activityId={a.id} child={c} />)}
                    </ul>
                  </section>
                )}
              </Card>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
