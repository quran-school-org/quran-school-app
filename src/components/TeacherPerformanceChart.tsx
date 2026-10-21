import React, { useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Student, Teacher, Class, Grade } from "../types";
import { Award, Users, BookOpen, Star, CheckCircle2 } from "lucide-react";

interface TeacherPerformanceChartProps {
  teachers: Teacher[];
  classes: Class[];
  students: Student[];
  grades: Grade[];
}

export default function TeacherPerformanceChart({
  teachers,
  classes,
  students,
  grades
}: TeacherPerformanceChartProps) {
  const [metricType, setMetricType] = useState<"memorization" | "tajweed" | "both">("both");

  // Calculate teacher performance metrics (الأساتذة والمحفظون فقط)
  const performanceData = useMemo(() => {
    // Filter only actual Quran instructors and teachers (الأساتذة والمحفظون فقط)
    // Filter out executive board members, admin staff, mentors, cleaners, volunteers, etc.
    const quranTeachers = teachers.filter((teacher) => {
      if (teacher.isArchived) return false;
      
      const cat = (teacher.category || "").trim();
      if (cat) {
        return cat === "أستاذ / محفظ";
      }

      // If category is not set, fallback check: exclude based on specialty / roleTitle
      const spec = (teacher.specialty || "").trim().toLowerCase();
      const role = (teacher.roleTitle || "").trim().toLowerCase();
      const isNonTeachingStaff = 
        spec.includes("مكتب") || spec.includes("مسير") || spec.includes("إدار") || 
        spec.includes("نظافة") || spec.includes("صيانة") || spec.includes("تأطير") ||
        role.includes("رئيس") || role.includes("أمين") || role.includes("كاتب") || 
        role.includes("مستشار") || role.includes("مؤطر") || role.includes("عون") ||
        role.includes("نائب");

      return !isNonTeachingStaff;
    });

    return quranTeachers
      .map((teacher) => {
        // 1. Get teacher's classes
        const teacherClasses = classes.filter((c) => c.teacherId === teacher.id && !c.isArchived);
        const classIds = new Set(teacherClasses.map((c) => c.id));
        const classNames = teacherClasses.map((c) => c.name).join(" • ") || "لا توجد حلقة نشطة";

        // 2. Get students in these classes
        const teacherStudents = students.filter((s) => classIds.has(s.classId) && !s.isArchived);
        const studentIds = new Set(teacherStudents.map((s) => s.id));

        // 3. Get all grades for these students
        const studentGrades = grades.filter((g) => studentIds.has(g.studentId));

        // Calculate averages
        let avgMemorization = 0;
        let avgTajweed = 0;
        if (studentGrades.length > 0) {
          const sumMemo = studentGrades.reduce((sum, g) => sum + g.memorizationGrade, 0);
          const sumTajweed = studentGrades.reduce((sum, g) => sum + g.tajweedGrade, 0);
          avgMemorization = Math.round((sumMemo / studentGrades.length) * 10) / 10;
          avgTajweed = Math.round((sumTajweed / studentGrades.length) * 10) / 10;
        }

        return {
          id: teacher.id,
          name: teacher.fullName,
          classesCount: teacherClasses.length,
          classNames,
          studentsCount: teacherStudents.length,
          examsCount: studentGrades.length,
          "معدل الحفظ": avgMemorization,
          "معدل التجويد": avgTajweed,
          // Sort score: prioritize higher average if grades exist, else 0
          sortScore: avgMemorization || 0,
        };
      })
      // Sort from highest to lowest score
      .sort((a, b) => b.sortScore - a.sortScore);
  }, [teachers, classes, students, grades]);

  // General statistics
  const topTeacher = useMemo(() => {
    const rated = performanceData.filter((t) => t.examsCount > 0);
    if (rated.length === 0) return null;
    return rated[0];
  }, [performanceData]);

  const totalExams = useMemo(() => grades.length, [grades]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6" id="teacher-performance-widget">
      
      {/* Header section with icon and controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            🏆 تقييم الأداء العام لحلقات المعلمين والمشايخ
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            معدل درجات الحفظ والتجويد للطلاب التابعين لكل معلم بناءً على نتائج الاختبارات الفعلية
          </p>
        </div>

        {/* Chart Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 self-start md:self-auto">
          <span className="text-xs text-slate-500 font-bold">المؤشر:</span>
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value as "memorization" | "tajweed" | "both")}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="both">مقارنة الحفظ والتجويد</option>
            <option value="memorization">معدل الحفظ فقط (تسميع)</option>
            <option value="tajweed">معدل التجويد فقط</option>
          </select>
        </div>
      </div>

      {/* Highlights summary badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Highest average circle */}
        <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
              <span>الحلقة الأكثر تميزاً (أعلى معدل)</span>
            </p>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">
              {topTeacher 
                ? (topTeacher.name.startsWith("أستاذ") || topTeacher.name.startsWith("الشيخ") ? topTeacher.name : `الأستاذ ${topTeacher.name}`)
                : "لا توجد بيانات اختبارات"}
            </p>
            {topTeacher && (
              <p className="text-[9px] text-amber-700 font-semibold">
                بمعدل حفظ: {topTeacher["معدل الحفظ"]} / 20 ({topTeacher.studentsCount} طالب)
              </p>
            )}
          </div>
          <span className="text-2xl">🌟</span>
        </div>

        {/* Exams conducted */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>إجمالي اختبارات التقييم</span>
            </p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">
              {totalExams} اختبار
            </p>
            <p className="text-[9px] text-emerald-700 font-semibold">
              مسجلة لطلاب حلقات التحفيظ
            </p>
          </div>
          <span className="text-2xl">📝</span>
        </div>

        {/* Active tracking tip */}
        <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>الأساتذة والمحفظون المقيّمون</span>
            </p>
            <p className="text-sm font-extrabold text-slate-700 mt-0.5">
              {performanceData.length} أستاذ ومحفظ
            </p>
            <p className="text-[9px] text-slate-400 font-semibold">
              مخصص لحلقات ومجموعات التحفيظ والتجويد
            </p>
          </div>
          <span className="text-2xl">🎯</span>
        </div>
      </div>

      {performanceData.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">لا يوجد أساتذة أو محفظون مضافون حالياً</p>
          <p className="text-[11px] text-slate-400">
            يمكنك تعيين الفئة "أستاذ / محفظ" للكوادر من قسم شؤون العاملين لتظهر تقييماتهم هنا تلقائياً.
          </p>
        </div>
      ) : (
        /* Performance Bar Chart and Details Grid */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* The Recharts Bar Chart - takes 3 columns */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-4 text-center">
                مقارنة مستويات التحصيل حسب الأساتذة والمحفظين
              </h4>
              
              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      domain={[0, 20]} 
                      tickFormatter={(v) => `${v}`}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        direction: 'rtl', 
                        textAlign: 'right', 
                        borderRadius: '12px', 
                        borderColor: '#cbd5e1',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '11px'
                      }}
                      formatter={(value: any) => [`${value} / 20`, '']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    
                    {metricType !== "tajweed" && (
                      <Bar 
                        dataKey="معدل الحفظ" 
                        fill="#059669" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={40}
                      />
                    )}
                    {metricType !== "memorization" && (
                      <Bar 
                        dataKey="معدل التجويد" 
                        fill="#d97706" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={40}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leaderboard Table / Detailed view of each teacher - takes 2 columns */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>تفاصيل وتقدير الأساتذة والمحفظين:</span>
            </h4>
            
            <div className="space-y-2.5 max-h-[265px] overflow-y-auto pr-1">
              {performanceData.map((item, index) => {
                const hasGrades = item.examsCount > 0;
                const isExcellent = item["معدل الحفظ"] >= 17;
                const isGood = item["معدل الحفظ"] >= 14 && item["معدل الحفظ"] < 17;
                const formattedName = item.name.startsWith("أستاذ") || item.name.startsWith("الشيخ") ? item.name : `الأستاذ ${item.name}`;

                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      hasGrades 
                        ? "bg-white border-slate-200 hover:border-slate-300 shadow-xs" 
                        : "bg-slate-50/50 border-slate-200/60 opacity-60"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md font-mono">
                            #{index + 1}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800">{formattedName}</h5>
                        </div>
                        <p className="text-[9px] text-slate-400 font-semibold">
                          حلقات: {item.classNames}
                        </p>
                      </div>

                      <div className="text-right">
                        {hasGrades ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-emerald-700 font-mono">
                              {item["معدل الحفظ"]} / 20
                            </span>
                            <p className="text-[8px] text-slate-400 font-bold">معدل التسميع</p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            لا توجد اختبارات بعد
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tiny progress breakdown */}
                    {hasGrades && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[9px] text-slate-500 font-semibold">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{item.studentsCount} طلاب مفعّلين</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>{item.examsCount} اختبار تقييمي</span>
                        </div>
                        <div>
                          {isExcellent ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold text-[8px]">
                              مستوى ممتاز
                            </span>
                          ) : isGood ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-bold text-[8px]">
                              مستوى جيد جداً
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold text-[8px]">
                              متوسط أو قيد التثبيت
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="bg-amber-50/30 p-3.5 rounded-xl border border-amber-100/50 flex items-center gap-2.5 text-[11px] text-slate-600 leading-relaxed">
        <span className="text-sm">💡</span>
        <p>
          يتم احتساب معدل الحفظ لكل أستاذ ومحفظ عن طريق إيجاد حاصل جمع درجات التسميع المسجلة لطلابه، ثم قسمته على عدد الاختبارات الكلية. يُخصص هذا المخطط للأساتذة والمحفظين المباشرين للحلقات فقط، مستثنياً أعضاء المكتب والإداريين والكوادر المساعدة.
        </p>
      </div>

    </div>
  );
}
