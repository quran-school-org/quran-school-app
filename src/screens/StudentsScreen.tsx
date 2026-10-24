/**
 * Élèves : liste filtrable, fiche détaillée et aperçu de la carte.
 * Mêmes données, mêmes actions et mêmes droits que l'écran d'origine.
 */
import { Archive, Download, Edit3, Eye, FileJson, FileSpreadsheet, Phone, Plus, Printer, Search, Trash2, Users } from "lucide-react";
import { checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { useApp } from "../app/AppContext";
import { Button, Card, DropdownMenu, EmptyState, IconButton, Ltr, PageHeader, Pill, SearchInput, Select, Table, TableWrap, Td, Th, Tr, cx } from "../ui";
import StudentDossier, { StudentCardPreview } from "./students/StudentDossier";
import { tajweedTone } from "./students/tajweed";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} />;

function DocBadge({ ok, label, full }: { ok: boolean; label: string; full: string }) {
  return (
    <span title={`${full} : ${ok ? "مقدّمة" : "ناقصة"}`} className={cx("inline-flex items-center justify-center h-6 px-1.5 rounded-md text-[11.5px] font-semibold", ok ? "bg-success-100 text-success-700" : "bg-sunken text-ink-3 line-through decoration-ink-4")}>
      {label}
      <span className="sr-only">{ok ? " (مقدّمة)" : " (ناقصة)"}</span>
    </span>
  );
}

export default function StudentsScreen() {
  const {
    classes, currentUser, currentRole, searchQuery, setSearchQuery, studentArchiveFilter, setStudentArchiveFilter,
    selectedStudent, setSelectedStudent, filteredStudents, handleOpenStudentForm, handleDeleteStudent,
    handleToggleArchiveStudent, handlePrintStudentsReport, handleExportStudentsCSV, handleExportStudentsJSON,
  } = useApp();
  const can = (a: "create" | "update" | "delete" | "print") => checkUserPermission(currentUser, currentRole, "students", a);
  const title = currentRole === "طالب" ? "ملفي الشخصي وسجل الحفظ القرآني" : currentRole === "ولي أمر" ? "متابعة الأبناء وسجلات الحفظ" : "إدارة ملفات الطلاب والوثائق الإدارية";
  const description = currentRole === "طالب" ? "استعراض مقدار الحفظ الحالي، مستوى التجويد، والوثائق الإدارية المعتمدة." : "سجل معلومات الطلاب، تتبع أوراقهم، ومقدار حفظهم وتجويدهم.";
  const select = (st: any) => { setSelectedStudent(st); };

  return (
    <div data-screen="students" className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          can("create") && (
            <Button variant="primary" data-action="open-student-form" onClick={() => handleOpenStudentForm()} icon={ic(Plus, "w-[18px] h-[18px]")}>
              إضافة طالب جديد
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-end gap-2.5">
        <SearchInput
          icon={ic(Search)}
          aria-label="بحث باسم الطالب أو ولي الأمر"
          placeholder="بحث باسم الطالب أو ولي الأمر..."
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
          className="flex-[1_1_260px] max-w-md"
        />
        <Select aria-label="حالة الطلاب" value={studentArchiveFilter} onChange={(e: any) => setStudentArchiveFilter(e.target.value)} className="w-auto">
          <option value="active">الطلاب النشطون</option>
          <option value="archived">الطلاب المؤرشفون</option>
          <option value="all">الكل (نشط ومؤرشف)</option>
        </Select>
        {can("print") && (
          <DropdownMenu
            label="تصدير البيانات"
            icon={ic(Download, "w-[18px] h-[18px]")}
            buttonId="export-students-dropdown-btn"
            menuId="export-students-menu"
            items={[
              { id: "export-students-csv-btn", label: "تصدير بصيغة CSV", icon: ic(FileSpreadsheet), onClick: handleExportStudentsCSV },
              { id: "export-students-json-btn", label: "تصدير بصيغة JSON", icon: ic(FileJson), onClick: handleExportStudentsJSON },
              { id: "export-students-pdf-btn", label: "تصدير PDF / طباعة", icon: ic(Printer), onClick: handlePrintStudentsReport },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <Card padded={false} className="xl:col-span-2 overflow-hidden" aria-labelledby="students-list-title">
          <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-4 border-b border-line-soft">
            <h2 id="students-list-title" className="m-0 font-display font-semibold text-[20px] text-primary">قائمة طلاب النادي</h2>
            <span className="text-[13.5px] text-ink-2">تم العثور على <strong className="text-ink tabular-nums">{filteredStudents.length}</strong> طالب</span>
          </div>
          {filteredStudents.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ic(Users, "w-8 h-8")} title="لا نتائج">لا يوجد طلاب مسجلون يطابقون خيارات البحث الحالية.</EmptyState>
            </div>
          ) : (
            <TableWrap label="قائمة الطلاب">
              <Table>
                <thead>
                  <tr>
                    <Th>الطالب</Th>
                    <Th>ولي الأمر والهاتف</Th>
                    <Th className="text-center">أحزاب القرآن</Th>
                    <Th className="text-center">التجويد</Th>
                    <Th className="text-center">الأوراق الإدارية</Th>
                    <Th className="text-center">الإجراءات</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => {
                    const on = selectedStudent?.id === st.id;
                    return (
                      <Tr key={st.id} selected={on} onClick={() => select(st)} className="cursor-pointer">
                        <Td className={cx(on && "shadow-[inset_-3px_0_0_#D4A017]")}>
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <span className="w-10 h-10 rounded-full overflow-hidden bg-sunken shrink-0 border border-line">
                              <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                            </span>
                            <span className="flex flex-col min-w-0">
                              <span className="flex items-center gap-1.5">
                                <span className={cx("font-semibold text-[14.5px]", st.isArchived ? "text-ink-3 line-through" : "text-ink")}>{st.fullName}</span>
                                {st.isArchived && <Pill tone="neutral">مؤرشف</Pill>}
                              </span>
                              <span className="text-[12.5px] text-ink-3">ازدياد: <Ltr>{st.birthDate}</Ltr></span>
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <span className="block text-ink-2">{st.parentName}</span>
                          <span className="flex items-center gap-1 text-[12.5px] text-ink-3">{ic(Phone, "w-3.5 h-3.5")}<Ltr className="whitespace-nowrap">{st.parentPhone}</Ltr></span>
                        </Td>
                        <Td className="text-center whitespace-nowrap"><strong className="tabular-nums">{st.hizbCount}</strong> <span className="text-ink-3 text-[13px]">حزب</span></Td>
                        <Td className="text-center"><Pill tone={tajweedTone(st.tajweedLevel)}>{st.tajweedLevel}</Pill></Td>
                        <Td>
                          <div className="flex justify-center gap-1" aria-label="البطاقة الوطنية لولي الأمر / عقد الازدياد / صورتان">
                            <DocBadge ok={!!st.docParentId} label="بطاقة" full="البطاقة الوطنية لولي الأمر" />
                            <DocBadge ok={!!st.docBirthCert} label="عقد" full="عقد الازدياد" />
                            <DocBadge ok={!!st.docPhotos} label="صور" full="الصور الشمسية" />
                          </div>
                        </Td>
                        <Td onClick={(e: any) => e.stopPropagation()}>
                          <div className="flex justify-center gap-1.5">
                            {can("update") && (
                              <>
                                <IconButton size="sm" label="تعديل الطالب" onClick={() => handleOpenStudentForm(st)}>{ic(Edit3)}</IconButton>
                                <IconButton size="sm" label={st.isArchived ? "إلغاء الأرشفة (تنشيط)" : "أرشفة الطالب"} onClick={() => handleToggleArchiveStudent(st.id, st.fullName)}>{ic(Archive)}</IconButton>
                              </>
                            )}
                            {can("delete") && <IconButton size="sm" tone="danger" label="حذف الطالب" onClick={() => handleDeleteStudent(st.id, st.fullName)}>{ic(Trash2)}</IconButton>}
                            <IconButton size="sm" tone="primary" label="عرض التفاصيل" onClick={() => select(st)}>{ic(Eye)}</IconButton>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <StudentDossier classes={classes} />
      </div>

      {selectedStudent && <StudentCardPreview classes={classes} />}
    </div>
  );
}
