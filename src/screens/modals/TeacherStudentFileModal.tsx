/**
 * Dossier pédagogique d'un élève côté enseignant (charte « لوحة الكتّاب »). Même logique qu'auparavant.
 */
import { checkUserPermission, TajweedLevel } from "../../types";
import { StudentAvatar } from "../../utils/studentAvatar";
import { BookOpen, Award, Trash2, Check, FileText } from "lucide-react";
import { Button, EmptyState, FormField, IconButton, Input, Ltr, Modal, Pill, Select, Textarea, cx } from "../../ui";
import { useApp } from "../../app/AppContext";

const TAJWEED_LEVELS: TajweedLevel[] = ["ممتاز", "متوسط", "ضعيف"];

/**
 * Valeur affichée dans la liste : seuls les niveaux du modèle (constat F5). Une
 * ancienne valeur « مبتدئ », proposée autrefois ici, s'affichait déjà « ضعيف ».
 */
function tajweedSelectValue(level: string | undefined): TajweedLevel {
  if (TAJWEED_LEVELS.includes(level as TajweedLevel)) return level as TajweedLevel;
  return level === "مبتدئ" ? "ضعيف" : "متوسط";
}

export default function TeacherStudentFileModal() {
  const {
    dailyProgress,
    currentUser,
    setShowTeacherStudentFileModal,
    teacherSelectedStudent,
    setTeacherSelectedStudent,
    progressDate,
    setProgressDate,
    progressMemorization,
    setProgressMemorization,
    progressRevision,
    setProgressRevision,
    progressOldRevision,
    setProgressOldRevision,
    progressRating,
    setProgressRating,
    progressNotes,
    setProgressNotes,
    currentRole,
    handleSaveDailyProgress,
    handleDeleteDailyProgress,
  } = useApp();
  // App.tsx n'affiche la fenêtre qu'avec un élève choisi.
  if (!teacherSelectedStudent) return null;

  const close = () => {
    setShowTeacherStudentFileModal(false);
    setTeacherSelectedStudent(null);
  };
  const canEdit = checkUserPermission(currentUser, currentRole, "students", "update") || checkUserPermission(currentUser, currentRole, "teacher-students", "update");
  const records = dailyProgress.filter((dp) => dp.studentId === teacherSelectedStudent.id);
  const RATING_TONE: Record<string, any> = { "ممتاز": "success", "جيد جداً": "primary", "جيد": "warn", "مقبول": "warn" };
  const update = (patch: any) => setTeacherSelectedStudent((prev: any) => (prev ? { ...prev, ...patch } : null));

  return (
    <Modal
      modalId="teacher-student-file"
      size="lg"
      icon={
        <span className="w-11 h-11 rounded-full overflow-hidden border border-line bg-sunken inline-flex">
          <StudentAvatar student={teacherSelectedStudent} alt={teacherSelectedStudent.fullName} className="w-full h-full object-cover" />
        </span>
      }
      title={`الملف التعليمي للطالب: ${teacherSelectedStudent.fullName}`}
      subtitle={`رقم العضوية: ${teacherSelectedStudent.id}`}
      onClose={close}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 flex flex-col gap-5">
          {canEdit && (
            <>
              <section className="rounded-2xl border border-line bg-white p-4 flex flex-col gap-3" aria-labelledby="tsf-status">
                <h3 id="tsf-status" className="m-0 flex items-center gap-2 font-sans font-semibold text-[15px] text-primary pb-2 border-b border-line-soft">
                  <BookOpen className="w-4 h-4 text-gold-700" strokeWidth={1.75} aria-hidden="true" />تعديل الحالة الراهنة وبيانات التدريس
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="السورة الحالية">
                    {(id) => <Input id={id} type="text" value={teacherSelectedStudent.currentSurah || ""} onChange={(e: any) => update({ currentSurah: e.target.value })} placeholder="مثال: البقرة - الآية 142" />}
                  </FormField>
                  <FormField label="مستوى التجويد الحالي">
                    {(id) => (
                      <Select id={id} value={tajweedSelectValue(teacherSelectedStudent.tajweedLevel)} onChange={(e: any) => update({ tajweedLevel: e.target.value as TajweedLevel })}>
                        <option value="ممتاز">ممتاز (مخارج صحيحة وأحكام كاملة)</option>
                        <option value="متوسط">متوسط (يحتاج لبعض التوجيه)</option>
                        <option value="ضعيف">ضعيف (يتعلم القواعد الأساسية)</option>
                      </Select>
                    )}
                  </FormField>
                  <FormField label="عدد الأحزاب المحفوظة فعلياً">
                    {(id) => <Input id={id} type="number" min="0" max="60" value={teacherSelectedStudent.hizbCount ?? 1} onChange={(e: any) => update({ hizbCount: Number(e.target.value) })} className="tabular-nums" />}
                  </FormField>
                  <FormField label="رأي وتوجيهات عامة للمعلم">
                    {(id) => <Input id={id} type="text" placeholder="ملاحظات وسلوكيات الطالب العامة..." value={teacherSelectedStudent.notes || ""} onChange={(e: any) => update({ notes: e.target.value })} />}
                  </FormField>
                </div>
              </section>

              <form onSubmit={handleSaveDailyProgress} className="rounded-2xl border border-line bg-white p-4 flex flex-col gap-3" aria-labelledby="tsf-daily">
                <h3 id="tsf-daily" className="m-0 flex items-center gap-2 font-sans font-semibold text-[15px] text-primary pb-2 border-b border-line-soft">
                  <Award className="w-4 h-4 text-gold-700" strokeWidth={1.75} aria-hidden="true" />تسجيل تقييم ومتابعة الحفظ اليومي
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="تاريخ المتابعة">
                    {(id) => <Input id={id} type="date" value={progressDate} onChange={(e: any) => setProgressDate(e.target.value)} required />}
                  </FormField>
                  <FormField label="الحفظ الجديد (Sabaq)">
                    {(id) => <Input id={id} type="text" placeholder="مثال: من آية 1 إلى آية 15" value={progressMemorization} onChange={(e: any) => setProgressMemorization(e.target.value)} />}
                  </FormField>
                  <FormField label="المراجعة القريبة (Kum - الأجزاء القريبة)">
                    {(id) => <Input id={id} type="text" placeholder="مثال: سورة البقرة بالكامل" value={progressRevision} onChange={(e: any) => setProgressRevision(e.target.value)} />}
                  </FormField>
                  <FormField label="المراجعة البعيدة (Sabqi - القديم)">
                    {(id) => <Input id={id} type="text" placeholder="مثال: الجزء الأول والثاني" value={progressOldRevision} onChange={(e: any) => setProgressOldRevision(e.target.value)} />}
                  </FormField>
                </div>
                <fieldset className="m-0 p-0 border-0 flex flex-col gap-1.5">
                  <legend className="text-[13.5px] font-semibold text-ink-2 mb-1.5">التقييم والتقدير اليومي</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={progressRating === r}
                        onClick={() => setProgressRating(r)}
                        className={cx("min-h-11 px-4 rounded-[10px] border text-[13.5px] font-semibold cursor-pointer transition-colors", progressRating === r ? "bg-primary border-primary text-white" : "bg-white border-line text-ink-2 hover:border-ink-4")}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <FormField label="ملاحظات وتوجيهات الحفظ اليومي">
                  {(id) => <Textarea id={id} rows={2} placeholder="توجيهات محددة لهذا اليوم لولي الأمر أو الطالب..." value={progressNotes} onChange={(e: any) => setProgressNotes(e.target.value)} />}
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" icon={<Check className="w-4 h-4" strokeWidth={1.75} />}>حفظ التغييرات وتسجيل المتابعة اليومية</Button>
                </div>
              </form>
            </>
          )}
        </div>

        <section className="lg:col-span-5 rounded-2xl border border-line bg-white p-4 flex flex-col gap-3 max-h-[70vh] overflow-hidden" aria-labelledby="tsf-history">
          <div className="flex justify-between items-center pb-2 border-b border-line-soft">
            <h3 id="tsf-history" className="m-0 flex items-center gap-2 font-sans font-semibold text-[15px] text-primary">
              <FileText className="w-4 h-4 text-gold-700" strokeWidth={1.75} aria-hidden="true" />تاريخ وسجلات الحفظ السابقة
            </h3>
            <Pill tone="neutral">{records.length} سجلات</Pill>
          </div>
          <div className="flex-1 overflow-y-auto">
            {records.length === 0 ? (
              <EmptyState icon={<BookOpen className="w-8 h-8" strokeWidth={1.5} />}>لا توجد أي سجلات متابعة مسجلة بعد لهذا الطالب.</EmptyState>
            ) : (
              <ol className="m-0 p-0 list-none relative border-s-2 border-line-soft ms-2 flex flex-col gap-4">
                {records
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((record) => (
                    <li key={record.id} className="relative ps-5">
                      <span aria-hidden="true" className="absolute top-2 -start-[7px] w-3 h-3 rounded-full bg-gold border-2 border-white" />
                      <div className="rounded-xl border border-line-soft bg-surface-2 p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center gap-2">
                          <Ltr className="text-[12.5px] text-ink-2 font-semibold">{record.date}</Ltr>
                          <span className="flex items-center gap-1.5">
                            <Pill tone={RATING_TONE[record.rating] || "danger"}>{record.rating}</Pill>
                            <IconButton size="sm" tone="danger" label="حذف هذا السجل" onClick={() => handleDeleteDailyProgress(record.id)}><Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} /></IconButton>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[13px] text-ink-2">
                          {record.memorizationPart && <p className="m-0"><strong className="text-primary">الحفظ الجديد:</strong> {record.memorizationPart}</p>}
                          {record.revisionPart && <p className="m-0"><strong className="text-primary">مراجعة قريبة:</strong> {record.revisionPart}</p>}
                          {record.oldRevisionPart && <p className="m-0"><strong className="text-ink">مراجعة بعيدة:</strong> {record.oldRevisionPart}</p>}
                          {record.notes && (
                            <p className="m-0 mt-1 rounded-lg border border-dashed border-line-strong bg-white p-2 text-[12.5px] text-ink-2 leading-relaxed">
                              <strong className="block text-ink mb-0.5">ملاحظات التقييم:</strong>
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
