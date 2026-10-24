/**
 * Génération de noms d'utilisateur (translittération arabe → latin).
 * Module pur : aucune dépendance à Firebase ni au navigateur.
 */
import type { Student, Teacher } from "../types";

export const translitArabicToEnglish = (name: string): string => {
  if (!name || !name.trim()) return "user";

  // Clean titles and common Arabic honorific prefixes
  let clean = name.trim().toLowerCase()
    .replace(/^(د\.|ذ\.|أ\.|م\.|الشيخ|الأستاذ|الأستاذة|الدكتور|الدكتورة|المعلم|المعلمة|الحاج|الحاجة|الآنسة|السيد|السيدة)\s+/gi, "");

  const knownWords: { [key: string]: string } = {
    "عبد الرحمن": "abderrahmane",
    "عبد الله": "abdellah",
    "عبد العزيز": "abdelaziz",
    "عبد العالي": "abdelali",
    "عبد القادر": "abdelkader",
    "عبد الكريم": "abdelkarim",
    "عبد السلام": "abdessalam",
    "عبد الوهاب": "abdelouahab",
    "فاطمة الزهراء": "fatimazohra",
    "نور الدين": "noureddine",
    "صلاح الدين": "salaheddine",
    "تاج الدين": "tajeddine",
    "عز الدين": "ezzeddine",
    "زينب": "zainab",
    "مريم": "mariam",
    "محمد": "mohammed",
    "سعيد": "said",
    "ياسين": "yassine",
    "سارة": "sara",
    "إبراهيم": "ibrahim",
    "مصطفى": "mustafa",
    "عمر": "omar",
    "عثمان": "osman",
    "علي": "ali",
    "أحمد": "ahmed",
    "حسن": "hassan",
    "حسين": "houssein",
    "خالد": "khalid",
    "يوسف": "youssef",
    "حمزة": "hamza",
    "أيوب": "ayoub",
    "طارق": "tariq",
    "انس": "anas",
    "أنس": "anas",
    "التازي": "tazi",
    "الفاسي": "fassi",
    "السلاوي": "slaoui",
    "الفيلالي": "filali",
    "العلمي": "alami",
    "البقالي": "baqali",
    "الإدريسي": "idrissi",
    "الناصري": "naciri",
    "المرابط": "morabit",
    "بنجلون": "benjelloun",
    "الرباطي": "rebati",
    "الطنطاوي": "tantawi",
    "السوسي": "soussi"
  };

  const arabicToLatinMap: { [key: string]: string } = {
    'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a', 'ء': 'a', 'ؤ': 'o', 'ئ': 'e',
    'ب': 'b',
    'ت': 't', 'ة': 'a',
    'ث': 'th',
    'ج': 'j',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'dh',
    'ر': 'r',
    'ز': 'z',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'd',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'q',
    'ك': 'k',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'ه': 'h',
    'و': 'w',
    'ي': 'y', 'ى': 'a'
  };

  for (const [ar, en] of Object.entries(knownWords)) {
    clean = clean.replace(new RegExp(ar, 'g'), en);
  }

  let result = "";
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (arabicToLatinMap[char]) {
      result += arabicToLatinMap[char];
    } else {
      result += char;
    }
  }

  result = result
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return result.toLowerCase() || "user";
};

export const generateUniqueUsername = (
  fullName: string,
  existingUsernames: string[],
): string => {
  const base = translitArabicToEnglish(fullName);
  let candidate = base;
  let counter = 1;

  const usedSet = new Set(
    existingUsernames
      .filter(u => u && u.trim() !== "")
      .map(u => u.toLowerCase().trim())
  );

  while (usedSet.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter++;
  }

  return candidate;
};

export const getUsernameForTeacher = (teacher: Teacher): string => {
  if (teacher.email) {
    const prefix = teacher.email.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (prefix && prefix !== "user") return prefix;
  }
  return translitArabicToEnglish(teacher.fullName);
};

export const getUsernameForParent = (student: Student): string => {
  if (student.parentEmail) {
    const prefix = student.parentEmail.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (prefix && prefix !== "user") return prefix;
  }
  return translitArabicToEnglish(student.parentName);
};

export const getUsernameForStudent = (student: Student): string => {
  const studentPrefix = translitArabicToEnglish(student.fullName);
  if (student.parentEmail) {
    const parentPrefix = student.parentEmail.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (parentPrefix) {
      return `${studentPrefix}_${parentPrefix}`.substring(0, 25);
    }
  }
  return studentPrefix;
};

