/**
 * Fenêtre de saisie d'un résultat d'examen (charte « لوحة الكتّاب »).
 * Mêmes champs, mêmes valeurs et même enregistrement qu'auparavant.
 */
import { useApp } from "../../app/AppContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";

export default function GradeFormModal() {
  const {
    students, setShowGradeModal, gradeStudentId, setGradeStudentId, gradePortion, setGradePortion,
    gradeMemorization, setGradeMemorization, gradeTajweed, setGradeTajweed, gradeOverall, setGradeOverall,
    gradeNotes, setGradeNotes, handleSaveGrade,
  } = useApp();
  const close = () => setShowGradeModal(false);

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
          <Button type="submit" variant="primary">تسجيل واصدار الشهادة</Button>
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
            {(id) => <Input id={id} type="number" step="0.25" min="0" max="20" required value={gradeMemorization} onChange={(e: any) => setGradeMemorization(Number(e.target.value))} className="tabular-nums" />}
          </FormField>
          <FormField label="درجة جودة التجويد (من 20)">
            {(id) => <Input id={id} type="number" step="0.25" min="0" max="20" required value={gradeTajweed} onChange={(e: any) => setGradeTajweed(Number(e.target.value))} className="tabular-nums" />}
          </FormField>
        </div>
        <FormField label="التقدير الإجمالي والتحفيزي">
          {(id) => (
            <Select id={id} value={gradeOverall} onChange={(v) => setGradeOverall(v as any)}>
              <option value="ممتاز">ممتاز</option>
              <option value="جيد جداً">جيد جداً</option>
              <option value="جيد">جيد</option>
              <option value="مقبول">مقبول</option>
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
