/**
 * Fonction HTTP `api` (servie sous /api/** par le rewrite Hosting).
 *
 * POST /api/gemini/analyze : rapport pédagogique IA d'un élève.
 *   - exige un ID token Firebase (Authorization: Bearer …) ;
 *   - exige l'appartenance ACTIVE à l'école (schoolId) avec un rôle pédagogique ;
 *   - clé Gemini lue dans Secret Manager (defineSecret GEMINI_API_KEY) ;
 *   - en cas d'erreur : rapport de repli, sans détail technique (faille S7).
 * GET /api/health : état du service.
 */
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { GoogleGenAI } from "@google/genai";

import { adminAuth, adminDb } from "../admin.js";
import { FUNCTIONS_REGION } from "../config.js";
import { SCHOOL_ID_PATTERN } from "../shared/schoolDefaults.js";

export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
export const GEMINI_MODEL = defineString("GEMINI_MODEL", { default: "gemini-3.7-flash", description: "Modèle Gemini du rapport IA." });

const EDUCATOR_ROLES = ["مدير", "إداري", "مؤطر", "مدرس"];

type Req = { method: string; path: string; headers: Record<string, string | string[] | undefined>; body: any };
type Res = { status: (code: number) => Res; json: (body: unknown) => void; set?: (k: string, v: string) => void };

function fallbackReport(body: any) {
  return {
    summary: `تقرير تلقائي للطالب: يظهر الطالب التزاماً طيباً بنسبة حضور تبلغ ${Number(body?.attendanceRate) || 100}% وحفظه الحالي هو ${Number(body?.hizbCount) || 0} حزباً. نوصي بمواصلة المراجعة اليومية المنتظمة لضمان ثبات الحفظ.`,
    tajweedTips: [
      "التدرب على مخارج الحروف الأساسية وخاصة حروف القلقلة والهمس.",
      "الاستماع المتكرر للقراء المتقنين وضبط الغنن.",
      "قراءة السور المحفوظة بتأمل وبطء لتطبيق الأحكام التجويدية بانتظام.",
    ],
    studyPlan: "حفظ ربع حزب جديد كل يومين مع مراجعة حزب كامل يومياً لتمتين المحفوظ القديم.",
    parentMessage: "نشكركم جزيل الشكر على دعمكم المستمر لولدكم في رحلته مع كتاب الله الكريم. نوصيكم بتخصيص وقت محدد يومياً لتسميع محفوظه.",
    recommendedSurahs: ["الأجزاء الأخيرة من القرآن", "سورة البقرة للتثبيت", "السور القصيرة لضبط التلاوة"],
    isFallback: true,
  };
}

const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);

export function buildPrompt(schoolName: string, b: any): string {
  return `
أنت معلم وموجه ذكاء اصطناعي خبير في تحفيظ القرآن الكريم وتجويده لـ"${clip(schoolName, 120)}".
أريدك أن تكتب تقريراً تربوياً شاملاً واحترافياً باللغة العربية الفصحى وبأسلوب مشجع ومحبب، لمساعدة الطالب وولي أمره ومعلمه.

معلومات الطالب:
- الاسم الكامل: ${clip(b.studentName, 120)}
- العمر: ${clip(b.age || "غير محدد", 10)} سنة
- عدد الأحزاب المحفوظة: ${Number(b.hizbCount) || 0} حزب من القرآن الكريم
- مستوى التجويد الحالي: ${clip(b.tajweedLevel || "متوسط", 20)} (الخيارات المتاحة: ممتاز، متوسط، ضعيف)
- نسبة الحضور والغياب: ${Number(b.attendanceRate) || 100}%
- الدرجات الأخيرة في الاختبارات: ${clip(b.recentGrades || "لا توجد درجات مسجلة حالياً", 1000)}
- ملاحظات المعلم الإضافية: ${clip(b.notes || "لا توجد ملاحظات إضافية", 1000)}

أريدك أن تولد رداً بصيغة JSON نظيفة تحتوي على المفاتيح التالية باللغة العربية الفصحى:
1. "summary": ملخص تربوي عن تقدم الطالب ونقاط القوة لديه (2-3 أسطر).
2. "tajweedTips": 3 نصائح عملية لتحسين التلاوة والتجويد بناءً على مستواه الحالي.
3. "studyPlan": خطة حفظ ومراجعة مقترحة للأسبوع القادم.
4. "parentMessage": رسالة دافئة موجهة لولي أمر الطالب.
5. "recommendedSurahs": قائمة بـ 3 سور أو أجزاء يوصى بالتركيز عليها حالياً.

تنبيه: يجب أن يكون الرد JSON صالحاً تماماً، دون أي نص خارجه.
`;
}

/** Vérifie le jeton et l'appartenance ; renvoie le nom de l'école ou un code d'erreur HTTP. */
export async function authorizeAnalyze(req: Req): Promise<{ schoolName: string } | { status: number; error: string }> {
  const header = String(req.headers.authorization || req.headers.Authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { status: 401, error: "unauthenticated" };
  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return { status: 401, error: "unauthenticated" };
  }
  const schoolId = req.body?.schoolId;
  if (typeof schoolId !== "string" || !SCHOOL_ID_PATTERN.test(schoolId)) return { status: 400, error: "invalid-school" };
  const school = adminDb().collection("schools").doc(schoolId);
  const member = (await school.collection("members").doc(uid).get()).data();
  if (!member || member.isActive !== true || !EDUCATOR_ROLES.includes(member.role)) return { status: 403, error: "permission-denied" };
  if (typeof req.body?.studentName !== "string" || !req.body.studentName.trim()) return { status: 400, error: "missing-student" };
  const settings = (await school.collection("settings").doc("system").get()).data();
  return { schoolName: settings?.associationName || (await school.get()).data()?.name || "المدرسة القرآنية" };
}

export async function handleApi(req: Req, res: Res, generate?: (prompt: string) => Promise<string>) {
  const path = req.path.replace(/^\/api/, "") || "/";
  if (req.method === "GET" && path === "/health") {
    res.json({ status: "ok", time: new Date().toISOString() });
    return;
  }
  if (req.method === "POST" && path === "/gemini/analyze") {
    const auth = await authorizeAnalyze(req);
    if ("error" in auth) {
      res.status(auth.status).json({ error: auth.error });
      return;
    }
    try {
      const prompt = buildPrompt(auth.schoolName, req.body);
      if (!generate && !GEMINI_API_KEY.value()) {
        // Pas de clé (émulateurs, ou secret non configuré) : aucun appel externe.
        res.json(fallbackReport(req.body));
        return;
      }
      const text = generate
        ? await generate(prompt)
        : (await new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() }).models.generateContent({
            model: GEMINI_MODEL.value(),
            contents: prompt,
            config: { responseMimeType: "application/json" },
          })).text || "{}";
      res.json(JSON.parse(text));
    } catch (error) {
      logger.error("Gemini analyze failed", { error: String(error) });
      res.json(fallbackReport(req.body));
    }
    return;
  }
  res.status(404).json({ error: "not-found" });
}

export const api = onRequest({ region: FUNCTIONS_REGION, secrets: [GEMINI_API_KEY], cors: true }, (req, res) => handleApi(req as any, res as any));
