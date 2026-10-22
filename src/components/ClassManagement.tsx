import React, { useState, useEffect } from "react";
import { Class, Teacher, Student } from "../types";
import { Plus, Edit2, Archive, Calendar, Users, Search, AlertCircle, X, Trash2 } from "lucide-react";

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
      alert("الرجاء ملء اسم الحلقة والجدول الدراسي.");
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

  // Filtered classes list
  const filteredClasses = classes.filter(c => {
    const teacher = teachers.find(t => t.id === c.teacherId);
    const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.schedule || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (teacher && (teacher.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()));

    const isClassArchived = c.isArchived === true;

    if (archiveFilter === "active") {
      return matchesSearch && !isClassArchived;
    }
    if (archiveFilter === "archived") {
      return matchesSearch && isClassArchived;
    }
    return matchesSearch;
  });

  return (
    <div data-screen="classes" className="space-y-6" dir="rtl">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-line">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            🏫 إدارة الفصول والحلقات الدراسية
          </h2>
          <p className="text-[13px] text-ink-3">
            إضافة فصول دراسية جديدة، تعيين المحفظين المشرفين، تعديل المواعيد، وأرشفة الحلقات المكتملة.
          </p>
        </div>

        {canCreate && (
          <button
            data-action="open-class-form"
            onClick={() => handleOpenForm()}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            إضافة حلقة / فصل جديد
          </button>
        )}
      </div>

      {/* Filter Bar and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-sand-50 p-4 rounded-xl border border-line">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-ink-3" />
            <input
              type="text"
              placeholder="البحث باسم الحلقة، الجدول، أو المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3"
            />
          </div>
        </div>

        {/* Status Tab Filters */}
        <div className="flex bg-white p-1 rounded-xl border border-line w-full md:w-auto">
          <button
            onClick={() => setArchiveFilter("active")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-[13px] font-bold transition ${
              archiveFilter === "active" ? "bg-primary-700 text-white shadow" : "text-ink-2 hover:bg-sand-100"
            }`}
          >
            الحلقات النشطة ({classes.filter(c => !c.isArchived).length})
          </button>
          <button
            onClick={() => setArchiveFilter("archived")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-[13px] font-bold transition ${
              archiveFilter === "archived" ? "bg-gold-600 text-white shadow" : "text-ink-2 hover:bg-sand-100"
            }`}
          >
            الأرشيف ({classes.filter(c => c.isArchived).length})
          </button>
          <button
            onClick={() => setArchiveFilter("all")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-[13px] font-bold transition ${
              archiveFilter === "all" ? "bg-sand-700 text-white shadow" : "text-ink-2 hover:bg-sand-100"
            }`}
          >
            الكل ({classes.length})
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClasses.map((cls) => {
            const teacher = teachers.find(t => t.id === cls.teacherId);
            const classStudents = students.filter(s => s.classId === cls.id && !s.isArchived);
            const capacityPercentage = Math.min(Math.round((classStudents.length / (cls.maxStudents || 20)) * 100), 100);

            return (
              <div
                key={cls.id}
                className={`bg-surface rounded-2xl border ${
                  cls.isArchived
                    ? "border-gold-200 bg-gold-50/10"
                    : "border-line"
                } p-6 space-y-4 flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Archived Badge Flag */}
                {cls.isArchived && (
                  <div className="absolute top-0 left-0 bg-gold-600 text-white text-[12.5px] font-bold px-3 py-1 rounded-br-xl">
                    حلقة مؤرشفة
                  </div>
                )}

                <div className="space-y-4">
                  {/* Class Title & Capacity Badge */}
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h3 className="font-bold text-primary text-base">{cls.name}</h3>
                      <p className="text-[11.5px] text-ink-3 mt-0.5">رمز الحلقة: {cls.id.toUpperCase()}</p>
                    </div>
                    <span className={`text-[12.5px] px-2.5 py-1 rounded-full font-bold border ${
                      cls.isArchived
                        ? "bg-sand-100 text-ink-2 border-line"
                        : "bg-primary-50 text-primary-800 border-primary-100"
                    }`}>
                      {classStudents.length} طلاب مسجلين
                    </span>
                  </div>

                  {/* Instructor block */}
                  <div className="flex items-center gap-3 bg-sand-50 p-3 rounded-xl border border-line-soft">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border bg-white flex items-center justify-center">
                      {teacher?.photo ? (
                        <img src={teacher.photo} alt={teacher.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">👨‍🏫</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11.5px] text-ink-3 font-bold">المحفظ المشرف:</p>
                      <p className="text-[13px] font-bold text-ink-2">{teacher?.fullName || "لم يتم تعيين معلم"}</p>
                      {teacher && <p className="text-[12.5px] text-primary-700 font-semibold">{teacher.specialty}</p>}
                    </div>
                  </div>

                  {/* Schedule block */}
                  <div className="space-y-1.5 text-[13px] text-ink-2">
                    <p className="font-bold text-ink-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-3" />
                      توقيت وجدول الحلقة:
                    </p>
                    <div className="bg-gold-50/50 p-2.5 rounded-xl border border-gold-200/40 text-gold-900 font-medium font-sans">
                      {cls.schedule}
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11.5px] text-ink-3 font-bold">
                      <span>الاستيعاب والقدرة الاستيعابية:</span>
                      <span>{classStudents.length} / {cls.maxStudents || 20} طالب</span>
                    </div>
                    <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200/50">
                      <div
                        style={{ width: `${capacityPercentage}%` }}
                        className={`h-full transition-all duration-500 ${
                          capacityPercentage >= 90 ? "bg-danger-500" : capacityPercentage >= 75 ? "bg-gold-500" : "bg-primary-600"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Students inside class list snippet */}
                  <div className="space-y-2">
                    <p className="text-[13px] font-bold text-ink-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-ink-3" />
                      الطلاب المنتسبون لهذه الحلقة:
                    </p>
                    {classStudents.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {classStudents.map(st => (
                          <span
                            key={st.id}
                            onClick={() => {
                              if (onSelectStudent && onSwitchTab) {
                                onSelectStudent(st);
                                onSwitchTab("students");
                              }
                            }}
                            className="bg-sand-100 hover:bg-primary-50 hover:text-primary-800 cursor-pointer text-ink-2 px-2.5 py-1 rounded-lg text-[11.5px] transition font-medium border border-sand-200/60"
                            title="انقر لعرض تفاصيل الطالب"
                          >
                            🧒 {st.fullName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-ink-3 italic bg-sand-50 p-2 rounded-lg border border-line-soft">
                        لا يوجد طلاب مسجلون في هذه الحلقة حالياً.
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions for Admins */}
                {(canUpdate || canDelete) && (
                  <div className="border-t pt-3 mt-4 flex justify-between gap-2">
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenForm(cls)}
                        className="flex-1 py-1.5 bg-sand-100 hover:bg-sand-200 text-ink-2 text-[12.5px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-line"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        تعديل الحلقة
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        onClick={() => onArchiveToggle(cls.id)}
                        className={`flex-1 py-1.5 text-[12.5px] font-bold rounded-lg transition flex items-center justify-center gap-1 border ${
                          cls.isArchived
                            ? "bg-primary-50 hover:bg-primary-100 text-primary-800 border-primary-200"
                            : "bg-gold-50 hover:bg-gold-100 text-gold-800 border-gold-200"
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                        {cls.isArchived ? "تنشيط الحلقة" : "أرشفة الحلقة"}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1.5 hover:bg-danger-50 text-danger-600 rounded-lg transition border border-transparent hover:border-danger-200"
                        title="حذف نهائي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-12 text-center border border-line space-y-3">
          <AlertCircle className="w-12 h-12 text-ink-3 mx-auto" />
          <h4 className="font-bold text-ink-2 text-sm">لا توجد فصول دراسية مطابقة لبحثك</h4>
          <p className="text-[13px] text-ink-3">تأكد من اختيار التصفية المناسبة أو إضافة حلقة دراسية جديدة.</p>
        </div>
      )}

      {/* ADD / EDIT CLASS MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
          <div className="bg-surface w-full max-w-lg overflow-hidden my-8 max-h-[90vh] flex flex-col rounded-3xl border border-line shadow-pop" dir="rtl">
            <div className="flex justify-between items-center shrink-0 bg-night text-night-text px-6 py-4 border-b border-night-line">
              <h3 className="font-bold text-base flex items-center gap-2">
                {editingClass ? "📝 تعديل الحلقة الدراسية" : "🏫 إضافة حلقة قرآنية جديدة"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px] overflow-y-auto">
              {/* Class Name */}
              <div className="space-y-1">
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم الفصل / الحلقة <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: حلقة الإمام نافع"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              {/* Schedule Days Selection */}
              <div className="space-y-2">
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">أيام الحلقة الدراسية <span className="text-danger-500">*</span></label>
                <div className="flex flex-wrap gap-1.5 p-1 bg-sand-50 rounded-xl border border-line">
                  {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDays(selectedDays.filter((d) => d !== day));
                          } else {
                            setSelectedDays([...selectedDays, day]);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
                          isSelected
                            ? "bg-primary-700 text-white font-bold"
                            : "bg-white text-ink-2 hover:bg-sand-100 border border-line"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">وقت البدء (ساعة الدخول) <span className="text-danger-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">وقت الانتهاء (ساعة الخروج) <span className="text-danger-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              {/* Preview & Manual Override */}
              <div className="space-y-1.5">
                <div className="bg-primary-50/60 border border-primary-100 rounded-xl p-3 text-primary-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="text-[11.5px] text-primary-600 font-bold">الجدول الدراسي الناتج تلقائياً:</p>
                    <p className="text-[13px] font-bold font-sans mt-0.5">{formSchedule || "(الرجاء اختيار يوم واحد على الأقل)"}</p>
                  </div>
                </div>
                
                <details className="text-[11.5px] text-ink-3">
                  <summary className="cursor-pointer hover:text-ink-2 font-bold">تعديل النص يدوياً (خيارات متقدمة)</summary>
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={formSchedule}
                      onChange={(e) => setFormSchedule(e.target.value)}
                      placeholder="تعديل يدوي لصيغة الجدول والمواعيد"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                    <p className="text-[12.5px] text-ink-3">ملاحظة: تعديل النص يدوياً قد يؤثر على الحساب التلقائي والغياب في وقت الحلقة.</p>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Teacher selection */}
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المحفظ المشرف</label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
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
                  </select>
                </div>

                {/* Max Students */}
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الطاقة الاستيعابية القصوى</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formMaxStudents}
                    onChange={(e) => setFormMaxStudents(Number(e.target.value))}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
                >
                  {editingClass ? "حفظ التغييرات" : "إنشاء الحلقة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
