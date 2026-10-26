/**
 * Chaînes arabes volontairement NON traduites (D79), comptées à part dans la
 * couverture : textes consacrés cités en arabe, et textes jamais affichés dans
 * l'application (messages WhatsApp envoyés aux parents, qui restent en arabe).
 */
export const KEEP_ARABIC: Record<string, string> = {
  "اللغة / Langue": "libellé bilingue du réglage de langue (D93), identique dans les deux langues",
  "العربية": "nom de la langue dans sa propre langue (réglage de langue, D93)",
  "«الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ»": "hadith cité en arabe (texte consacré)",
  "«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»": "hadith cité en arabe (texte consacré)",
};

export const NOT_DISPLAYED: Record<string, string> = {
  "السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) *{0}* المحترم(ة). نحيطكم علماً بأن ابنكم/ابنتكم قد تغيب عن حصص التحفيظ بـ *{1} حصص متتالية*. نرجو منكم التواصل مع إدارة {2} لتبرير هذا الغياب والتعاون معنا لضمان التزام الطالب وتقدمه الدراسي. جزاكم الله خيراً.": "message WhatsApp envoyé au parent (non affiché)",
  "السلام عليكم ورحمة الله وبركاته، المحترم(ة) السيد(ة) *{0}*، نعلمكم بأنه تم استلام دفعة الاشتراك المدرسي الخاصة بالطالب *{1}*: - *الشهر المستهدف*: {2} {3} - *المبلغ*: {4} درهم - *حالة الدفع*: {5} - *تاريخ الأداء*: {6} - *رقم الإيصال*: {7} - *طريقة الدفع*: {8} {9} شاكرين لكم حسن تعاونكم الدائم مع {10}.": "message WhatsApp envoyé au parent (non affiché)",
  "- *ملاحظة*: {0}": "fragment du message WhatsApp (non affiché)",
  "السلام عليكم ورحمة الله وبركاته، المحترم(ة) {0}، ولي أمر الطالب(ة) *{1}*، نرسل لكم تقرير الحضور والغياب الشهري الخاص بابنكم(بنتكم) لشهر *{2} {3}*: 📊 *إحصائيات الشهر (باستثناء عطلة الجمعة):* - عدد أيام الحضور الفعلي: *{4}* أيام - عدد مرات التأخير: *{5}* مرات - عدد أيام الغياب: *{6}* أيام - مجموع الحصص المقررة: *{7}* حصة - نسبة الالتزام الإجمالية: *{8}%* 💡 *ملاحظة:* لا يتم احتساب أيام الجمعة في الكشف لكونها عطلة نهاية الأسبوع الرسمية بالجمعية. شاكرين لكم حسن تعاونكم وحرصكم على التزام ابنكم ومتابعته المستمرة في حفظ كتاب الله. *{9}*": "message WhatsApp envoyé au parent (non affiché)",
  "السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) {0} المحترم(ة)... {1}.": "message WhatsApp envoyé au parent (non affiché)",
};
