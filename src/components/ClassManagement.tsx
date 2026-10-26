import React, { useState, useEffect } from "react";
import { Class, Teacher, Student } from "../types";
import { Plus, Edit2, Archive, Calendar, Users, Search, AlertCircle, Trash2 } from "lucide-react";
import { isEducatorRole, isFamilyRole } from "../security/access";
import { navLabel } from "../shell/navModel";
import { Button, Card, EmptyState, FilterChips, FormField, IconButton, InitialAvatar, Input, Ltr, Modal, PAGE_SIZES, PageHeader, Pill, ProgressBar, SearchInput, Select, cx, useToast } from "../ui";

const parseScheduleString = (scheduleStr: string) => {
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const selectedDays: string[] = [];
  days.forEach(day => {
    if (day === "الاثنين") {
      if (scheduleStr.includes("الاثنين") || scheduleStr.includes("الإثنين")) {
        selectedDays.push(day);
      }
    } else if (scheduleStr.includes(day)) {
      selectedDays.push(day);
    }
  });

  const timeRegex = /(\d{1,2}):(\d{2})/g;
  const matches = [...scheduleStr.matchAll(timeRegex)];
  let startTime = "09:00";
  let endTime = "12:00";

  if (matches.length >= 1) {
    startTime = `${matches[0][1].padStart(2, '0')}:${matches[0][2]}`;
  }
  if (matches.length >= 2) {
    endTime = `${matches[1][1].padStart(2, '0')}:${matches[1][2]}`;
  }

  return { selectedDays, startTime, endTime };
};

const buildScheduleString = (selectedDays: string[], startTime: string, endTime: string) => {
  if (selectedDays.length === 0) return "";
  
  const order = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const sortedDays = [...selectedDays].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  
  let daysStr = "";
  if (sortedDays.length === 1) {
    daysStr = sortedDays[0];
  } else if (sortedDays.length === 2) {
    daysStr = (sortedDays[0] === "السبت" && sortedDays[1] === "الأحد") ? "السبت والأحد" : `${sortedDays[0]} و${sortedDays[1]}`;
  } else {
    daysStr = sortedDays.slice(0, -1).join(" و ") + " و " + sortedDays[sortedDays.length - 1];
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    return `${parseInt(h, 10)}:${m}`;
  };

  return `${daysStr} من ${formatTime(startTime)} إلى ${formatTime(endTime)}`;
};

interface ClassManagementProps {
  classes: Class[];
  teachers: Teacher[];
  students: Student[];
  currentRole: string;
  canEditTeachers?: boolean;
  canCreateClasses?: boolean;
  canUpdateClasses?: boolean;
  canDeleteClasses?: boolean;
  onSaveClass: (cls: Class) => void;
  onArchiveToggle: (classId: string) => void;
  onDeleteClass: (classId: string) => void;
  onSelectStudent?: (student: Student) => void;
  onSwitchTab?: (tab: string) => void;
}

export default function ClassManagement({
  classes,
  teachers,
  students,
  currentRole,
  canEditTeachers,
  canCreateClasses,
  canUpdateClasses,
  canDeleteClasses,
  onSaveClass,
  onArchiveToggle,
  onDeleteClass,
  onSelectStudent,
  onSwitchTab
}: ClassManagementProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<"all" | "active" | "archived">("active");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Form inputs
  const [formName, setFormName] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formSchedule, setFormSchedule] = useState("");
  const [formMaxStudents, setFormMaxStudents] = useState(20);

  // Advanced schedule inputs
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  useEffect(() => {
    const computed = buildScheduleString(selectedDays, startTime, endTime);
    setFormSchedule(computed);
  }, [selectedDays, startTime, endTime]);

  const canCreate = canCreateClasses ?? canEditTeachers ?? (currentRole === "مدير");
  const canUpdate = canUpdateClasses ?? canEditTeachers ?? (currentRole === "مدير");
  const canDelete = canDeleteClasses ?? (currentRole === "مدير");

  // Open form for add/edit
  const handleOpenForm = (cls?: Class) => {
    if (cls ? !canUpdate : !canCreate) return;

    if (cls) {
      setEditingClass(cls);
      setFormName(cls.name);
      setFormTeacherId(cls.teacherId);
      setFormSchedule(cls.schedule);
      setFormMaxStudents(cls.maxStudents || 20);

      const parsed = parseScheduleString(cls.schedule);
      setSelectedDays(parsed.selectedDays);
      setStartTime(parsed.startTime);
      setEndTime(parsed.endTime);
    } else {
      setEditingClass(null);
      setFormName("");
      setFormTeacherId("");
      setFormSchedule("");
      setFormMaxStudents(20);
      setSelectedDays([]);
      setStartTime("09:00");
      setEndTime("12:00");
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSchedule) {
      toast.error("الرجاء ملء اسم الحلقة والجدول الدراسي.");
      return;
    }

    const classToSave: Class = {
      id: editingClass ? editingClass.id : "c_" + Date.now(),
      name: formName,
      teacherId: formTeacherId,
      schedule: formSchedule,
      maxStudents: Number(formMaxStudents) || 20,
      isArchived: editingClass ? (editingClass.isArchived || false) : false
    };

    onSaveClass(classToSave);
    setShowModal(false);
  };

  // Famille : uniquement les halaqas de ses enfants (les élèves reçus sont déjà ceux de son compte),
  // sans archive. Elle ne lit pas les fiches du personnel : le محفظ n'est affiché que s'il est lisible (UI-03).
  const family = isFamilyRole(currentRole as any);
  const canSeeTeachers = isEducatorRole(currentRole as any);
  const childClassIds = new Set(students.map((st) => st.classId));
  const visibleClasses = family ? classes.filter((c) => childClassIds.has(c.id) && !c.isArchived) : classes;

  // Filtered classes list
  const filteredClasses = visibleClasses.filter(c => {
    const teacher = teachers.find(t => t.id === c.teacherId);
    const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.schedule || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (teacher && (teacher.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()));

    const isClassArchived = c.isArchived === true;

    if (family) return !isClassArchived;
    if (archiveFilter === "active") {
      return matchesSearch && !isClassArchived;
    }
    if (archiveFilter === "archived") {
      return matchesSearch && isClassArchived;
    }
    return matchesSearch;
  });

  const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const activeCount = classes.filter((c) => !c.isArchived).length;
  const archivedCount = classes.filter((c) => c.isArchived).length;
  // UI-21 : sous 8 halaqas, pas de recherche ; l'archive n'est proposée que s'il y en a une.
  const showSearch = !family && (classes.length >= PAGE_SIZES.students || searchQuery !== "");
  const showArchiveChips = !family && (archivedCount > 0 || archiveFilter !== "active");
  const description = canCreate || canUpdate
    ? "إضافة فصول دراسية جديدة، تعيين المحفظين المشرفين، تعديل المواعيد، وأرشفة الحلقات المكتملة."
    : currentRole === "ولي أمر"
      ? "حلقات أبنائك ومواعيدها."
      : currentRole === "طالب"
        ? "حلقتك ومواعيدها."
        : "الحلقات القرآنية ومواعيدها والمحفظون المشرفون عليها.";

  return (
    <div data-screen="classes" className="flex flex-col gap-6" dir="rtl">
      <PageHeader
        title={navLabel(currentRole as any, "classes")}
        description={description}
        actions={
          canCreate && (
            <Button variant="primary" data-action="open-class-form" onClick={() => handleOpenForm()} icon={<Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
              إضافة حلقة / فصل جديد
            </Button>
          )
        }
      />

      {(showSearch || showArchiveChips) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showSearch && (
            <SearchInput
              aria-label="البحث في الحلقات"
              icon={<Search className="w-4 h-4" strokeWidth={1.75} />}
              placeholder="البحث باسم الحلقة، الجدول، أو المعلم..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="flex-[1_1_260px] max-w-md"
            />
          )}
          {showArchiveChips && (
            <FilterChips
              label="حالة الحلقات"
              value={archiveFilter}
              onChange={setArchiveFilter}
              options={[
                { value: "active", label: `الحلقات النشطة (${activeCount})` },
                { value: "archived", label: `الأرشيف (${archivedCount})` },
                { value: "all", label: `الكل (${classes.length})` },
              ]}
            />
          )}
        </div>
      )}

      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClasses.map((cls) => {
            const teacher = teachers.find((t) => t.id === cls.teacherId);
            const classStudents = students.filter((s) => s.classId === cls.id && !s.isArchived);
            const capacityPercentage = Math.min(Math.round((classStudents.length / (cls.maxStudents || 20)) * 100), 100);
            return (
              <Card key={cls.id} as="article" aria-labelledby={`class-${cls.id}`} className={cx("flex flex-col justify-between gap-4", cls.isArchived && "bg-surface-2")}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3 pb-3 border-b border-line-soft">
                    <div className="min-w-0">
                      <h2 id={`class-${cls.id}`} className="m-0 font-display font-semibold text-[20px] text-primary">{cls.name}</h2>
                      {!family && <p className="m-0 mt-0.5 text-[12.5px] text-ink-3">رمز الحلقة: <Ltr>{cls.id.toUpperCase()}</Ltr></p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {cls.isArchived && <Pill tone="warn">حلقة مؤرشفة</Pill>}
                      {!family && <Pill tone={cls.isArchived ? "neutral" : "primary"}>{classStudents.length} طلاب مسجلين</Pill>}
                    </div>
                  </div>

                  {(teacher || canSeeTeachers) && (
                    <div className="flex items-center gap-3">
                      {teacher?.photo ? (
                        <img src={teacher.photo} alt={teacher.fullName} className="w-11 h-11 rounded-full object-cover border border-line shrink-0" />
                      ) : (
                        <InitialAvatar name={teacher?.fullName || "?"} size={44} />
                      )}
                      <div className="min-w-0">
                        <p className="m-0 text-[12.5px] text-ink-3">المحفظ المشرف</p>
                        <p className="m-0 text-[14.5px] font-semibold text-ink">{teacher?.fullName || "لم يتم تعيين معلم"}</p>
                        {teacher && <p className="m-0 text-[12.5px] text-ink-2">{teacher.specialty}</p>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl bg-gold-100 text-gold-ink px-3 py-2.5 text-[13.5px]">
                    <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-gold-700" strokeWidth={1.75} aria-hidden="true" />
                    <span><span className="sr-only">توقيت وجدول الحلقة: </span>{cls.schedule}</span>
                  </div>

                  {!family && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[12.5px] text-ink-2">
                        <span>الاستيعاب والقدرة الاستيعابية</span>
                        <span className="tabular-nums font-semibold">{classStudents.length} / {cls.maxStudents || 20} طالب</span>
                      </div>
                      <ProgressBar
                        value={capacityPercentage}
                        height={8}
                        className="flex-none"
                        tone={capacityPercentage >= 90 ? "danger" : capacityPercentage >= 75 ? "gold" : "primary"}
                        label={`نسبة الامتلاء ${capacityPercentage}%`}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <p className="m-0 text-[13px] font-semibold text-ink-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                      {currentRole === "ولي أمر" ? "أبناؤك في هذه الحلقة" : currentRole === "طالب" ? "أنت في هذه الحلقة" : "الطلاب المنتسبون لهذه الحلقة"}
                    </p>
                    {classStudents.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {classStudents.map((st) => (
                          <button
                            type="button"
                            key={st.id}
                            onClick={() => {
                              if (onSelectStudent && onSwitchTab) {
                                onSelectStudent(st);
                                onSwitchTab("students");
                              }
                            }}
                            className="min-h-8 px-2.5 rounded-full border border-line bg-white text-[12.5px] text-ink-2 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            title="انقر لعرض تفاصيل الطالب"
                          >
                            {st.fullName}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 text-[13px] text-ink-3 rounded-lg bg-surface-2 border border-line-soft px-3 py-2">لا يوجد طلاب مسجلون في هذه الحلقة حالياً.</p>
                    )}
                  </div>
                </div>

                {(canUpdate || canDelete) && (
                  <div className="pt-3 border-t border-line-soft flex gap-2">
                    {canUpdate && (
                      <Button size="sm" className="flex-1" onClick={() => handleOpenForm(cls)} icon={<Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />}>تعديل الحلقة</Button>
                    )}
                    {canUpdate && (
                      <Button size="sm" className="flex-1" variant={cls.isArchived ? "success" : "outline"} onClick={() => onArchiveToggle(cls.id)} icon={<Archive className="w-3.5 h-3.5" strokeWidth={1.75} />}>
                        {cls.isArchived ? "تنشيط الحلقة" : "أرشفة الحلقة"}
                      </Button>
                    )}
                    {canDelete && (
                      <IconButton size="sm" tone="danger" label="حذف نهائي" onClick={() => onDeleteClass(cls.id)}><Trash2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        family ? (
          <EmptyState icon={<AlertCircle className="w-8 h-8" strokeWidth={1.5} />} title="لا توجد حلقة بعد">
            {currentRole === "طالب" ? "لم تُسجَّل في أي حلقة بعد." : "لم يُسجَّل أبناؤك في أي حلقة بعد."} تواصل مع إدارة المدرسة.
          </EmptyState>
        ) : (
          <EmptyState icon={<AlertCircle className="w-8 h-8" strokeWidth={1.5} />} title="لا توجد فصول دراسية مطابقة لبحثك">
            تأكد من اختيار التصفية المناسبة أو إضافة حلقة دراسية جديدة.
          </EmptyState>
        )
      )}

      {showModal && (
        <Modal
          modalId="class-form"
          size="sm"
          title={editingClass ? "تعديل الحلقة الدراسية" : "إضافة حلقة قرآنية جديدة"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          footer={
            <>
              <Button onClick={() => setShowModal(false)}>إلغاء</Button>
              <Button type="submit" variant="primary">{editingClass ? "حفظ التغييرات" : "إنشاء الحلقة"}</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <FormField label="اسم الفصل / الحلقة *">
              {(id) => <Input id={id} type="text" required value={formName} onChange={(e: any) => setFormName(e.target.value)} placeholder="مثال: حلقة الإمام نافع" />}
            </FormField>
            <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
              <legend className="text-[13.5px] font-semibold text-ink-2 mb-1.5">أيام الحلقة الدراسية *</legend>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedDays(isSelected ? selectedDays.filter((d) => d !== day) : [...selectedDays, day])}
                      className={cx("min-h-11 px-3.5 rounded-[10px] border text-[13.5px] font-semibold cursor-pointer transition-colors", isSelected ? "bg-primary border-primary text-white" : "bg-white border-line text-ink-2 hover:border-ink-4")}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="وقت البدء (ساعة الدخول) *">
                {(id) => <Input id={id} type="time" required value={startTime} onChange={(e: any) => setStartTime(e.target.value)} />}
              </FormField>
              <FormField label="وقت الانتهاء (ساعة الخروج) *">
                {(id) => <Input id={id} type="time" required value={endTime} onChange={(e: any) => setEndTime(e.target.value)} />}
              </FormField>
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 flex items-center gap-2.5" aria-live="polite">
                <Calendar className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <p className="m-0 text-[12.5px] text-ink-2">الجدول الدراسي الناتج تلقائياً</p>
                  <p className="m-0 mt-0.5 text-[14px] font-semibold text-primary">{formSchedule || "(الرجاء اختيار يوم واحد على الأقل)"}</p>
                </div>
              </div>
              <details className="text-[13px] text-ink-3">
                <summary className="cursor-pointer hover:text-ink-2 font-semibold min-h-8 flex items-center">تعديل النص يدوياً (خيارات متقدمة)</summary>
                <div className="mt-2 flex flex-col gap-1">
                  <Input type="text" aria-label="تعديل يدوي لصيغة الجدول" value={formSchedule} onChange={(e: any) => setFormSchedule(e.target.value)} placeholder="تعديل يدوي لصيغة الجدول والمواعيد" />
                  <p className="m-0 text-[12.5px] text-ink-3">ملاحظة: تعديل النص يدوياً قد يؤثر على الحساب التلقائي والغياب في وقت الحلقة.</p>
                </div>
              </details>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="المحفظ المشرف">
                {(id) => (
                  <Select id={id} value={formTeacherId} onChange={(v) => setFormTeacherId(v)}>
                    <option value="">-- اختر محفظاً للحلقة --</option>
                    {teachers
                      .filter((t) => !t.isArchived)
                      .sort((a, b) => {
                        const aIsTeacher = (a.category || "أستاذ / محفظ") === "أستاذ / محفظ" ? 0 : 1;
                        const bIsTeacher = (b.category || "أستاذ / محفظ") === "أستاذ / محفظ" ? 0 : 1;
                        return aIsTeacher - bIsTeacher;
                      })
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} {t.category ? `[${t.category}]` : ""} ({t.specialty})
                        </option>
                      ))}
                  </Select>
                )}
              </FormField>
              <FormField label="الطاقة الاستيعابية القصوى">
                {(id) => <Input id={id} type="number" min="1" max="100" value={formMaxStudents} onChange={(e: any) => setFormMaxStudents(Number(e.target.value))} className="tabular-nums" />}
              </FormField>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
