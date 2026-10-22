/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useEffect } from "react";

import type { DerivedScope } from "./scope";

export function useAutoSelectStudent(s: DerivedScope) {
  const {
    currentRole,
    currentStudentObj,
    selectedStudent,
    setSelectedStudent,
  } = s;

  // Auto-select student dossier when logged in or viewing as student
  useEffect(() => {
    if (currentRole === "طالب" && currentStudentObj) {
      if (!selectedStudent || selectedStudent.id !== currentStudentObj.id) {
        setSelectedStudent(currentStudentObj);
      }
    }
  }, [currentRole, currentStudentObj]);

}
