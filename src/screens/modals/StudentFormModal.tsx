/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Student, Class, TajweedLevel } from "../../types";
import { Check, X, Phone, Archive } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function StudentFormModal() {
  const {
    classes,
    setShowStudentModal,
    editingStudent,
    formFullName,
    setFormFullName,
    formPhoto,
    setFormPhoto,
    formBirthDate,
    setFormBirthDate,
    formRegistrationDate,
    setFormRegistrationDate,
    formGender,
    setFormGender,
    formParentName,
    setFormParentName,
    formParentPhone,
    setFormParentPhone,
    formParentEmail,
    setFormParentEmail,
    formDocParentId,
    setFormDocParentId,
    formDocBirthCert,
    setFormDocBirthCert,
    formDocPhotos,
    setFormDocPhotos,
    formHizbCount,
    setFormHizbCount,
    formCurrentSurah,
    setFormCurrentSurah,
    formTajweedLevel,
    setFormTajweedLevel,
    formNotes,
    setFormNotes,
    formClassId,
    setFormClassId,
    formIsArchived,
    setFormIsArchived,
    studentDragActive,
    handleStudentPhotoUpload,
    handleStudentDrag,
    handleStudentDrop,
    handleSaveStudent,
  } = useApp();

  return (
    <div data-modal="student-form" className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 bg-primary-800 text-white flex justify-between items-center">
          <h3 className="font-bold text-base">{editingStudent ? "تعديل ملف الطالب" : "تسجيل طالب جديد في النادي"}</h3>
          <button 
            onClick={() => setShowStudentModal(false)} 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">

          {/* Student Photo Editor Section */}
          <div className="bg-sand-50 p-4 rounded-xl border border-sand-200 space-y-3">
            <p className="block font-bold text-sand-700">تعديل/تحديد صورة الطالب الشخصية:</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Current Preview */}
              <div className="relative w-16 h-16 rounded-full border-2 border-primary-600 overflow-hidden shrink-0 bg-sand-100 flex items-center justify-center shadow-inner">
                {formPhoto ? (
                  <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🧒</span>
                )}
                {formPhoto && (
                  <button
                    type="button"
                    onClick={() => setFormPhoto("")}
                    className="absolute -top-1 -right-1 bg-danger-600 text-white rounded-full p-0.5 hover:bg-danger-700 shadow"
                    title="إزالة الصورة"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Upload / Select options */}
              <div className="flex-1 w-full space-y-2">
                {/* Drag-and-drop / File Selector */}
                <div
                  onDragEnter={handleStudentDrag}
                  onDragOver={handleStudentDrag}
                  onDragLeave={handleStudentDrag}
                  onDrop={handleStudentDrop}
                  className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                    studentDragActive ? "border-primary-600 bg-primary-50" : "border-sand-300 hover:border-sand-400 bg-white"
                  }`}
                >
                  <input
                    type="file"
                    id="student-photo-upload"
                    accept="image/*"
                    onChange={handleStudentPhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="student-photo-upload" className="cursor-pointer block">
                    <p className="font-bold text-sand-700 text-xs">اسحب صورة هنا أو انقر لاختيارها</p>
                    <p className="text-[10px] text-sand-500 mt-0.5">JPG, PNG (الحد الأقصى 2 ميغابايت)</p>
                  </label>
                </div>

                {/* Direct URL input */}
                <div className="space-y-1">
                  <input
                    type="url"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    placeholder="أو ألصق رابط صورة مباشر هنا (URL)..."
                    className="w-full p-2 border border-sand-300 rounded-lg text-[10px] font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Preset Avatars Selection */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sand-500">أو اختر من الرمزيات المسبقة للأطفال بالنادي:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { name: "طالب 1", url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150" },
                  { name: "طالب 2", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150" },
                  { name: "طالب 3", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
                  { name: "طالبة 1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
                  { name: "طالبة 2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
                  { name: "طالبة 3", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150" }
                ].map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setFormPhoto(preset.url)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition hover:scale-105 shrink-0 relative ${
                      formPhoto === preset.url ? "border-primary-600 scale-105 shadow-md" : "border-sand-200"
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {formPhoto === preset.url && (
                      <div className="absolute inset-0 bg-primary-950/40 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Full name */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">الإسم الكامل للطالب:</label>
              <input
                type="text"
                required
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="مثال: يوسف الإدريسي"
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              />
            </div>

            {/* Birthdate */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">تاريخ ازدياد الطالب:</label>
              <input
                type="date"
                required
                value={formBirthDate}
                onChange={(e) => setFormBirthDate(e.target.value)}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Registration Date */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">تاريخ التسجيل بالنادي:</label>
              <input
                type="date"
                required
                value={formRegistrationDate}
                onChange={(e) => setFormRegistrationDate(e.target.value)}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">الجنس:</label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as "ذكر" | "أنثى")}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              >
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>

            {/* Parent name */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">إسم الكامل لولي الأمر:</label>
              <input
                type="text"
                required
                value={formParentName}
                onChange={(e) => setFormParentName(e.target.value)}
                placeholder="مثال: محمد الإدريسي"
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              />
            </div>

            {/* Parent Phone */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">رقم هاتف ولي الأمر (للتواصل السريع والواتساب):</label>
              <input
                type="tel"
                required
                value={formParentPhone}
                onChange={(e) => setFormParentPhone(e.target.value)}
                placeholder="مثال: 0612345678"
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Parent Email */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">البريد الإلكتروني لولي الأمر:</label>
              <input
                type="email"
                value={formParentEmail}
                onChange={(e) => setFormParentEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Assigned Class */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">تعيين الفصل الدراسي / الحلقة:</label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quran Progress & Tajweed */}
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">عدد الأحزاب المحفوظة (من 1 إلى 60):</label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={formHizbCount}
                onChange={(e) => setFormHizbCount(Number(e.target.value))}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-sand-700">مستوى التجويد الحالي:</label>
              <select
                value={formTajweedLevel}
                onChange={(e) => setFormTajweedLevel(e.target.value as TajweedLevel)}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              >
                <option value="ممتاز">ممتاز</option>
                <option value="متوسط">متوسط</option>
                <option value="ضعيف">ضعيف</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block font-bold text-sand-700">السورة أو ربع الحزب الحالي:</label>
              <input
                type="text"
                value={formCurrentSurah}
                onChange={(e) => setFormCurrentSurah(e.target.value)}
                placeholder="مثال: سورة الملك ربع الأخير"
                className="w-full p-2 border border-sand-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Checklist for Administrative Documents */}
          <div className="border-t pt-3">
            <p className="font-bold text-sand-700 mb-2 text-xs">الأوراق والمستندات الإدارية المتوفرة:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 bg-sand-50 rounded-xl cursor-pointer hover:bg-sand-100 transition border border-sand-200">
                <input
                  type="checkbox"
                  checked={formDocParentId}
                  onChange={(e) => setFormDocParentId(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span>فوتوكوبي بطاقة ولي الأمر</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-sand-50 rounded-xl cursor-pointer hover:bg-sand-100 transition border border-sand-200">
                <input
                  type="checkbox"
                  checked={formDocBirthCert}
                  onChange={(e) => setFormDocBirthCert(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span>عقد ازدياد الطالب</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-sand-50 rounded-xl cursor-pointer hover:bg-sand-100 transition border border-sand-200">
                <input
                  type="checkbox"
                  checked={formDocPhotos}
                  onChange={(e) => setFormDocPhotos(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span>صورتان شمسيتان للطالب</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block font-bold text-sand-700">ملاحظات توجيهية إضافية:</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="مستوى الذكاء، سرعة الحفظ، الالتزام بالآداب الإسلامية..."
              className="w-full p-2.5 border border-sand-300 rounded-lg text-xs h-20 resize-none"
            />
          </div>

          {/* Archive Student option */}
          <div className="bg-sand-50 p-4 rounded-xl border border-sand-200 space-y-2">
            <p className="block font-bold text-sand-700">حالة الطالب بالنادي (نشط / مؤرشف):</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsArchived}
                onChange={(e) => setFormIsArchived(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="font-medium text-sand-700">أرشفة هذا الطالب (تغيير حالته إلى غير نشط)</span>
            </label>
            <p className="text-[10px] text-sand-500">الطالب مؤرشف لن يظهر في القائمة الافتراضية للطلاب النشطين، ولن يطالب بسداد الرسوم الجديدة.</p>
          </div>

          <div className="border-t pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowStudentModal(false)}
              className="px-4 py-2 bg-sand-100 hover:bg-sand-200 rounded-xl text-sand-700 font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl transition shadow-md"
            >
              {editingStudent ? "حفظ التعديلات" : "إتمام التسجيل والبدء"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
