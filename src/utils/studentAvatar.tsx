import React, { useState, useEffect } from "react";

export const PRESET_STUDENT_PHOTOS_BOY = [
  "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
];

export const PRESET_STUDENT_PHOTOS_GIRL = [
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200",
  "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=200",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
];

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
 * Backward compatibility helper for getting student photo URL or preset fallback
 */
export function getStudentPhoto(student: any): string {
  const url = getStudentPhotoUrl(student);
  if (url) return url;

  const name = student?.fullName || "";
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

  const photos = isGirl ? PRESET_STUDENT_PHOTOS_GIRL : PRESET_STUDENT_PHOTOS_BOY;
  const str = student?.id || student?.fullName || "student";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % photos.length;
  return photos[index];
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
        isGirl ? "bg-pink-100 text-pink-700" : "bg-teal-100 text-teal-800"
      }`}
    >
      <svg className="w-3/5 h-3/5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};
