/**
 * Élèves : liste filtrable, fiche détaillée et aperçu de la carte.
 * Mêmes données, mêmes actions et mêmes droits que l'écran d'origine.
 * Liste paginée (8 élèves par page, D83) : retour à la page 1 quand la
 * recherche ou le filtre change ; l'élève sélectionné garde sa fiche même
 * s'il n'est pas sur la page affichée (lien vers sa page).
 */
import { Archive, Download, Edit3, Eye, FileJson, FileSpreadsheet, Phone, Plus, Printer, Search, Trash2, Users } from "lucide-react";
import { checkUserPermission, type Student } from "../types";
import { isFamilyRole } from "../security/access";
import { StudentAvatar } from "../utils/studentAvatar";
import { useApp } from "../app/AppContext";
import { Button, Card, DataTable, DropdownMenu, EmptyState, FilterChips, IconButton, Ltr, PAGE_SIZES, PageHeader, Pagination, Pill, SearchInput, Select, SectionHeader, cx, pageOfIndex, usePagination, type DataColumn } from "../ui";
import { navLabel } from "../shell/navModel";
import StudentDossier from "./students/StudentDossier";
import { tajweedTone } from "./students/tajweed";
import { formatDateAr } from "../format/date";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} />;

function DocBadge({ ok, label, full }: { ok: boolean; label: string; full: string }) {
  return (
    <span title={`${full} : ${ok ? "مقدّمة" : "ناقصة"}`} className={cx("inline-flex items-center justify-center h-6 px-1.5 rounded-md text-caption font-semibold", ok ? "bg-success-100 text-success-700" : "bg-sunken text-ink-3 line-through decoration-ink-4")}>
      {label}
      <span className="sr-only">{ok ? " (مقدّمة)" : " (ناقصة)"}</span>
    </span>
  );
}

/** Nom, mention « مؤرشف » et date de naissance (titre de la carte sous `md`). */
const nameBlock = (st: Student) => (
  <span className="flex flex-col min-w-0">
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={cx("font-semibold text-body", st.isArchived ? "text-ink-3 line-through" : "text-ink")}>{st.fullName}</span>
      {st.isArchived && <Pill tone="neutral">مؤرشف</Pill>}
    </span>
    <span className="text-small text-ink-3">ازدياد: {formatDateAr(st.birthDate)}</span>
  </span>
);

export default function StudentsScreen() {
  const {
    classes, students, currentUser, currentRole, searchQuery, setSearchQuery, studentArchiveFilter, setStudentArchiveFilter,
    selectedStudent, setSelectedStudent, filteredStudents, handleOpenStudentForm, handleDeleteStudent,
    handleToggleArchiveStudent, handlePrintStudentsReport, handleExportStudentsCSV, handleExportStudentsJSON,
  } = useApp();
  const can = (a: "create" | "update" | "delete" | "print") => checkUserPermission(currentUser, currentRole, "students", a);
  // Parent, élève : ni export, ni filtre d'archivage (outils du personnel, U-04).
  const family = isFamilyRole(currentRole);
  const title = navLabel(currentRole, "students");
  const description = currentRole === "طالب"
    ? "ملفك الشخصي، مقدار حفظك ومستوى تجويدك."
    : currentRole === "ولي أمر"
      ? "ملف كل واحد من أبنائك: معلوماته، مقدار حفظه ومستوى تجويده."
      : currentRole === "مدرس"
        ? "ملفات الطلاب ومقدار حفظهم ومستوى تجويدهم."
        : "سجل معلومات الطلاب، تتبع أوراقهم، ومقدار حفظهم وتجويدهم.";
  const select = (st: Student) => { setSelectedStudent(st); };
  const size = PAGE_SIZES.students;
  const selectedIndex = selectedStudent ? filteredStudents.findIndex((s) => s.id === selectedStudent.id) : -1;
  const pg = usePagination(filteredStudents, size, `${searchQuery}\u0000${studentArchiveFilter}`, pageOfIndex(selectedIndex, size));
  const selectedPage = selectedIndex >= 0 ? pageOfIndex(selectedIndex, size) : 0;

  // UI-21 : sous 8 élèves, la recherche n'apporte rien (sauf si une saisie est déjà en cours).
  const showSearch = !family && (students.length >= PAGE_SIZES.students || searchQuery !== "");

  const columns: DataColumn<Student>[] = [
    {
      id: "student",
      header: "الطالب",
      card: "title",
      cell: (st) => (
        <div className="flex items-center gap-3 min-w-[150px]">
          <span className="w-10 h-10 rounded-full overflow-hidden bg-sunken shrink-0 border border-line">
            <StudentAvatar student={st} alt="" className="w-full h-full object-cover" />
          </span>
          {nameBlock(st)}
        </div>
      ),
      cardCell: nameBlock,
    },
    {
      id: "parent",
      header: "ولي الأمر والهاتف",
      card: "field",
      cardWide: true,
      cell: (st) => (
        <>
          <span className="block text-ink-2">{st.parentName}</span>
          <span className="flex items-center gap-1 text-small text-ink-3">{ic(Phone, "w-3.5 h-3.5")}<Ltr className="whitespace-nowrap">{st.parentPhone}</Ltr></span>
        </>
      ),
    },
    {
      id: "hizb",
      header: "أحزاب القرآن",
      cardLabel: "الحفظ",
      card: "field",
      className: "text-center whitespace-nowrap",
      cell: (st) => <><strong className="tabular-nums">{st.hizbCount}</strong> <span className="text-ink-3 text-small">حزب</span></>,
    },
    {
      id: "tajweed",
      header: "التجويد",
      card: "field",
      className: "text-center",
      cell: (st) => <Pill tone={tajweedTone(st.tajweedLevel)}>{st.tajweedLevel}</Pill>,
    },
    {
      id: "docs",
      header: "الأوراق الإدارية",
      // Sous 2xl la liste partage la largeur avec la fiche (qui détaille les papiers) : colonne masquée
      // pour que la colonne d'actions ne soit plus rognée (UI-06).
      className: "text-center hidden 2xl:table-cell",
      cell: (st) => (
        <div className="flex justify-center gap-1" aria-label="البطاقة الوطنية لولي الأمر / عقد الازدياد / صورتان">
          <DocBadge ok={!!st.docParentId} label="بطاقة" full="البطاقة الوطنية لولي الأمر" />
          <DocBadge ok={!!st.docBirthCert} label="عقد" full="عقد الازدياد" />
          <DocBadge ok={!!st.docPhotos} label="صور" full="الصور الشمسية" />
        </div>
      ),
    },
  ];

  if (family) {
    // Parent, élève : pas de liste d'administration (recherche, compteur, papiers) ;
    // le choix de l'enfant, puis sa fiche. Le résumé est dans l'onglet « ملخص ».
    return (
      <div data-screen="students" className="flex flex-col gap-6">
        <PageHeader title={title} description={description} />
        {filteredStudents.length > 1 && (
          <FilterChips
            label="اختيار الطالب"
            value={selectedStudent?.id || filteredStudents[0].id}
            onChange={(id) => select(filteredStudents.find((s) => s.id === id) || filteredStudents[0])}
            options={filteredStudents.map((s) => ({ value: s.id, label: s.fullName, attrs: { "data-child": s.id } }))}
          />
        )}
        {filteredStudents.length === 0 ? (
          <EmptyState icon={ic(Users, "w-8 h-8")} title="لا يوجد ملف مرتبط بحسابك">لم يُربط حسابك بأي طالب بعد. تواصل مع إدارة المدرسة لربطه.</EmptyState>
        ) : (
          <div className="max-w-3xl"><StudentDossier classes={classes} /></div>
        )}
      </div>
    );
  }

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
        {showSearch && (
          <SearchInput
            icon={ic(Search)}
            aria-label="بحث باسم الطالب أو ولي الأمر"
            placeholder="بحث باسم الطالب أو ولي الأمر..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="flex-[1_1_260px] max-w-md"
          />
        )}
        <Select aria-label="حالة الطلاب" data-filter="student-status" value={studentArchiveFilter} onChange={(v) => setStudentArchiveFilter(v as typeof studentArchiveFilter)} className="w-auto">
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
          <SectionHeader
            id="students-list-title"
            title="قائمة طلاب النادي"
            actions={<span className="text-small text-ink-2">تم العثور على <strong className="text-ink tabular-nums">{filteredStudents.length}</strong> طالب</span>}
            className="flex-wrap items-center gap-2 px-5 py-4 border-b border-line-soft"
          />
          {filteredStudents.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ic(Users, "w-8 h-8")} title="لا نتائج">لا يوجد طلاب مسجلون يطابقون خيارات البحث الحالية.</EmptyState>
            </div>
          ) : (
            <DataTable
              label="قائمة الطلاب"
              rows={pg.pageItems}
              rowKey={(st) => st.id}
              columns={columns}
              isSelected={(st) => selectedStudent?.id === st.id}
              onRowClick={select}
              actions={(st) => (
                <>
                  {can("update") && (
                    <>
                      <IconButton size="sm" label="تعديل الطالب" onClick={() => handleOpenStudentForm(st)}>{ic(Edit3)}</IconButton>
                      <IconButton size="sm" label={st.isArchived ? "إلغاء الأرشفة (تنشيط)" : "أرشفة الطالب"} onClick={() => handleToggleArchiveStudent(st.id, st.fullName)}>{ic(Archive)}</IconButton>
                    </>
                  )}
                  {can("delete") && <IconButton size="sm" tone="danger" label="حذف الطالب" onClick={() => handleDeleteStudent(st.id, st.fullName)}>{ic(Trash2)}</IconButton>}
                  <IconButton size="sm" tone="primary" label="عرض التفاصيل" onClick={() => select(st)}>{ic(Eye)}</IconButton>
                </>
              )}
            />
          )}
          {filteredStudents.length > 0 && (
            <div className="flex flex-col gap-2 px-5 py-3.5 border-t border-line-soft">
              <Pagination
                data-pagination="students"
                label="ترقيم صفحات قائمة الطلاب"
                page={pg.page}
                pageCount={pg.pageCount}
                onPageChange={pg.setPage}
                summary={`الطلاب ${pg.start}–${pg.end} من ${pg.total}`}
              />
              {selectedPage > 0 && selectedPage !== pg.page && (
                <button type="button" data-action="show-selected-student-page" onClick={() => pg.setPage(selectedPage)} className="self-start bg-transparent border-0 p-0 min-h-8 text-small font-semibold text-primary underline underline-offset-2 cursor-pointer hover:text-primary-hover">
                  {`عرض صفحة الطالب المحدد (${selectedPage})`}
                </button>
              )}
            </div>
          )}
        </Card>

        <StudentDossier classes={classes} />
      </div>
    </div>
  );
}
