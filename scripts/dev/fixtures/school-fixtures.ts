/**
 * Jeu de données FICTIF et volumineux pour UNE école existante (D82), au format
 * de l'application (src/types.ts) : élèves, halaqas, personnel (fiche publique
 * + fiche RH `staffPrivate`, D42), présences, suivi du hifz, examens,
 * cotisations, finances, activités, notifications.
 *
 * Module PUR (aucun accès Firebase) : utilisé par scripts/dev/seed-school-fixtures.ts
 * et par les tests. Résultat DÉTERMINISTE pour une même école, une même taille
 * et une même date (générateur pseudo-aléatoire initialisé par l'école et la
 * taille) : une relance le même jour réécrit les mêmes documents.
 *
 * Marquage (D82) : chaque document porte `demoData: true` et un identifiant
 * `DEMO-…`, avec deux exceptions imposées par l'application :
 *  - `staffPrivate` : les règles n'y admettent qu'une liste fermée de champs,
 *    et l'interface écrit ces fiches en fusion ; `demoData` y rendrait toute
 *    modification impossible. Marquage : identifiant `DEMO-T-…` égal à
 *    `teacherId` (fiche publique `teachers/DEMO-T-…` marquée) ;
 *  - `attendance` : l'interface identifie une présence par
 *    `a_<date>_<élève>` et la réécrit sous cet identifiant ; un identifiant
 *    `DEMO-…` produirait un doublon à la première modification. Marquage :
 *    `demoData: true` et identifiant `a_<date>_DEMO-S-…`.
 * Aucune donnée réelle : noms arabes courants combinés au hasard, téléphones
 * `06 00 …`, CIN `XX…`, adresses génériques suivies de « (عنوان وهمي) ».
 */
import type {
  ActivityExpense,
  ActivityParticipant,
  ActivityTrip,
  Attendance,
  Class,
  DailyProgress,
  Expense,
  Grade,
  Notification,
  OtherIncome,
  Payment,
  SalaryPayment,
  StaffCategory,
  Student,
  SystemSettings,
  Teacher,
  TajweedLevel,
} from "../../../src/types";
import { MONTHS_AR, getSubscriptionAmount, isMonthBeforeOpening, monthIndex } from "../../../src/school/businessRules";
import { STAFF_PRIVATE_COLLECTION, splitStaffRecord } from "../../../src/security/staffPrivate";

export const DEMO_PREFIX = "DEMO-";
export type FixtureSize = "small" | "large";
export const FIXTURE_SIZES: FixtureSize[] = ["small", "large"];

/** Collections écrites par le jeu (sous schools/{id}), dans l'ordre d'écriture. */
export const FIXTURE_COLLECTIONS = [
  "classes", "teachers", STAFF_PRIVATE_COLLECTION, "students", "attendance", "dailyProgress", "grades",
  "payments", "otherIncomes", "expenses", "salaryPayments", "activities", "activityParticipants",
  "activityExpenses", "notifications",
] as const;

const ATTENDANCE_ID = /^a_\d{4}-\d{2}-\d{2}_DEMO-S-\d{3}$/;

type Doc = Record<string, unknown>;

/**
 * Vrai si le document a été généré par ce jeu (voir le marquage ci-dessus).
 * Seuls ces documents sont réécrits ou supprimés par le script.
 */
export function isGeneratedDoc(collection: string, id: string, data: Doc | undefined | null): boolean {
  if (!data) return false;
  if (collection === STAFF_PRIVATE_COLLECTION) return id.startsWith(DEMO_PREFIX) && data.teacherId === id;
  if (data.demoData !== true) return false;
  if (id.startsWith(DEMO_PREFIX)) return true;
  return collection === "attendance" && ATTENDANCE_ID.test(id);
}

/** Vrai si un document NON généré désigne un élève ou une fiche du jeu (créé par l'interface). */
export function referencesGenerated(id: string, data: Doc | undefined | null): boolean {
  if (!data) return false;
  const refs = [data.studentId, data.referenceId, data.teacherId, data.personId, data.activityId];
  return id.includes(`_${DEMO_PREFIX}`) || refs.some((r) => typeof r === "string" && r.startsWith(DEMO_PREFIX));
}

// ------------------------------------------------------------ hasard reproductible

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Rng {
  private state: number;
  constructor(seed: string) {
    this.state = hashString(seed) || 1;
  }
  /** mulberry32 */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }
  weighted<T>(items: readonly [T, number][]): T {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [v, w] of items) {
      r -= w;
      if (r < 0) return v;
    }
    return items[items.length - 1][0];
  }
  sample<T>(list: readonly T[], n: number): T[] {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }
}

// ------------------------------------------------------------------ dates (UTC)

const DAY_MS = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const addMonths = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, Math.min(d.getUTCDate(), 28)));
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const monthKey = (y: number, m: number) => y * 12 + m;
/** Jour `day` du mois (borné à la fin du mois). */
const dayOfMonth = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, Math.min(day, new Date(Date.UTC(y, m + 1, 0)).getUTCDate())));

// ------------------------------------------------------------------ référentiels

const MALE = [
  "محمد", "أحمد", "يوسف", "عمر", "علي", "حمزة", "إدريس", "يونس", "أيوب", "إلياس", "آدم", "أنس", "زكرياء", "إسماعيل",
  "عبد الله", "عبد الرحمن", "عبد الرحيم", "عبد الصمد", "عبد الإله", "سفيان", "بلال", "معاذ", "مصطفى", "رضا", "هشام", "طه",
  "ياسين", "مهدي", "نوفل", "صهيب", "أسامة", "إبراهيم", "خالد", "سعد", "عثمان", "حسن", "حسين", "سلمان", "أمين", "وليد",
  "إسحاق", "يحيى", "زيد", "عماد", "أشرف", "المختار", "الطيب", "رشيد", "نبيل", "كريم", "منير", "جواد", "مراد", "العربي",
];
const FEMALE = [
  "فاطمة", "خديجة", "مريم", "عائشة", "زينب", "سلمى", "هبة", "آية", "إيمان", "نور", "سارة", "هاجر", "رقية", "حفصة",
  "أسماء", "صفية", "جنات", "ملاك", "دعاء", "شيماء", "سكينة", "رحمة", "لينا", "ياسمين", "نهى", "هند", "بشرى", "وئام",
  "سمية", "حليمة", "نادية", "لطيفة", "سعاد", "كوثر", "أمينة", "ابتسام", "غيثة", "زهرة", "فدوى", "نجاة", "مروة", "إكرام",
];
const FAMILY = [
  "العلمي", "البقالي", "التازي", "الفاسي", "الإدريسي", "بنجلون", "العمراني", "الوزاني", "الشرقاوي", "المنصوري", "الكتاني",
  "الصقلي", "الطاهري", "بناني", "السوسي", "الرباطي", "الحسني", "الناصري", "البركاني", "الزياني", "المريني", "الغماري",
  "الريفي", "الدكالي", "العبدي", "الحمداوي", "التطواني", "الشاوي", "الزموري", "اليعقوبي", "الجبلي", "الخياطي", "الهواري",
  "الصنهاجي", "العلوي", "بنسودة", "القادري", "الأندلسي", "المكناسي", "السلاوي", "الطنجاوي", "المراكشي", "الوجدي", "الأمراني",
  "الحجوي", "الزرهوني", "بنعيسى", "أوعلي", "أيت حمو", "أمزيان", "بوزيد", "الحراق", "بلحاج", "الشرادي", "السباعي", "الكنوني",
  "التمسماني", "الودغيري", "الجعيدي", "بنمنصور", "الصديقي", "المسناوي", "الهاشمي", "الإسماعيلي", "الحريزي", "الركراكي",
  "الدرقاوي", "الوكيلي", "البصري", "الزهراوي", "الملوكي", "البوعزاوي", "الكرومي", "الرامي", "أخياط", "بوشعيب", "أيت بلا",
];
const STREETS = ["زنقة الياسمين", "زنقة الأطلس", "شارع الأمل", "زنقة النخيل", "زنقة الزيتون", "شارع الوحدة", "زنقة الورد", "زنقة السلام"];
const QUARTERS = ["حي النهضة", "حي الرياض", "حي السلام", "حي الفتح", "حي الأمل", "حي الانبعاث", "حي الوفاق"];

/** Sourate de début de chaque juz (1 à 30). */
const JUZ_START = [
  "الفاتحة", "البقرة", "البقرة", "آل عمران", "النساء", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "هود",
  "يوسف", "الحجر", "الإسراء", "الكهف", "الأنبياء", "المؤمنون", "الفرقان", "النمل", "العنكبوت", "الأحزاب", "يس", "الزمر",
  "فصلت", "الأحقاف", "الذاريات", "المجادلة", "الملك", "النبأ",
];
const SHORT_SURAHS = ["الفاتحة", "الناس", "الفلق", "الإخلاص", "المسد", "النصر", "الكافرون", "الكوثر", "الماعون", "قريش", "الفيل", "الهمزة", "العصر", "التكاثر"];

/** Sourate en cours pour un élève qui a mémorisé `hizb` ahzab, à partir de la fin du Coran (usage marocain). */
export function surahForHizb(hizb: number, rng?: Rng): string {
  if (hizb >= 60) return "ختم القرآن (مراجعة عامة)";
  if (hizb <= 0) return `سورة ${rng ? rng.pick(SHORT_SURAHS) : SHORT_SURAHS[0]}`;
  const current = 60 - hizb; // hizb en cours, de 1 à 59
  return `سورة ${JUZ_START[Math.ceil(current / 2) - 1]}`;
}

interface ClassDef {
  key: string;
  name: string;
  teacher: string;
  days: number[]; // 0 = dimanche … 6 = samedi (Date.getUTCDay)
  schedule: string;
  gender: Student["gender"] | null;
  ages: [number, number];
  hizb: [number, number];
  size: number;
  max: number;
}

/** 12 halaqas (aucune le vendredi), par niveau et par âge. */
export const CLASS_DEFS: ClassDef[] = [
  { key: "C01", name: "حلقة البراعم", teacher: "T02", days: [6, 0], schedule: "السبت والأحد 09:00 - 11:00", gender: null, ages: [5, 7], hizb: [0, 1], size: 13, max: 16 },
  { key: "C02", name: "حلقة الزهور", teacher: "T04", days: [6, 0], schedule: "السبت والأحد 11:00 - 13:00", gender: null, ages: [6, 8], hizb: [0, 3], size: 13, max: 16 },
  { key: "C03", name: "حلقة النور", teacher: "T01", days: [1, 3, 4], schedule: "الاثنين والأربعاء والخميس 17:00 - 19:00", gender: "ذكر", ages: [8, 10], hizb: [2, 8], size: 13, max: 18 },
  { key: "C04", name: "حلقة الهدى", teacher: "T06", days: [1, 3, 4], schedule: "الاثنين والأربعاء والخميس 17:00 - 19:00", gender: "أنثى", ages: [8, 10], hizb: [2, 8], size: 13, max: 18 },
  { key: "C05", name: "حلقة الفرقان", teacher: "T03", days: [2, 4, 6], schedule: "الثلاثاء والخميس والسبت 17:30 - 19:30", gender: "ذكر", ages: [10, 12], hizb: [6, 15], size: 13, max: 18 },
  { key: "C06", name: "حلقة البيان", teacher: "T02", days: [2, 4, 6], schedule: "الثلاثاء والخميس والسبت 15:00 - 17:00", gender: "أنثى", ages: [10, 12], hizb: [6, 15], size: 13, max: 18 },
  { key: "C07", name: "حلقة الإيمان", teacher: "T05", days: [1, 2, 3], schedule: "الاثنين والثلاثاء والأربعاء 18:00 - 20:00", gender: "ذكر", ages: [12, 14], hizb: [12, 25], size: 12, max: 15 },
  { key: "C08", name: "حلقة الرحمة", teacher: "T04", days: [0, 2, 4], schedule: "الأحد والثلاثاء والخميس 15:00 - 17:00", gender: "أنثى", ages: [12, 14], hizb: [12, 25], size: 12, max: 15 },
  { key: "C09", name: "حلقة التقوى", teacher: "T01", days: [6, 0, 3], schedule: "السبت والأحد والأربعاء 15:00 - 18:00", gender: "ذكر", ages: [13, 16], hizb: [20, 40], size: 12, max: 15 },
  { key: "C10", name: "حلقة اليقين", teacher: "T09", days: [6, 0, 3], schedule: "السبت والأحد والأربعاء 15:00 - 18:00", gender: "أنثى", ages: [13, 16], hizb: [20, 40], size: 12, max: 15 },
  { key: "C11", name: "حلقة الإتقان", teacher: "T03", days: [1, 2, 3, 4], schedule: "الاثنين والثلاثاء والأربعاء والخميس 18:30 - 20:30", gender: "ذكر", ages: [15, 17], hizb: [35, 60], size: 12, max: 14 },
  { key: "C12", name: "حلقة التجويد", teacher: "T06", days: [0, 2, 4], schedule: "الأحد والثلاثاء والخميس 17:00 - 19:00", gender: "أنثى", ages: [14, 17], hizb: [30, 60], size: 12, max: 14 },
];

interface StaffDef {
  key: string;
  fullName: string;
  gender: Student["gender"];
  category: StaffCategory;
  roleTitle: string;
  specialty: string;
  contractType: NonNullable<Teacher["contractType"]>;
  salary: number;
  duties: string;
}

/** 15 membres du personnel, toutes catégories. */
export const STAFF_DEFS: StaffDef[] = [
  { key: "T01", fullName: "عبد الرحيم الوزاني", gender: "ذكر", category: "أستاذ / محفظ", roleTitle: "محفظ رئيسي", specialty: "حفظ وتثبيت", contractType: "عقد عمل دائم", salary: 3000, duties: "تحفيظ حلقتي النور والتقوى، تتبع الحفظ اليومي" },
  { key: "T02", fullName: "فاطمة الزهراء بناني", gender: "أنثى", category: "أستاذ / محفظ", roleTitle: "محفظة", specialty: "حفظ وتثبيت", contractType: "مكافأة شهرية", salary: 2600, duties: "تحفيظ البراعم والبيان" },
  { key: "T03", fullName: "محمد أمين الشرقاوي", gender: "ذكر", category: "أستاذ / محفظ", roleTitle: "محفظ ومجاز في التجويد", specialty: "تجويد وقراءات", contractType: "عقد عمل دائم", salary: 2800, duties: "حلقتا الفرقان والإتقان، الإجازات" },
  { key: "T04", fullName: "خديجة العمراني", gender: "أنثى", category: "أستاذ / محفظ", roleTitle: "محفظة", specialty: "حفظ وتثبيت", contractType: "مكافأة شهرية", salary: 2400, duties: "حلقتا الزهور والرحمة" },
  { key: "T05", fullName: "إسماعيل البوعزاوي", gender: "ذكر", category: "أستاذ / محفظ", roleTitle: "محفظ", specialty: "حفظ وتثبيت", contractType: "عقد مؤقت / بالساعة", salary: 2200, duties: "حلقة الإيمان" },
  { key: "T06", fullName: "نزهة الإدريسي", gender: "أنثى", category: "أستاذ / محفظ", roleTitle: "محفظة ومدرسة تجويد", specialty: "تجويد وقراءات", contractType: "مكافأة شهرية", salary: 2400, duties: "حلقتا الهدى والتجويد" },
  { key: "T07", fullName: "الحسن أيت بلا", gender: "ذكر", category: "أستاذ / محفظ", roleTitle: "محفظ احتياطي", specialty: "مراجعة وتثبيت", contractType: "منحة تدريب", salary: 1200, duties: "التعويض والمراجعة الجماعية" },
  { key: "T08", fullName: "رشيد المنصوري", gender: "ذكر", category: "مؤطر / مشرف تربوي", roleTitle: "مشرف تربوي", specialty: "تأطير أنشطة", contractType: "عقد عمل دائم", salary: 2800, duties: "الإشراف التربوي، لجنة الامتحانات" },
  { key: "T09", fullName: "سميرة الكتاني", gender: "أنثى", category: "مؤطر / مشرف تربوي", roleTitle: "مؤطرة الأنشطة", specialty: "تأطير أنشطة", contractType: "مكافأة شهرية", salary: 2000, duties: "حلقة اليقين، الأنشطة والرحلات" },
  { key: "T10", fullName: "عبد الإله الصقلي", gender: "ذكر", category: "إداري / كاتب", roleTitle: "كاتب عام", specialty: "إدارة وتسيير", contractType: "عقد عمل دائم", salary: 3200, duties: "التسجيلات، المراسلات، الملفات الإدارية" },
  { key: "T11", fullName: "حنان الطاهري", gender: "أنثى", category: "إداري / كاتب", roleTitle: "مكلفة بالمالية", specialty: "إدارة وتسيير", contractType: "عقد عمل دائم", salary: 2700, duties: "الرسوم، الوصولات، المصاريف" },
  { key: "T12", fullName: "مصطفى بوشعيب", gender: "ذكر", category: "عامل نظافة / صيانة", roleTitle: "عون صيانة", specialty: "نظافة وصيانة", contractType: "عقد عمل دائم", salary: 1700, duties: "الصيانة والإصلاحات الصغيرة" },
  { key: "T13", fullName: "زهرة الحمداوي", gender: "أنثى", category: "عامل نظافة / صيانة", roleTitle: "عاملة نظافة", specialty: "نظافة وصيانة", contractType: "عقد مؤقت / بالساعة", salary: 1500, duties: "نظافة القاعات والمرافق" },
  { key: "T14", fullName: "أنور الفاسي", gender: "ذكر", category: "متطوع", roleTitle: "متطوع لدعم الحفظ", specialty: "تطوع", contractType: "تطوعي", salary: 0, duties: "مساعدة المحفظين في التسميع" },
  { key: "T15", fullName: "سلمى الرايس", gender: "أنثى", category: "متطوع", roleTitle: "متطوعة في الأنشطة", specialty: "تطوع", contractType: "تطوعي", salary: 0, duties: "مرافقة الرحلات والحفلات" },
];

export interface SizeProfile {
  classes: string[];
  /** Nombre d'élèves par halaqa (défaut : celui de la définition). */
  perClass?: Record<string, number>;
  staff: string[];
  activities: number;
  notifications: number;
  extraExpenses: number;
  incomes: number;
  attendanceMonths: number;
  progressDays: number;
  examMonths: number;
}

export const SIZE_PROFILES: Record<FixtureSize, SizeProfile> = {
  large: {
    classes: CLASS_DEFS.map((c) => c.key),
    staff: STAFF_DEFS.map((s) => s.key),
    activities: 4,
    notifications: 30,
    extraExpenses: 9,
    incomes: 10,
    attendanceMonths: 3,
    progressDays: 30,
    examMonths: 3,
  },
  // Environ dix fois plus petit (mêmes périodes, moins de monde).
  small: {
    classes: ["C04", "C09"],
    perClass: { C04: 8, C09: 7 },
    staff: ["T01", "T06", "T08", "T10", "T12", "T14"],
    activities: 1,
    notifications: 3,
    extraExpenses: 1,
    incomes: 2,
    attendanceMonths: 3,
    progressDays: 30,
    examMonths: 3,
  },
};

export interface FixtureLinks {
  /** Fiche du muhaffiz lié au compte test_enseignant (et ses halaqas). */
  teacherId: string;
  teacherClassIds: string[];
  /** Fiche administrative liée au compte test_admin. */
  officeTeacherId: string;
  /** Deux élèves frères ou sœurs (compte test_parent). */
  parentStudentIds: [string, string];
  parentName: string;
  parentPhone: string;
  /** Élève le plus âgé (compte test_eleve). */
  studentId: string;
  studentName: string;
}

export interface SchoolFixtures {
  collections: Record<string, Record<string, Doc>>;
  links: FixtureLinks;
  /** Mois de cotisation générés (AAAA-MM). */
  paymentMonths: string[];
}

export interface BuildOptions {
  schoolId: string;
  size: FixtureSize;
  now: Date;
  /** Paramètres de l'école (cotisation, ouverture, saison) : lus, jamais modifiés. */
  settings?: Partial<SystemSettings> | null;
}

function seasonStart(settings: Partial<SystemSettings> | null | undefined, now: Date): { y: number; m: number } {
  const m = /^(\d{4})\s*\/\s*\d{4}$/.exec(String(settings?.activeAcademicSeason || "").trim());
  if (m) return { y: Number(m[1]), m: 8 };
  return { y: now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1, m: 8 };
}

/** Construit le jeu complet. Lève une erreur si un invariant du jeu n'est pas tenu. */
export function buildSchoolFixtures(opts: BuildOptions): SchoolFixtures {
  const { schoolId, size, settings } = opts;
  const profile = SIZE_PROFILES[size];
  if (!profile) throw new Error(`Taille inconnue : ${size}`);
  const rng = new Rng(`${schoolId}:${size}`);
  const now = opts.now;
  const nowIso = now.toISOString();
  const today = utcDay(now);
  const nowY = today.getUTCFullYear();
  const nowM = today.getUTCMonth();

  const cols: Record<string, Record<string, Doc>> = Object.fromEntries(FIXTURE_COLLECTIONS.map((c) => [c, {}]));
  const put = (col: string, id: string, body: Doc) => {
    if (cols[col][id]) throw new Error(`Identifiant en double : ${col}/${id}`);
    if (col === STAFF_PRIVATE_COLLECTION) cols[col][id] = { ...body, teacherId: id, schoolId, updatedAt: nowIso };
    else cols[col][id] = { ...body, id, schoolId, demoData: true };
  };
  const tid = (key: string) => `${DEMO_PREFIX}${key.replace(/^T/, "T-")}`;
  const cid = (key: string) => `${DEMO_PREFIX}${key.replace(/^C/, "C-")}`;
  const phone = (() => {
    const used = new Set<string>();
    return () => {
      for (;;) {
        const p = `06 00 ${pad(rng.int(10, 99))} ${pad(rng.int(0, 99))} ${pad(rng.int(0, 99))}`;
        if (!used.has(p)) {
          used.add(p);
          return p;
        }
      }
    };
  })();
  const address = () => `${rng.pick(STREETS)} رقم ${rng.int(1, 120)}، ${rng.pick(QUARTERS)} (عنوان وهمي)`;

  // ------------------------------------------------------------ personnel
  const staffKeys = new Set(profile.staff);
  const staff = STAFF_DEFS.filter((s) => staffKeys.has(s.key));
  const staffNames = new Map<string, string>();
  for (const [i, s] of staff.entries()) {
    const id = tid(s.key);
    staffNames.set(id, s.fullName);
    const joined = dayOfMonth(nowY - rng.int(0, 6), 8, rng.int(1, 20));
    const record: Partial<Teacher> & Doc = {
      fullName: s.fullName,
      photo: "",
      phone: phone(),
      whatsapp: "",
      email: "",
      specialty: s.specialty,
      trainingCourses: s.category === "أستاذ / محفظ" ? ["دورة في طرق التحفيظ", "أحكام التجويد (رواية ورش)"] : [],
      isArchived: false,
      joinedDate: iso(joined),
      category: s.category,
      roleTitle: s.roleTitle,
      duties: s.duties,
      assignedAreas: "",
      workSchedule: "",
      // Champs RH : partent dans staffPrivate (D42).
      contractType: s.contractType,
      cinNumber: `XX${pad(900000 + i * 7919 + rng.int(0, 999), 6)}`,
      birthDate: iso(addDays(dayOfMonth(nowY - rng.int(24, 55), rng.int(0, 11), 1), rng.int(0, 27))),
      address: address(),
      emergencyContact: phone(),
      ...(s.salary > 0 ? { monthlySalary: s.salary } : {}),
    };
    const { publicData, privateData } = splitStaffRecord(record);
    put("teachers", id, publicData);
    put(STAFF_PRIVATE_COLLECTION, id, privateData);
  }

  // ------------------------------------------------------------ halaqas
  const classKeys = new Set(profile.classes);
  const classes = CLASS_DEFS.filter((c) => classKeys.has(c.key));
  const leaders = new Map<string, string[]>();
  for (const c of classes) {
    const teacherId = tid(c.teacher);
    if (!staffNames.has(teacherId)) throw new Error(`Halaqa ${c.key} : muhaffiz ${c.teacher} absent du jeu ${size}.`);
    const assigned = classes.filter((x) => x.teacher === c.teacher).map((x) => x.name).join("، ");
    cols.teachers[teacherId].assignedAreas = assigned;
    cols.teachers[teacherId].workSchedule = classes.filter((x) => x.teacher === c.teacher).map((x) => x.schedule).join(" ؛ ");
    leaders.set(teacherId, [...(leaders.get(teacherId) || []), cid(c.key)]);
    const body: Partial<Class> = { name: c.name, teacherId, schedule: c.schedule, maxStudents: c.max, isArchived: false };
    put("classes", cid(c.key), body as Doc);
  }

  // ------------------------------------------------------------ élèves et familles
  interface Family { father: string; parentName: string; familyName: string; phone: string; kids: number }
  const families: Family[] = [];
  const newFamily = (): Family => {
    const familyName = rng.pick(FAMILY);
    const father = `${rng.pick(MALE)} ${familyName}`;
    const mother = rng.chance(0.2) ? `${rng.pick(FEMALE)} ${rng.pick(FAMILY)}` : null;
    const f = { father, parentName: mother ?? father, familyName, phone: phone(), kids: 0 };
    families.push(f);
    return f;
  };
  interface StudentInfo { id: string; num: number; classKey: string; teacherId: string; days: number[]; reg: Date; archived: boolean; hizb: number; absentRate: number; lateRate: number; name: string; phone: string; gender: Student["gender"]; age: number; tajweed: TajweedLevel; rating: number }
  const students: StudentInfo[] = [];
  let num = 0;
  const notesPool = ["", "", "", "", "", "يحتاج إلى متابعة في المراجعة", "متميز في التلاوة", "صوت حسن، يشجع على المشاركة في المسابقات", "غيابات متكررة، تم التواصل مع ولي الأمر", "يحتاج إلى تحسين مخارج الحروف", "مواظب ومنضبط"];
  for (const c of classes) {
    const count = profile.perClass?.[c.key] ?? c.size;
    for (let k = 0; k < count; k++) {
      num++;
      const id = `${DEMO_PREFIX}S-${pad(num, 3)}`;
      const gender: Student["gender"] = c.gender ?? (rng.chance(0.5) ? "ذكر" : "أنثى");
      // Famille : un frère ou une sœur d'un élève déjà inscrit (au plus 3 enfants), sinon nouvelle.
      let family: Family;
      if (num === 2) family = families[0]; // garantit une fratrie (compte test_parent)
      else {
        const open = families.filter((f) => f.kids < 3);
        family = open.length && rng.chance(0.25) ? rng.pick(open) : newFamily();
      }
      family.kids++;
      const age = rng.int(c.ages[0], c.ages[1]);
      const birth = addDays(dayOfMonth(nowY - age - 1, nowM, today.getUTCDate()), rng.int(1, 364));
      const hizb = Math.min(60, Math.max(0, rng.int(c.hizb[0], c.hizb[1])));
      const tajweed: TajweedLevel = rng.weighted<TajweedLevel>(hizb >= 30 ? [["ممتاز", 5], ["متوسط", 4], ["ضعيف", 1]] : hizb >= 10 ? [["ممتاز", 2], ["متوسط", 6], ["ضعيف", 2]] : [["ممتاز", 1], ["متوسط", 5], ["ضعيف", 4]]);
      // Inscription : nouvelle cette saison (~15 %), sinon une rentrée précédente.
      const maxYears = Math.max(0, Math.min(age - 5, 4));
      const yearsAgo = rng.chance(0.15) || maxYears === 0 ? 0 : rng.int(1, maxYears);
      let reg = yearsAgo === 0 ? addDays(today, -rng.int(3, 75)) : dayOfMonth(nowY - yearsAgo, rng.pick([8, 8, 9, 0]), rng.int(1, 28));
      if (reg > today) reg = addDays(today, -rng.int(3, 30));
      const archived = num % 37 === 0;
      const absentRate = rng.weighted<number>([[0.03, 4], [0.06, 4], [0.1, 2], [0.22, 1]]);
      const s: Partial<Student> & Doc = {
        fullName: `${rng.pick(gender === "ذكر" ? MALE : FEMALE)} ${family.familyName}`,
        photo: "",
        birthDate: iso(birth),
        gender,
        registrationDate: iso(reg),
        parentName: family.parentName,
        parentPhone: family.phone,
        docParentId: rng.chance(0.85),
        docBirthCert: rng.chance(0.9),
        docPhotos: rng.chance(0.7),
        hizbCount: hizb,
        currentSurah: surahForHizb(hizb, rng),
        tajweedLevel: tajweed,
        notes: rng.pick(notesPool),
        classId: cid(c.key),
        isArchived: archived,
      };
      put("students", id, s);
      students.push({
        id, num, classKey: c.key, teacherId: tid(c.teacher), days: c.days, reg: utcDay(reg), archived, hizb,
        absentRate, lateRate: 0.05, name: String(s.fullName), phone: family.phone, gender, age, tajweed,
        rating: tajweed === "ممتاز" ? 2 : tajweed === "متوسط" ? 1 : 0,
      });
    }
  }

  // ------------------------------------------------------------ présences et suivi du hifz
  const attendanceStart = addDays(utcDay(addMonths(today, -profile.attendanceMonths)), 1);
  const progressStart = addDays(today, -profile.progressDays + 1);
  const ratings = ["ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"] as const;
  for (const st of students) {
    if (st.archived) continue;
    let streak = 0; // absences consécutives en cours (certaines déclenchent l'alerte « 3 حصص »)
    let verse = rng.int(1, 20);
    for (let d = new Date(Math.max(attendanceStart.getTime(), st.reg.getTime())); d <= today; d = addDays(d, 1)) {
      if (!st.days.includes(d.getUTCDay())) continue;
      const date = iso(d);
      let status: Attendance["status"];
      if (streak > 0 && streak < 3 && rng.chance(0.5)) status = "غائب";
      else status = rng.chance(st.absentRate) ? "غائب" : rng.chance(st.lateRate) ? "متأخر" : "حاضر";
      streak = status === "غائب" ? streak + 1 : 0;
      const att: Partial<Attendance> & Doc = { date, studentId: st.id, status };
      if (status === "متأخر") att.notes = rng.pick(["تأخر 10 دقائق", "تأخر بسبب الدراسة", "تأخر 20 دقيقة"]);
      if (status === "غائب" && rng.chance(0.3)) att.notes = rng.pick(["غياب بعذر (مرض)", "سفر عائلي", "غياب مبرر من ولي الأمر"]);
      // Identifiant de l'application (a_<date>_<élève>), voir le marquage en tête de fichier.
      put("attendance", `a_${date}_${st.id}`, att);

      if (status !== "غائب" && d >= progressStart) {
        const surah = surahForHizb(st.hizb, rng).replace(/^سورة /, "");
        const from = verse;
        verse += rng.int(3, 10);
        const dp: Partial<DailyProgress> & Doc = {
          studentId: st.id,
          date,
          memorizationPart: `${surah}: الآيات ${from}-${verse}`,
          revisionPart: `مراجعة ${surahForHizb(Math.min(60, st.hizb + 1), rng)}`,
          rating: ratings[Math.min(4, Math.max(0, st.rating + rng.int(0, 2) + (status === "متأخر" ? -1 : 0)))],
          teacherId: st.teacherId,
        };
        if (st.hizb >= 10 && rng.chance(0.5)) dp.oldRevisionPart = `الحزب ${rng.int(61 - st.hizb, 60)}`;
        if (rng.chance(0.15)) dp.notes = rng.pick(["حفظ متقن", "يحتاج إلى تكرار", "أخطاء في المدود", "تحسن ملحوظ", "تسميع جيد مع تنبيه على الوقف"]);
        put("dailyProgress", `${DEMO_PREFIX}DP-${date}-${pad(st.num, 3)}`, dp);
        if (verse > 120) verse = rng.int(1, 10);
      }
    }
  }

  // ------------------------------------------------------------ examens et attestations
  for (let m = 1; m <= profile.examMonths; m++) {
    const examDay = dayOfMonth(nowY, nowM - m, 20);
    const examDate = iso(examDay);
    for (const st of students) {
      if (st.archived || st.reg > examDay || !rng.chance(0.75)) continue;
      const base = 11 + st.rating * 2.5;
      const mem = Math.min(20, Math.max(6, Math.round(base + rng.int(-3, 4))));
      const taj = Math.min(20, Math.max(6, Math.round(base + rng.int(-4, 3))));
      const avg = (mem + taj) / 2;
      const overall: Grade["overallGrade"] = avg >= 17 ? "ممتاز" : avg >= 15 ? "جيد جداً" : avg >= 12 ? "جيد" : "مقبول";
      const h = Math.max(0, st.hizb - (m - 1));
      const portion = h === 0 ? "قصار السور (جزء عم)" : h === 1 ? "الحزب 60" : `من الحزب ${61 - h} إلى الحزب 60`;
      const g: Partial<Grade> & Doc = {
        studentId: st.id,
        examDate,
        testedPortion: portion,
        memorizationGrade: mem,
        tajweedGrade: taj,
        overallGrade: overall,
        examinerId: rng.chance(0.3) && staffNames.has(tid("T08")) ? tid("T08") : st.teacherId,
      };
      if (overall === "ممتاز") g.notes = "شهادة تقدير وتنويه";
      else if (overall === "مقبول") g.notes = "إعادة الاختبار بعد المراجعة";
      put("grades", `${DEMO_PREFIX}G-${examDate}-${pad(st.num, 3)}`, g);
    }
  }

  // ------------------------------------------------------------ cotisations
  // Depuis le début de la saison, jamais avant l'ouverture de l'école
  // (l'application masque ces mois) ; plus le mois d'ouverture s'il précède
  // la saison (l'application le crée sinon d'elle-même, sans marquage).
  const season = seasonStart(settings, today);
  const nowKey = monthKey(nowY, nowM);
  const openY = Number(settings?.openingYear);
  const openM = monthIndex(String(settings?.openingMonth || ""));
  const openKey = Number.isFinite(openY) && openY > 0 ? monthKey(openY, openM > 0 ? openM : 0) : null;
  const months: { y: number; m: number }[] = [];
  for (let k = monthKey(season.y, season.m); k <= nowKey; k++) {
    const y = Math.floor(k / 12);
    const m = k % 12;
    if (!isMonthBeforeOpening(settings, MONTHS_AR[m], y)) months.push({ y, m });
  }
  if (openKey !== null && openKey < monthKey(season.y, season.m) && openKey <= nowKey) months.unshift({ y: Math.floor(openKey / 12), m: openKey % 12 });
  let receipt = 0;
  for (const st of students) {
    const regKey = monthKey(st.reg.getUTCFullYear(), st.reg.getUTCMonth());
    const lateFamily = rng.chance(0.12); // familles souvent en retard ou en impayé
    for (const { y, m } of months) {
      const k = monthKey(y, m);
      if (k < regKey) continue;
      if (st.archived && k > monthKey(season.y, season.m)) continue;
      const month = MONTHS_AR[m];
      const current = k === nowKey;
      const roll = rng.next();
      const unpaid = current ? roll < (lateFamily ? 0.8 : 0.35) : roll < (lateFamily ? 0.35 : 0.05);
      const late = !unpaid && rng.chance(lateFamily ? 0.6 : 0.12);
      const p: Partial<Payment> & Doc = {
        studentId: st.id,
        year: y,
        month,
        amount: getSubscriptionAmount(settings, month, y),
        paymentDate: "",
        status: unpaid ? "غير مدفوع" : "مدفوع",
      };
      if (!unpaid) {
        let paid = late ? dayOfMonth(y, m, rng.int(16, 28)) : dayOfMonth(y, m, rng.int(1, 10));
        if (late && rng.chance(0.4)) paid = dayOfMonth(y, m + 1, rng.int(1, 12));
        if (paid > today) paid = today;
        receipt++;
        p.paymentDate = iso(paid);
        p.receiptNo = `REC-${y}-D${pad(receipt, 4)}`;
        p.paymentMethod = rng.weighted<NonNullable<Payment["paymentMethod"]>>([["نقداً", 8], ["تحويل بنكي", 2], ["شيك", 0.3]]);
        if (late) p.notes = "أداء متأخر";
      } else if (!current) {
        p.notes = "متأخر عن الأداء، تم التذكير";
      }
      put("payments", `${DEMO_PREFIX}P-${pad(st.num, 3)}-${y}${pad(m + 1)}`, p);
    }
  }

  // ------------------------------------------------------------ finances (3 derniers mois)
  const financeMonths = [2, 1, 0].map((back) => ({ y: new Date(Date.UTC(nowY, nowM - back, 1)).getUTCFullYear(), m: new Date(Date.UTC(nowY, nowM - back, 1)).getUTCMonth() }));
  const notAfterToday = (d: Date) => (d > today ? today : d);
  let exp = 0;
  const addExpense = (e: Partial<Expense> & Doc) => put("expenses", `${DEMO_PREFIX}E-${pad(++exp, 3)}`, e);
  for (const { y, m } of financeMonths) {
    const monthName = `${MONTHS_AR[m]} ${y}`;
    addExpense({ title: `فاتورة الكهرباء (${monthName})`, category: "فواتير وخدمات", amount: rng.int(260, 460), date: iso(notAfterToday(dayOfMonth(y, m, 12))), source: "الصندوق", invoiceNo: `ELEC-${y}${pad(m + 1)}`, supplier: "مزود الكهرباء (وهمي)" });
    addExpense({ title: `فاتورة الماء (${monthName})`, category: "فواتير وخدمات", amount: rng.int(80, 160), date: iso(notAfterToday(dayOfMonth(y, m, 14))), source: "الصندوق", invoiceNo: `EAU-${y}${pad(m + 1)}` });
    if (size === "large") addExpense({ title: `اشتراك الإنترنت (${monthName})`, category: "فواتير وخدمات", amount: 299, date: iso(notAfterToday(dayOfMonth(y, m, 5))), source: "حساب الجمعية البنكي" });
  }
  const extras: [string, Expense["category"], number, number][] = [
    ["اقتناء مصاحف (رواية ورش)", "مشتريات وتجهيزات", 900, 1800],
    ["سبورات وأقلام", "مشتريات وتجهيزات", 250, 600],
    ["مواد التنظيف", "مشتريات وتجهيزات", 150, 320],
    ["إصلاح الإنارة في القاعة 2", "صيانة وإصلاحات", 200, 700],
    ["صباغة قاعة البراعم", "صيانة وإصلاحات", 800, 1500],
    ["ضيافة اجتماع أولياء الأمور", "ضيافة وتنقل", 300, 650],
    ["تنقل المحفظين إلى دورة تكوينية", "ضيافة وتنقل", 200, 450],
    ["طباعة الشواهد والبطاقات", "أخرى", 150, 400],
    ["إصلاح صنابير الماء", "صيانة وإصلاحات", 120, 380],
  ];
  for (const [title, category, min, max] of extras.slice(0, profile.extraExpenses)) {
    const e: Partial<Expense> & Doc = { title, category, amount: rng.int(min, max), date: iso(addDays(today, -rng.int(1, 85))), source: rng.chance(0.7) ? "الصندوق" : "حساب الجمعية البنكي" };
    if (rng.chance(0.5)) e.supplier = "متجر الحي (وهمي)";
    addExpense(e);
  }
  const incomes: [string, OtherIncome["category"], number, number, string | undefined][] = [
    ["تبرع لفائدة الحلقات", "تبرعات", 500, 2000, "محسن (اسم وهمي)"],
    ["منحة دعم الأنشطة القرآنية", "دعم حكومي/مؤسساتي", 3000, 8000, "مؤسسة داعمة (وهمية)"],
    ["تبرع بمناسبة ختم القرآن", "تبرعات", 300, 1500, "أسرة أحد الطلاب"],
    ["مداخيل الحفل السنوي", "أنشطة ومهرجانات", 1200, 3500, undefined],
    ["اشتراكات أعضاء الجمعية", "اشتراكات أعضاء الجمعية", 600, 1500, undefined],
    ["تبرع لاقتناء المصاحف", "تبرعات", 800, 2500, "محسنة (اسم وهمي)"],
    ["دعم المجلس الجماعي", "دعم حكومي/مؤسساتي", 2000, 5000, "مجلس جماعي (وهمي)"],
    ["تبرع شهري منتظم", "تبرعات", 200, 500, "محسن (اسم وهمي)"],
    ["بيع منتوجات معرض الأنشطة", "أنشطة ومهرجانات", 400, 1200, undefined],
    ["تبرع عيني محول إلى نقدي", "أخرى", 300, 900, undefined],
  ];
  for (const [i, [title, category, min, max, donor]] of incomes.slice(0, profile.incomes).entries()) {
    const inc: Partial<OtherIncome> & Doc = { title, category, amount: rng.int(min, max), date: iso(addDays(today, -rng.int(1, 85))), source: rng.chance(0.5) ? "الصندوق" : "حساب الجمعية البنكي", receiptNo: `INC-${nowY}-D${pad(i + 1, 3)}` };
    if (donor) inc.donorName = donor;
    put("otherIncomes", `${DEMO_PREFIX}I-${pad(i + 1, 3)}`, inc);
  }
  // Salaires : mois passés versés, mois en cours en attente.
  const personType = (c: StaffCategory): SalaryPayment["personType"] =>
    c === "أستاذ / محفظ" ? "أستاذ / محفظ" : c === "عامل نظافة / صيانة" ? "عامل / مستخدم" : c === "متطوع" ? "أخرى" : "إطار إداري";
  let sal = 0;
  for (const s of staff) {
    if (s.salary <= 0) continue;
    for (const { y, m } of financeMonths) {
      const current = y === nowY && m === nowM;
      sal++;
      const sp: Partial<SalaryPayment> & Doc = {
        personType: personType(s.category),
        personId: tid(s.key),
        personName: s.fullName,
        roleTitle: s.roleTitle,
        amount: s.salary,
        month: MONTHS_AR[m],
        year: y,
        paymentDate: iso(dayOfMonth(y, m, 28)),
        paymentMethod: s.salary >= 2500 ? "تحويل بنكي" : "نقداً",
        paymentSource: s.salary >= 2500 ? "حساب الجمعية البنكي" : "الصندوق",
        status: current ? "مستحق (قيد الانتظار)" : "تم الصرف",
      };
      if (!current) sp.receiptNo = `SAL-${y}-D${pad(sal, 3)}`;
      put("salaryPayments", `${DEMO_PREFIX}SAL-${s.key}-${y}${pad(m + 1)}`, sp);
    }
  }

  // ------------------------------------------------------------ activités et sorties
  const active = students.filter((s) => !s.archived);
  const activityDefs: { title: string; type: ActivityTrip["type"]; start: number; days?: number; status: ActivityTrip["status"]; location: string; leaders: string[]; fee: number; cap?: number; audience: string; participants: number; expenses: [string, ActivityExpense["category"], number][] }[] = [
    { title: "رحلة استكشافية إلى الغابة", type: "رحلة استكشافية", start: -40, status: "مكتمل", location: "غابة المعمورة", leaders: ["T08", "T09", "T15"], fee: 60, cap: 50, audience: "الطلاب فقط", participants: 32, expenses: [["كراء حافلة", "كراء حافلة وتنقل", 1400], ["وجبات الغداء", "تغذية ومأكولات ومشروبات", 950], ["تأمين المشاركين", "تأمين ورسوم دخول مزارات", 160]] },
    { title: "مسابقة حفظ القرآن الكريم (الدورة الخريفية)", type: "نشاط تربوي وثقافي", start: -12, status: "مكتمل", location: "مقر الجمعية", leaders: ["T01", "T03", "T08"], fee: 0, audience: "الطلاب فقط", participants: 24, expenses: [["جوائز الفائزين", "جوائز وشواهد وميداليات", 1600], ["ضيافة لجنة التحكيم", "ضيافة وتنقل المؤطرين", 300]] },
    { title: "حفل تكريم حفظة كتاب الله", type: "حفل تكريم ومهرجان", start: 20, status: "قيد التسجيل", location: "قاعة الحي (عنوان وهمي)", leaders: ["T08", "T10"], fee: 20, cap: 200, audience: "الجميع (طلاب، أطر، أولياء أمور)", participants: 20, expenses: [["عربون كراء القاعة", "كراء فضاء أو مزرعة أو مسبح", 500]] },
    { title: "مخيم قرآني ربيعي", type: "مخيم قرآني صيفي/ربيعي", start: 120, days: 5, status: "مخطط له", location: "مخيم تربوي (عنوان وهمي)", leaders: ["T03", "T09"], fee: 350, cap: 40, audience: "الطلاب فقط", participants: 8, expenses: [] },
  ];
  let partNo = 0;
  let actExp = 0;
  for (const [i, a] of activityDefs.slice(0, profile.activities).entries()) {
    const id = `${DEMO_PREFIX}ACT-${pad(i + 1)}`;
    const start = addDays(today, a.start);
    const leaderIds = a.leaders.map(tid).filter((x) => staffNames.has(x));
    const created = addDays(today, Math.min(a.start, 0) - rng.int(15, 30));
    const act: Partial<ActivityTrip> & Doc = {
      title: a.title,
      type: a.type,
      startDate: iso(start),
      location: a.location,
      leaderIds,
      leaderNames: leaderIds.map((x) => staffNames.get(x)!),
      contributionFee: a.fee,
      status: a.status,
      targetAudience: a.audience,
      description: "نشاط تجريبي (بيانات وهمية)",
      meetingPoint: "أمام مقر الجمعية، الساعة 08:00",
      isArchived: false,
      createdAt: iso(created),
    };
    if (a.days) act.endDate = iso(addDays(start, a.days));
    if (a.cap) act.maxCapacity = a.cap;
    put("activities", id, act);
    const n = size === "large" ? a.participants : Math.max(3, Math.round(a.participants / 5));
    for (const st of rng.sample(active, n)) {
      partNo++;
      const status: ActivityParticipant["paymentStatus"] = a.fee === 0 ? "معفى" : rng.weighted<ActivityParticipant["paymentStatus"]>([["مدفوع", a.start < 0 ? 16 : 8], ["مدفوع جزئياً", 2], ["غير مدفوع", a.start < 0 ? 1 : 6], ["معفى", 1]]);
      const paid = status === "مدفوع" ? a.fee : status === "مدفوع جزئياً" ? Math.round(a.fee / 2) : 0;
      const part: Partial<ActivityParticipant> & Doc = {
        activityId: id,
        participantType: "طالب",
        referenceId: st.id,
        fullName: st.name,
        phone: st.phone,
        gender: st.gender,
        classId: cid(st.classKey),
        fee: a.fee,
        paidAmount: paid,
        paymentStatus: status,
        hasParentApproval: a.start < 0 || rng.chance(0.7),
        registeredAt: iso(addDays(created, rng.int(1, 10))),
      };
      if (paid > 0) {
        part.paymentDate = part.registeredAt;
        part.paymentMethod = "نقداً";
        part.receiptNo = `ACT-${pad(i + 1)}-D${pad(partNo, 3)}`;
      }
      if (rng.chance(0.08)) part.medicalNotes = rng.pick(["حساسية من الفول السوداني", "ربو خفيف، يحمل البخاخ", "حساسية من بعض الأدوية"]);
      put("activityParticipants", `${DEMO_PREFIX}PART-${pad(partNo, 3)}`, part);
    }
    for (const leader of leaderIds.slice(0, 1)) {
      partNo++;
      put("activityParticipants", `${DEMO_PREFIX}PART-${pad(partNo, 3)}`, {
        activityId: id, participantType: "أستاذ / محفظ", referenceId: leader, fullName: staffNames.get(leader)!,
        fee: 0, paidAmount: 0, paymentStatus: "معفى", registeredAt: iso(created), notes: "مؤطر النشاط",
      });
    }
    for (const [title, category, amount] of a.expenses.slice(0, size === "large" ? 3 : 2)) {
      actExp++;
      const date = iso(notAfterToday(addDays(start, -rng.int(0, 7))));
      const e: Partial<ActivityExpense> & Doc = { activityId: id, title, category, amount, date, paymentMethod: "نقداً", paidBy: staffNames.get(leaderIds[0]) ?? "", supplier: "مورد (وهمي)", createdAt: date };
      put("activityExpenses", `${DEMO_PREFIX}AE-${pad(actExp, 3)}`, e);
    }
  }

  // ------------------------------------------------------------ notifications
  const notifTemplates: ((st: StudentInfo) => Partial<Notification>)[] = [
    (st) => ({ title: "تسجيل طالب جديد", message: `تم إضافة الطالب(ة) ${st.name} إلى ${CLASS_DEFS.find((c) => c.key === st.classKey)!.name}`, type: "نجاح" }),
    (st) => ({ title: "تنبيه غياب متكرر ⚠️", message: `الطالب(ة) ${st.name} متغيب(ة) لـ 3 حصص متتالية! يرجى إرسال إنذار غياب لولي أمره.`, type: "تنبيه" }),
    (st) => ({ title: "أداء واجب شهري", message: `تم تسجيل أداء الواجب الشهري للطالب(ة) ${st.name}`, type: "مالي" }),
    (st) => ({ title: "تحديث مستوى الحفظ", message: `بلغ الطالب(ة) ${st.name} ${st.hizb} حزباً`, type: "نجاح" }),
    () => ({ title: "اجتماع الأطر التربوية", message: "اجتماع الأطر يوم السبت المقبل على الساعة 10:00 بمقر الجمعية", type: "إداري" }),
    () => ({ title: "تذكير بالواجبات المتأخرة", message: "عدد من الأسر لم تؤد واجب الشهر الماضي، يرجى المتابعة", type: "مالي" }),
  ];
  for (let i = 0; i < profile.notifications; i++) {
    const st = rng.pick(active);
    const ago = Math.round(((profile.notifications - i) * 30) / profile.notifications);
    const n = notifTemplates[i % notifTemplates.length](st);
    put("notifications", `${DEMO_PREFIX}N-${pad(i + 1, 3)}`, { ...n, date: iso(addDays(today, -ago)), isRead: ago > 7 || rng.chance(0.3) });
  }

  // ------------------------------------------------------------ liens des comptes de test
  const t01 = tid("T01");
  const fam0 = students.filter((s) => s.phone === students[0].phone);
  const oldest = [...students].filter((s) => !s.archived).sort((a, b) => b.age - a.age || a.num - b.num)[0];
  if (fam0.length < 2 || !leaders.get(t01)?.length || !staffNames.has(tid("T10"))) throw new Error("Jeu incomplet (fratrie, muhaffiz ou administratif manquant).");
  const links: FixtureLinks = {
    teacherId: t01,
    teacherClassIds: leaders.get(t01)!,
    officeTeacherId: tid("T10"),
    parentStudentIds: [fam0[0].id, fam0[1].id],
    parentName: String(cols.students[fam0[0].id].parentName),
    parentPhone: fam0[0].phone,
    studentId: oldest.id,
    studentName: oldest.name,
  };
  return { collections: cols, links, paymentMonths: months.map(({ y, m }) => `${y}-${pad(m + 1)}`) };
}

/** Nombre de documents par collection. */
export function countFixtures(f: SchoolFixtures): Record<string, number> {
  return Object.fromEntries(Object.entries(f.collections).map(([c, docs]) => [c, Object.keys(docs).length]));
}
