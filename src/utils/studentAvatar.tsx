import React, { useState, useEffect } from "react";

/**
 * Extracts student photo URL checking photo, photoUrl, photoURL, avatar, image, picture.
 */
export function getStudentPhotoUrl(student: any): string | null {
  if (!student) return null;
  const raw =
    student.photo ||
    student.photoUrl ||
    student.photoURL ||
    student.avatar ||
    student.image ||
    student.picture ||
    student.avatarUrl ||
    student.avatarURL;

  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (
    trimmed === "" ||
    trimmed === "👤" ||
    trimmed === "👦" ||
    trimmed === "👧" ||
    trimmed === "🧒"
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Robust Student Avatar Component with Image Fallback (onError) handling
 */
interface StudentAvatarProps {
  student: any;
  className?: string;
  alt?: string;
  fallbackIcon?: React.ReactNode;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  student,
  className = "w-full h-full object-cover",
  alt,
  fallbackIcon,
}) => {
  const [hasError, setHasError] = useState(false);
  const photoUrl = getStudentPhotoUrl(student);

  useEffect(() => {
    setHasError(false);
  }, [student?.id, photoUrl]);

  const name = student?.fullName || alt || "طالب";
  const isGirl =
    student?.gender === "أنثى" ||
    (name &&
      (name.includes("عائشة") ||
        name.includes("فاطمة") ||
        name.includes("مريم") ||
        name.includes("آية") ||
        name.includes("سلمى") ||
        name.includes("زينب") ||
        name.includes("خديجة") ||
        name.includes("أمينة") ||
        name.includes("نورة") ||
        name.includes("أسماء") ||
        name.includes("رقية") ||
        name.includes("فردوس")));

  if (photoUrl && !hasError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => {
          console.warn(`Failed to load image for student ${name}, using avatar fallback.`);
          setHasError(true);
        }}
      />
    );
  }

  if (fallbackIcon) {
    return <>{fallbackIcon}</>;
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold text-xs ${
        isGirl ? "bg-danger-100 text-danger-700" : "bg-primary-100 text-primary-800"
      }`}
    >
      <svg className="w-3/5 h-3/5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};
