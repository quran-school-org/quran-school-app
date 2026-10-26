/**
 * Fenêtre de saisie d'un résultat d'examen (charte « لوحة الكتّاب »).
 * Mêmes champs, mêmes valeurs et même enregistrement qu'auparavant.
 */
import { useApp } from "../../app/AppContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";
import { MENTIONS, suggestMention, type Mention } from "../../utils/gradeMention";

export default function GradeFormModal() {
  const {
    students, setShowGradeModal, gradeStudentId, setGradeStudentId, gradePortion, setGradePortion,
    gradeMemorization, setGradeMemorization, gradeTajweed, setGradeTajweed, gradeOverall, setGradeOverall,
    gradeNotes, setGradeNotes, handleSaveGrade, gradeOverallManual, setGradeOverallManual,
  } = useApp();
  const close = () => setShowGradeModal(false);
  const suggestion = suggestMention(gradeMemorization, gradeTajweed);

  /** Saisie d'une note : la mention est (re)proposée tant que l'enseignant ne l'a pas choisie lui-même. */
  const changeGrade = (which: "mem" | "taj", raw: string) => {
    const mem = which === "mem" ? raw : gradeMemorization;
    const taj = which === "taj" ? raw : gradeTajweed;
    if (which === "mem") setGradeMemorization(raw);
    else setGradeTajweed(raw);
    if (!gradeOverallManual) setGradeOverall(suggestMention(mem, taj) ?? "");
  };

  return (
    <Modal
      modalId="grade-form"
      size="sm"
      title="رصد نتيجة اختبار وشهادة"
      onClose={close}
      onSubmit={handleSaveGrade}
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">تسجيل وإصدار الشهادة</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="الطالب الممتحن">
          {(id) => (
            <Select id={id} value={gradeStudentId} onChange={(v) => setGradeStudentId(v)}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label="الجزء أو السور الممتحن فيها">
          {(id) => <Input id={id} type="text" required value={gradePortion} onChange={(e: any) => setGradePortion(e.target.value)} placeholder="مثال: من الحزب 1 إلى 5" />}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="درجة جودة الحفظ (من 20)">
            {(id) => <Input id={id} type="number" inputMode="decimal" step="0.25" min="0" max="20" required value={gradeMemorization} onChange={(e: any) => changeGrade("mem", e.target.value)} placeholder="0 – 20" className="tabular-nums" />}
          </FormField>
          <FormField label="درجة جودة التجويد (من 20)">
            {(id) => <Input id={id} type="number" inputMode="decimal" step="0.25" min="0" max="20" required value={gradeTajweed} onChange={(e: any) => changeGrade("taj", e.target.value)} placeholder="0 – 20" className="tabular-nums" />}
          </FormField>
        </div>
        <FormField
          label="التقدير الإجمالي والتحفيزي"
          hint={suggestion ? (gradeOverallManual && gradeOverall !== suggestion ? `التقدير المقترح من الدرجتين: ${suggestion}` : "مقترح تلقائياً من الدرجتين، ويمكنك تغييره.") : "يُقترح التقدير بعد إدخال الدرجتين."}
        >
          {(id) => (
            <Select
              id={id}
              required
              value={gradeOverall}
              placeholder="-- اختر التقدير --"
              onChange={(v) => { setGradeOverall(v as Mention); setGradeOverallManual(true); }}
            >
              {MENTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label="ملاحظات تربوية من المعلم">
          {(id) => <Textarea id={id} rows={2} value={gradeNotes} onChange={(e: any) => setGradeNotes(e.target.value)} placeholder="سرعة جيدة، انتبه لمخارج الحروف..." className="resize-none" />}
        </FormField>
      </div>
    </Modal>
  );
}
