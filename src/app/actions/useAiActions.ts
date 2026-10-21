/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { getIdToken, apiUrl } from "../../firebase";
import { Student } from "../../types";
import { computeAge } from "../../school/businessRules";
import type { DerivedScope } from "../scope";

export function useAiActions(s: DerivedScope) {
  const {
    activeSchoolId,
    attendance,
    grades,
    setAiError,
    setAiLoading,
    setAiReport,
  } = s;

  // AI Generation using custom backend route `/api/gemini/analyze`
  const handleGenerateAIReport = async (student: Student) => {
    setAiLoading(true);
    setAiError("");
    setAiReport(null);

    // calculate attendance rate
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const totalDays = studentAttendance.length;
    const presents = studentAttendance.filter(a => a.status === "حاضر" || a.status === "متأخر").length;
    const attendanceRate = totalDays > 0 ? Math.round((presents / totalDays) * 100) : 100;

    // fetch recent grades
    const studentGrades = grades.filter(g => g.studentId === student.id)
      .map(g => `${g.testedPortion}: ${g.overallGrade} (تسميع: ${g.memorizationGrade}/20, تجويد: ${g.tajweedGrade}/20)`)
      .join(", ");

    try {
      // Fonction `api` : exige un ID token et l'appartenance à l'école active.
      const idToken = await getIdToken();
      const res = await fetch(apiUrl("/api/gemini/analyze"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          schoolId: activeSchoolId,
          studentName: student.fullName,
          hizbCount: student.hizbCount,
          tajweedLevel: student.tajweedLevel,
          age: computeAge(student.birthDate),
          notes: student.notes,
          attendanceRate,
          recentGrades: studentGrades || "لا توجد امتحانات حديثة مسجلة."
        })
      });

      if (!res.ok) {
        throw new Error("فشل في استدعاء خادم التحليل الذكي.");
      }

      const data = await res.json();
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      setAiError("عذراً، حدث خطأ أثناء تشغيل محرك الذكاء الاصطناعي. الرجاء التحقق من مفتاح API وإعادة المحاولة.");
    } finally {
      setAiLoading(false);
    }
  };

  return {
    handleGenerateAIReport,
  };
}
