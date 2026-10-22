import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI analysis route for Quran student progress
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { studentName, hizbCount, tajweedLevel, age, notes, attendanceRate, recentGrades } = req.body;

    if (!studentName) {
      return res.status(400).json({ error: "اسم الطالب مطلوب" });
    }

    const prompt = `
أنت معلم وموجه ذكاء اصطناعي خبير في تحفيظ القرآن الكريم وتجويده لنادي "الفجر الجديد للقرآن".
أريدك أن تكتب تقريراً تربوياً شاملاً واحترافياً باللغة العربية الفصحى وبأسلوب مشجع ومحبب، لمساعدة الطالب وولي أمره ومعلمه.

معلومات الطالب:
- الاسم الكامل: ${studentName}
- العمر: ${age || "غير محدد"} سنة
- عدد الأحزاب المحفوظة: ${hizbCount || 0} حزب من القرآن الكريم
- مستوى التجويد الحالي: ${tajweedLevel || "متوسط"} (الخيارات المتاحة: ممتاز، متوسط، ضعيف)
- نسبة الحضور والغياب: ${attendanceRate || "100"}%
- الدرجات الأخيرة في الاختبارات: ${recentGrades || "لا توجد درجات مسجلة حالياً"}
- ملاحظات المعلم الإضافية: ${notes || "لا توجد ملاحظات إضافية"}

أريدك أن تولد رداً بصيغة JSON نظيفة تحتوي على المفاتيح التالية باللغة العربية الفصحى:
1. "summary": ملخص تربوي رائع عن تقدم الطالب ونقاط القوة لديه (2-3 أسطر).
2. "tajweedTips": 3 نصائح عملية ومحددة لتحسين التلاوة ومخارج الحروف والتجويد بناءً على مستواه الحالي (${tajweedLevel}).
3. "studyPlan": خطة حفظ ومراجعة مقترحة ومخصصة للأسبوع القادم (تشمل مقدار الحفظ اليومي ومقدار المراجعة وتنبيهات معينة).
4. "parentMessage": رسالة دافئة ومحفزة وموجهة مباشرة لولي أمر الطالب تخبره بكيفية مساندة ابنه في البيت وتدعو له ببركة القرآن.
5. "recommendedSurahs": قائمة بـ 3 سور أو أجزاء يوصى بالتركيز عليها حالياً بناءً على حفظه (${hizbCount} حزب).

تنبيه: يجب أن يكون الرد عبارة عن كود JSON صالح تماماً، دون علامات الاختصار أو كود إضافي خارج الـ JSON. لا تكتب علامات \`\`\`json في البداية والنهاية، فقط الـ JSON مباشرة ليكون قابلاً للقراءة الآلية.
`;

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiResponseText = response.text || "{}";
    const parsedData = JSON.parse(aiResponseText);
    res.json(parsedData);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Graceful fallback if Gemini API key is missing or calls fail
    res.json({
      summary: `تقرير تلقائي للطالب: يظهر الطالب التزاماً طيباً بنسبة حضور تبلغ ${req.body.attendanceRate || "100"}% وحفظه الحالي هو ${req.body.hizbCount || 0} حزباً. نوصي بمواصلة المراجعة اليومية المنتظمة لضمان ثبات الحفظ.`,
      tajweedTips: [
        "التدرب على مخارج الحروف الأساسية وخاصة حروف القلقلة والهمس.",
        "الاستماع المتكرر للقراء المتقنين مثل الشيخ محمود خليل الحصري وضبط الغنن.",
        "قراءة السور المحفوظة بتأمل وبطء لتطبيق الأحكام التجويدية بانتظام."
      ],
      studyPlan: "حفظ ربع حزب جديد كل يومين مع مراجعة حزب كامل يومياً لتمتين المحفوظ القديم.",
      parentMessage: "نشكركم جزيل الشكر على دعمكم المستمر لولدكم في رحلته مع كتاب الله الكريم. نوصيكم بتخصيص وقت محدد يومياً لتسميع محفوظه ومرافقته للمسجد لتشجيعه.",
      recommendedSurahs: ["الأجزاء الأخيرة من القرآن", "سورة البقرة للتثبيت", "السور القصيرة لضبط التلاوة"],
      isFallback: true
    });
  }
});

// Vite middleware setup for Development or Static serving for Production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
