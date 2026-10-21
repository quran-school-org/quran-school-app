/**
 * Jeu de données FICTIF reproduisant la forme des données de prod (rapport §2),
 * dans la structure historique (collections à la racine, mots de passe en clair
 * dans appUsers). Utilisé par les tests sur émulateur et par le peuplement de
 * l'environnement de développement. AUCUNE donnée réelle : noms inventés,
 * téléphones fictifs (06 61 00 00 0x…), mots de passe de démonstration.
 *
 * Cas piégeux volontaires :
 *  - parents homonymes (« محمد العلوي ») avec des téléphones différents ;
 *  - téléphone partagé par deux parents de noms différents (S-105 / S-106) ;
 *  - même téléphone saisi avec deux formats (S-101 / S-102) ;
 *  - parents sans téléphone, rattachables par le seul nom (S-107 / S-108) ;
 *  - comptes dupliqués (même nom d'utilisateur pour deux parents) ;
 *  - nom d'utilisateur invalide (caractères arabes), compte sans mot de passe ;
 *  - compte parent saisi à la main sans élève d'origine ;
 *  - compte Auth préexistant dont le mot de passe est périmé ;
 *  - élève archivé et compte parent suspendu.
 */

export const DEMO_PASSWORDS = {
  director: "demo-directeur-2026",
  legacyDefault: "123",
  manualParent: "parent-demo-2026",
} as const;

type Doc = Record<string, unknown>;

export interface LegacyFixture {
  collections: Record<string, Record<string, Doc>>;
  settings: Doc;
  /** Comptes Firebase Auth déjà présents avant le Lot 0 (créés par l'ancien client). */
  preexistingAuth: { email: string; password: string; displayName?: string }[];
}

const staffPerms = (read: string[]) =>
  Object.fromEntries(read.map((m) => [m, { read: true, create: true, update: true, delete: false, print: true }]));

export function legacyFixture(): LegacyFixture {
  const teachers: Record<string, Doc> = {
    t1: { fullName: "يوسف البقالي", category: "أستاذ / محفظ", roleTitle: "محفظ", specialty: "حفظ وتثبيت", phone: "0600000001", monthlySalary: 2500, cinNumber: "XX000001", joinedDate: "2025-09-01", isArchived: false },
    t2: { fullName: "خالد التازي", category: "إداري / كاتب", roleTitle: "كاتب الجمعية", specialty: "إدارة", phone: "0600000002", monthlySalary: 3000, cinNumber: "XX000002", joinedDate: "2025-09-01", isArchived: false },
    t3: { fullName: "حمزة الفاسي", category: "متطوع", roleTitle: "متطوع", specialty: "تطوع", phone: "0600000003", joinedDate: "2025-09-01", isArchived: false },
    t4: { fullName: "سعيد المرابط", category: "عامل نظافة / صيانة", roleTitle: "عون نظافة", specialty: "نظافة وصيانة", phone: "0600000004", monthlySalary: 1500, joinedDate: "2025-09-01", isArchived: false },
    t5: { fullName: "عمر الإدريسي", category: "مؤطر / مشرف تربوي", roleTitle: "مؤطر الأنشطة", specialty: "تأطير أنشطة", phone: "0600000005", joinedDate: "2025-09-01", isArchived: false },
  };

  const student = (fullName: string, birthDate: string, parentName: string, parentPhone: string, classId: string, extra: Doc = {}): Doc => ({
    fullName, birthDate, parentName, parentPhone, classId,
    gender: "ذكر", registrationDate: "2026-07-01", photo: "", docParentId: true, docBirthCert: true, docPhotos: false,
    hizbCount: 5, currentSurah: "سورة النبأ", tajweedLevel: "متوسط", notes: "", isArchived: false, ...extra,
  });

  const students: Record<string, Doc> = {
    "S-101": student("ياسين العلمي", "2014-03-02", "محمد العلمي", "0661000001", "c1"),
    "S-102": student("مريم العلمي", "2016-05-10", "محمد العلمي", "06 61 00 00 01", "c1", { gender: "أنثى" }),
    "S-103": student("أيوب العلوي", "2013-01-15", "محمد العلوي", "0662000002", "c1"),
    "S-104": student("سارة العلوي", "2012-11-20", "محمد العلوي", "0663000003", "c2", { gender: "أنثى" }),
    "S-105": student("زينب الناصري", "2015-02-01", "فاطمة الناصري", "0664000004", "c2", { gender: "أنثى" }),
    "S-106": student("أنس بنجلون", "2011-08-08", "خديجة بنجلون", "0664000004", "c2"),
    "S-107": student("طارق السوسي", "2014-04-04", "عبد الله السوسي", "", "c1"),
    "S-108": student("حسن السوسي", "2015-06-06", "عبد الله السوسي", "", "c1"),
    "S-109": student("علي الرباطي", "2009-09-09", "إبراهيم الرباطي", "+212 665 000 005", "c2"),
    "S-110": student("عثمان الفيلالي", "2010-10-10", "مصطفى الفيلالي", "0666000006", "c2", { isArchived: true }),
    // Halaqa supprimée entre-temps (classId orphelin) et photo très lourde (~ 950 Ko de base64, proche de la limite d’un document).
    "S-111": student("زكرياء الحسني", "2013-12-12", "رشيد الحسني", "0667000007", "c9", { photo: `data:image/jpeg;base64,${"A".repeat(950_000)}` }),
  };

  const legacyUser = (username: string, fullName: string, role: string, extra: Doc = {}): Doc => ({
    username, fullName, role, password: DEMO_PASSWORDS.legacyDefault, isActive: true,
    canEditStudents: false, canEditTeachers: false, canEditGrades: false, canEditPayments: false, ...extra,
  });

  const appUsers: Record<string, Doc> = {
    u1: legacyUser("admin_alfajr", "مدير الجمعية (تجريبي)", "مدير", {
      password: DEMO_PASSWORDS.director, canEditStudents: true, canEditTeachers: true, canEditGrades: true, canEditPayments: true,
      lastLogin: "2026-10-20T08:00:00.000Z",
    }),
    t_t1: legacyUser("youssef_baqali", "يوسف البقالي", "مدرس", { teacherTakeAttendance: true, permissions: staffPerms(["teacher-dashboard", "attendance", "grades", "students"]) }),
    t_t2: legacyUser("khalid_tazi", "خالد التازي", "إداري", { canEditPayments: true }),
    t_t3: legacyUser("hamza_fassi", "حمزة الفاسي", "متطوع"),
    t_t4: legacyUser("said_morabit", "سعيد المرابط", "عامل نظافة / صيانة"),
    t_t5: legacyUser("omar_idrissi", "عمر الإدريسي", "مؤطر"),
    "p_S-101": legacyUser("mohammed_alami", "محمد العلمي", "ولي أمر", { phone: "0661000001", parentViewOwnPayments: true }),
    "p_S-103": legacyUser("mohammed_alaoui", "محمد العلوي", "ولي أمر", { phone: "0662000002" }),
    "p_S-104": legacyUser("mohammed_alaoui", "محمد العلوي", "ولي أمر", { phone: "0663000003" }),
    "p_S-105": legacyUser("fatima_naciri", "فاطمة الناصري", "ولي أمر", { phone: "0664000004" }),
    "p_S-107": legacyUser("abdellah_soussi", "عبد الله السوسي", "ولي أمر", { phone: "" }),
    "p_S-109": legacyUser("ibrahim_rebati", "إبراهيم الرباطي", "ولي أمر", { phone: "+212 665 000 005" }),
    "p_S-110": legacyUser("mustafa_filali", "مصطفى الفيلالي", "ولي أمر", { phone: "0666000006", isActive: false, isArchived: true }),
    "s_S-109": legacyUser("ali_rebati", "علي الرباطي", "طالب"),
    u_manual_parent: legacyUser("parent_manuel", "خديجة بنجلون", "ولي أمر", { password: DEMO_PASSWORDS.manualParent, phone: "0664000004" }),
    u_nopw: (() => { const u = legacyUser("sans_mdp", "أحمد بدون كلمة", "مدرس"); delete u.password; return u; })(),
    u_bad: legacyUser("أحمد", "أحمد الصغير", "مدرس"),
  };

  const classes: Record<string, Doc> = {
    c1: { name: "حلقة النور", teacherId: "t1", schedule: "السبت والأحد 09:00 - 12:00", maxStudents: 20, isArchived: false },
    c2: { name: "حلقة الإيمان", teacherId: "t5", schedule: "الأربعاء 15:00 - 17:00", maxStudents: 20, isArchived: false },
  };

  const attendance: Record<string, Doc> = {};
  const grades: Record<string, Doc> = {};
  const payments: Record<string, Doc> = {};
  const dailyProgress: Record<string, Doc> = {};
  // Présence d'un élève supprimé depuis (référence orpheline).
  attendance["a_2026-10-17_S-999"] = { date: "2026-10-17", studentId: "S-999", status: "غائب" };
  for (const id of Object.keys(students)) {
    attendance[`a_2026-10-17_${id}`] = { date: "2026-10-17", studentId: id, status: "حاضر" };
    grades[`g_${id}`] = { studentId: id, examDate: "2026-10-01", testedPortion: "الحزب 1", memorizationGrade: 16, tajweedGrade: 15, overallGrade: "جيد", examinerId: "t1" };
    payments[`p_init_${id}`] = { studentId: id, year: 2026, month: "يوليوز", amount: 70, paymentDate: "2026-07-05", status: "مدفوع", receiptNo: `REC-2026-${id}` };
    dailyProgress[`dp_${id}`] = { studentId: id, date: "2026-10-17", memorizationPart: "النبأ 1-10", revisionPart: "النازعات", rating: "جيد", teacherId: "t1" };
  }

  return {
    collections: {
      teachers, students, appUsers, classes, attendance, grades, payments, dailyProgress,
      otherIncomes: { i1: { title: "تبرع", category: "تبرعات", amount: 500, date: "2026-09-01", source: "الصندوق" } },
      expenses: { e1: { title: "فاتورة الكهرباء", category: "فواتير وخدمات", amount: 300, date: "2026-09-02", source: "الصندوق" } },
      salaryPayments: { sal1: { personType: "أستاذ / محفظ", personId: "t1", personName: "يوسف البقالي", amount: 2500, month: "شتمبر", year: 2026, paymentDate: "2026-09-30", paymentMethod: "نقداً", paymentSource: "الصندوق", status: "تم الصرف" } },
      activities: { act_demo: { title: "رحلة تجريبية", type: "رحلة استكشافية", startDate: "2026-11-01", location: "الغابة", leaderIds: ["t5"], contributionFee: 50, status: "قيد التسجيل", targetAudience: "الطلاب فقط", createdAt: "2026-10-01" } },
      activityParticipants: { part_demo: { activityId: "act_demo", participantType: "طالب", referenceId: "S-101", fullName: "ياسين العلمي", fee: 50, paidAmount: 50, paymentStatus: "مدفوع", registeredAt: "2026-10-02" } },
      activityExpenses: { ae_demo: { activityId: "act_demo", title: "كراء حافلة", category: "كراء حافلة وتنقل", amount: 400, date: "2026-10-03", paymentMethod: "نقداً", createdAt: "2026-10-03" } },
      notifications: { n_demo: { title: "تسجيل طالب جديد", message: "تم إضافة الطالب ياسين العلمي", date: "2026-10-01", type: "نجاح", isRead: false } },
    },
    settings: {
      associationName: "جمعية الفجر الجديد (بيانات تجريبية)",
      associationPhone: "0500000000",
      associationEmail: "",
      associationAddress: "عنوان تجريبي",
      associationLogo: "",
      directorName: "مدير الجمعية (تجريبي)",
      subscriptionFee: 100,
      currency: "درهم مغربي",
      allowSelfRegistration: false,
      showStampOnReceipts: true,
      stampText: "",
      activeAcademicSeason: "2026/2027",
      receiptPrefixFormat: "REC-{YEAR}-{NO}",
    },
    preexistingAuth: [
      { email: "admin_alfajr@alfajr.local", password: DEMO_PASSWORDS.director, displayName: "مدير الجمعية (تجريبي)" },
      // Créé par l'ancien client avec un mot de passe qui a changé depuis dans appUsers.
      { email: "youssef_baqali@alfajr.local", password: "ancien-mot-de-passe", displayName: "يوسف البقالي" },
    ],
  };
}
