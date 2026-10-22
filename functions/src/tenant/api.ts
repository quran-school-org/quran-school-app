/**
 * Fonction HTTP `api` (servie sous /api/** par le rewrite Hosting).
 *
 * POST /api/gemini/analyze : rapport pédagogique IA d'un élève.
 *   - exige un ID token Firebase (Authorization: Bearer …) ;
 *   - exige l'appartenance ACTIVE à l'école (schoolId) avec un rôle pédagogique ;
 *   - clé Gemini lue dans Secret Manager (defineSecret GEMINI_API_KEY) ;
 *   - en cas d'erreur : rapport de repli, sans détail technique (faille S7) ;
 *   - corps limité à MAX_BODY_BYTES (413), champs tronqués dans l'invite ;
 *   - limitation de débit par utilisateur, par école et globale (aiQuota.ts,
 *     429 + Retry-After) ;
 *   - journaux sans donnée personnelle : école, pseudonyme de l'utilisateur,
 *     issue, durée ; jamais le nom de l'élève, l'invite ni la réponse (D43) ;
 *   - réponses `Cache-Control: private, no-store` (D67).
 * GET /api/health : état du service.
 */
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { GoogleGenAI } from "@google/genai";

import { adminAuth, adminDb } from "../admin.js";
import { FUNCTIONS_REGION } from "../config.js";
import { SCHOOL_ID_PATTERN } from "../shared/schoolDefaults.js";
import { consumeAiQuota, currentLimits, pseudonym, type AiLimits } from "./aiQuota.js";
import { appCheckEnforced, checkAppCheckHeader, type AppCheckVerifier } from "../appCheck.js";

/** Taille maximale du corps JSON accepté (octets). Les champs restent tronqués dans l'invite. */
export const MAX_BODY_BYTES = 32 * 1024;

export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
export const GEMINI_MODEL = defineString("GEMINI_MODEL", { default: "gemini-3.7-flash", description: "Modèle Gemini du rapport IA." });

const EDUCATOR_ROLES = ["مدير", "إداري", "مؤطر", "مدرس"];

type Req = { method: string; path: string; headers: Record<string, string | string[] | undefined>; body: any; rawBody?: Buffer };
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

/** Taille du corps reçu (octets) : corps brut si disponible, sinon JSON resérialisé. */
export function bodySize(req: Req): number {
  if (req.rawBody && typeof req.rawBody.length === "number") return req.rawBody.length;
  try {
    return Buffer.byteLength(JSON.stringify(req.body ?? null), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/** Vérifie le jeton et l'appartenance ; renvoie le nom de l'école ou un code d'erreur HTTP. */
export async function authorizeAnalyze(req: Req): Promise<{ schoolName: string; uid: string; schoolId: string } | { status: number; error: string }> {
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
  return { uid, schoolId, schoolName: settings?.associationName || (await school.get()).data()?.name || "المدرسة القرآنية" };
}

export interface ApiOptions {
  /** Surcharges des limites (tests). */
  limits?: Partial<AiLimits>;
  /** Horloge (tests). */
  now?: () => Date;
  /** App Check : application forcée (défaut : paramètre APPCHECK_ENFORCE) et vérificateur (tests). */
  enforceAppCheck?: boolean;
  verifyAppCheck?: AppCheckVerifier;
}

/** Journal structuré SANS donnée personnelle (ni nom d'élève, ni invite, ni réponse, ni uid en clair). */
function logAnalyze(outcome: string, fields: { schoolId?: string; uid?: string; startedAt: number; extra?: Record<string, unknown> }) {
  logger.info("ai.analyze", {
    outcome,
    schoolId: fields.schoolId,
    user: fields.uid ? pseudonym(fields.uid) : undefined,
    ms: Date.now() - fields.startedAt,
    ...fields.extra,
  });
}

export async function handleApi(req: Req, res: Res, generate?: (prompt: string) => Promise<string>, opts: ApiOptions = {}) {
  const path = req.path.replace(/^\/api/, "") || "/";
  if (req.method === "GET" && path === "/health") {
    res.json({ status: "ok", time: new Date().toISOString() });
    return;
  }
  if (req.method === "POST" && path === "/gemini/analyze") {
    const startedAt = Date.now();
    // Réponse propre à un utilisateur et à un élève : jamais mise en cache (CDN
    // Hosting, navigateur, proxy), quelle que soit l'issue (revue, D67).
    res.set?.("Cache-Control", "private, no-store");
    if (bodySize(req) > MAX_BODY_BYTES) {
      logAnalyze("rejected-too-large", { startedAt });
      res.status(413).json({ error: "payload-too-large" });
      return;
    }
    const appCheck = await checkAppCheckHeader(req.headers, opts.enforceAppCheck ?? appCheckEnforced(), opts.verifyAppCheck);
    if (!appCheck.allowed) {
      logAnalyze("rejected-app-check", { startedAt, extra: { appCheck: appCheck.state } });
      res.status(401).json({ error: "app-check" });
      return;
    }
    const auth = await authorizeAnalyze(req);
    if ("error" in auth) {
      logAnalyze(`rejected-${auth.error}`, { startedAt });
      res.status(auth.status).json({ error: auth.error });
      return;
    }
    let quota;
    try {
      quota = await consumeAiQuota(adminDb(), auth.uid, auth.schoolId, currentLimits(opts.limits), opts.now ? opts.now() : new Date());
    } catch (error) {
      // Compteur indisponible : on refuse plutôt que d'ouvrir le service sans limite.
      logAnalyze("quota-error", { schoolId: auth.schoolId, uid: auth.uid, startedAt, extra: { errorName: (error as Error)?.name } });
      res.status(503).json({ error: "unavailable" });
      return;
    }
    if (!quota.allowed) {
      logAnalyze("rate-limited", { schoolId: auth.schoolId, uid: auth.uid, startedAt, extra: { scope: quota.scope } });
      res.set?.("Retry-After", String(quota.retryAfterSeconds));
      res.status(429).json({ error: "rate-limited", scope: quota.scope, retryAfterSeconds: quota.retryAfterSeconds });
      return;
    }
    try {
      const prompt = buildPrompt(auth.schoolName, req.body);
      if (!generate && !GEMINI_API_KEY.value()) {
        // Pas de clé (émulateurs, ou secret non configuré) : aucun appel externe.
        logAnalyze("fallback-no-key", { schoolId: auth.schoolId, uid: auth.uid, startedAt });
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
      const report = JSON.parse(text);
      logAnalyze("ok", { schoolId: auth.schoolId, uid: auth.uid, startedAt, extra: { promptChars: prompt.length, remainingUser: quota.remaining.user, appCheck: appCheck.state } });
      res.json(report);
    } catch (error) {
      // Ni message brut (il peut citer l'invite), ni pile : le nom et le code HTTP éventuel.
      const e = error as { name?: string; status?: number; code?: unknown };
      logger.error("ai.analyze", {
        outcome: "fallback-error",
        schoolId: auth.schoolId,
        user: pseudonym(auth.uid),
        ms: Date.now() - startedAt,
        errorName: e?.name || "Error",
        errorStatus: typeof e?.status === "number" ? e.status : undefined,
      });
      res.json(fallbackReport(req.body));
    }
    return;
  }
  res.status(404).json({ error: "not-found" });
}

export const api = onRequest({ region: FUNCTIONS_REGION, secrets: [GEMINI_API_KEY], cors: true }, (req, res) => handleApi(req as any, res as any));
