/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { MONTHS_AR } from "../../school/businessRules";
import { Building, Phone, Mail, MapPin, Trash2, DollarSign, ToggleLeft, ToggleRight, Save, Upload, Landmark, FileCheck, CreditCard, Award, Calendar, Tag, Info, FileText, Plus } from "lucide-react";
import { useSettings } from "./SettingsContext";

export default function GeneralSettingsSection() {
  const {
    settings,
    canUpdate,
    subTab,
    associationName,
    setAssociationName,
    generalSupervisorName,
    setGeneralSupervisorName,
    associationPhone,
    setAssociationPhone,
    associationEmail,
    setAssociationEmail,
    associationAddress,
    setAssociationAddress,
    associationLogo,
    directorName,
    setDirectorName,
    subscriptionFee,
    setSubscriptionFee,
    currency,
    setCurrency,
    openingYear,
    setOpeningYear,
    openingMonth,
    setOpeningMonth,
    feeOverrides,
    setFeeOverrides,
    allowSelfRegistration,
    setAllowSelfRegistration,
    showStampOnReceipts,
    setShowStampOnReceipts,
    stampText,
    setStampText,
    foundingDate,
    setFoundingDate,
    licenseNumber,
    setLicenseNumber,
    bankRIB,
    setBankRIB,
    activeAcademicSeason,
    setActiveAcademicSeason,
    mottoVision,
    setMottoVision,
    receiptPrefixFormat,
    setReceiptPrefixFormat,
    internalBylaws,
    setInternalBylaws,
    footerNotice,
    setFooterNotice,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLogoChange,
    handleRemoveLogo,
    handleSettingsSubmit,
  } = useSettings();

  return (
    <>
      {/* 1. General Association Settings */}
      {subTab === "general" && (
        <form onSubmit={handleSettingsSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-sand-200 shadow-sm">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. Basic Association Info */}
            <div className="space-y-4 bg-sand-50/70 p-5 rounded-2xl border border-sand-200/80">
              <h3 className="text-sm font-bold text-sand-800 border-b pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-primary-600" />
                <span>معلومات المؤسسة والاتصال الرئيسية</span>
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">اسم الجمعية / المدرسة <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value)}
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">اسم المشرف العام <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={generalSupervisorName}
                  onChange={(e) => setGeneralSupervisorName(e.target.value)}
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold text-sand-800"
                  placeholder="مثال: د. عبد العالي العلمي"
                  id="input-general-supervisor-name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">اسم مدير المدرسة المسؤول (المدير التنفيذي) <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold"
                  placeholder="مثال: الشيخ عبد الرحمن السلاوي"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">رقم الهاتف <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><Phone className="w-4 h-4" /></span>
                    <input
                      type="text"
                      required
                      value={associationPhone}
                      onChange={(e) => setAssociationPhone(e.target.value)}
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">البريد الإلكتروني <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      required
                      value={associationEmail}
                      onChange={(e) => setAssociationEmail(e.target.value)}
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none font-mono text-left bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">العنوان الجغرافي المقر الرسمي <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-sand-500"><MapPin className="w-4 h-4" /></span>
                  <textarea
                    required
                    rows={2}
                    value={associationAddress}
                    onChange={(e) => setAssociationAddress(e.target.value)}
                    className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-sand-700">شعار المؤسسة الرسمي</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-white ${
                    isDragging
                      ? "border-primary-500 bg-primary-50/50 scale-[1.01]"
                      : "border-sand-300 hover:bg-sand-50"
                  }`}
                >
                  <input
                    type="file"
                    id="logo-upload-input"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />

                  {associationLogo ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-24 h-24 bg-white rounded-xl border border-sand-200 p-2 shadow-sm flex items-center justify-center overflow-hidden">
                        <img
                          src={associationLogo}
                          alt="Association Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <label
                          htmlFor="logo-upload-input"
                          className="bg-white hover:bg-sand-50 text-sand-700 border border-sand-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          تغيير الشعار
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="bg-danger-50 hover:bg-danger-100 text-danger-700 border border-danger-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          حذف الشعار
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload-input" className="cursor-pointer flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="text-primary-700 font-bold">انقر لرفع الشعار</span> أو اسحب الملف وأفلته هنا
                      </div>
                      <p className="text-[10px] text-sand-500">تدعم صور PNG, JPG حتى 2 ميغابايت</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Legal & Founding Info */}
            <div className="space-y-4 bg-gold-50/50 p-5 rounded-2xl border border-gold-200/80">
              <h3 className="text-sm font-bold text-gold-950 border-b border-gold-200 pb-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-gold-700" />
                <span>البيانات القانونية والتأسيسية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">سنة / تاريخ التأسيس</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><Calendar className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={foundingDate}
                      onChange={(e) => setFoundingDate(e.target.value)}
                      placeholder="مثال: 2018-05-15 أو 2018"
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">رقم الترخيص / وصل الإيداع القانوني</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><FileCheck className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="مثال: وصل إيداع نهائي رقم 1422 / سلا"
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">الحساب البنكي للجمعية (RIB)</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-sand-500"><CreditCard className="w-4 h-4" /></span>
                  <input
                    type="text"
                    value={bankRIB}
                    onChange={(e) => setBankRIB(e.target.value)}
                    placeholder="مثال: 230 780 0001234567890123 45 (البنك)"
                    className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-sand-500 pt-0.5">يُدرج الحساب البنكي في الفواتير والتقارير المالية والوصولات الرسمية.</p>
              </div>

              {/* General Financial Rules & Toggles included here for symmetry */}
              <div className="border-t border-gold-200/60 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-sand-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                  <span>الرسوم المرجعية والتفضيلات</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-sand-700">رسوم الاشتراك الشهري المرجعية</label>
                    <input
                      type="number"
                      required
                      value={subscriptionFee}
                      onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                      className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-sand-700">العملة الرسمية</label>
                    <input
                      type="text"
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-sand-700">سنة الافتتاح الرسمي (بداية الفوترة)</label>
                    <input
                      type="number"
                      value={openingYear}
                      onChange={(e) => setOpeningYear(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="مثال: 2026"
                      className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-sand-700">شهر الافتتاح الرسمي</label>
                    <select
                      value={openingMonth}
                      onChange={(e) => setOpeningMonth(e.target.value)}
                      className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold"
                    >
                      <option value="">—</option>
                      {MONTHS_AR.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-sand-700">تعريفات خاصة لبعض الأشهر (عروض وتخفيضات)</label>
                  {feeOverrides.map((o, i) => (
                    <div key={i} className="grid grid-cols-7 gap-2 items-center">
                      <input
                        type="number"
                        value={o.year}
                        onChange={(e) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, year: Number(e.target.value) } : x)))}
                        className="col-span-2 p-2 border border-sand-300 rounded-xl text-xs bg-white font-bold"
                      />
                      <select
                        value={o.month}
                        onChange={(e) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, month: e.target.value } : x)))}
                        className="col-span-2 p-2 border border-sand-300 rounded-xl text-xs bg-white font-bold"
                      >
                        {MONTHS_AR.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input
                        type="number"
                        value={o.amount}
                        onChange={(e) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))}
                        className="col-span-2 p-2 border border-sand-300 rounded-xl text-xs bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setFeeOverrides((prev) => prev.filter((_, j) => j !== i))}
                        className="p-2 text-danger-600 hover:bg-danger-50 border border-danger-200/60 rounded-xl transition cursor-pointer flex items-center justify-center"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFeeOverrides((prev) => [...prev, { year: new Date().getFullYear(), month: MONTHS_AR[new Date().getMonth()], amount: Number(subscriptionFee) || 0 }])}
                    className="text-[10px] text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة تعريفة خاصة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Systems & Professional Publications Settings */}
            <div className="space-y-4 bg-primary-50/50 p-5 rounded-2xl border border-primary-200/80">
              <h3 className="text-sm font-bold text-primary-950 border-b border-primary-200 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-700" />
                <span>إعدادات النّظم والمطبوعات الاحترافية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">الموسم الدراسي النشط <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><Tag className="w-4 h-4" /></span>
                    <input
                      type="text"
                      required
                      value={activeAcademicSeason}
                      onChange={(e) => setActiveAcademicSeason(e.target.value)}
                      placeholder="مثال: 2026/2027"
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-bold text-primary-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-sand-700">صيغة ترقيم الوصولات</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-sand-500"><FileText className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={receiptPrefixFormat}
                      onChange={(e) => setReceiptPrefixFormat(e.target.value)}
                      placeholder="مثال: REC-{YEAR}-{NO}"
                      className="w-full pr-10 p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">الشعار اللفظي / الرؤية المؤسساتية</label>
                <input
                  type="text"
                  value={mottoVision}
                  onChange={(e) => setMottoVision(e.target.value)}
                  placeholder="مثال: نحو جيل قرآني متخلق بأخلاق القرآن..."
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white font-medium italic text-sand-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">شروط وأحكام القانون الداخلي (تدرج باستمارة التسجيل)</label>
                <textarea
                  rows={3}
                  value={internalBylaws}
                  onChange={(e) => setInternalBylaws(e.target.value)}
                  placeholder="أدخل نصوص البنود الرئيسية للقانون الداخلي للمدرسة..."
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-sand-700">نص الترويسة السفلي (للوصلات والشهادات الرسمية)</label>
                <input
                  type="text"
                  value={footerNotice}
                  onChange={(e) => setFooterNotice(e.target.value)}
                  placeholder="أدخل النص الختامي السفلية للمطبوعات..."
                  className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white text-sand-600 text-[11px]"
                />
              </div>

              {/* Stamp & Registration Toggles */}
              <div className="space-y-2 pt-2 border-t border-primary-200/60">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-primary-100">
                  <div>
                    <p className="text-xs font-bold text-sand-800">السماح بالتسجيل الذاتي للطلاب الجدد</p>
                    <p className="text-[10px] text-sand-500">تفعيل خيار التسجيل الإلكتروني عبر البوابات.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowSelfRegistration(!allowSelfRegistration)}
                    className="text-primary-600 hover:text-primary-700 transition"
                  >
                    {allowSelfRegistration ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-sand-500" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-primary-100">
                  <div>
                    <p className="text-xs font-bold text-sand-800">إظهار خاتم وتوقيع الإدارة على وصولات الدفع</p>
                    <p className="text-[10px] text-sand-500">تضمين التوقيع الرسمي تلقائياً عند طباعة الوصل.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStampOnReceipts(!showStampOnReceipts)}
                    className="text-primary-600 hover:text-primary-700 transition"
                  >
                    {showStampOnReceipts ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-sand-500" />
                    )}
                  </button>
                </div>

                {showStampOnReceipts && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label className="block text-xs font-bold text-sand-700">نص الختم المعتمد</label>
                    <input
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      placeholder="مثال: إدارة مدرسة الفجر الجديد القرآنية - سلا"
                      className="w-full p-2.5 border border-sand-300 rounded-xl text-xs focus:border-primary-600 focus:outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-sand-200">
            {canUpdate && (
              <button
                type="submit"
                className="bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs px-8 py-3.5 rounded-2xl flex items-center gap-2 transition shadow-lg hover:shadow-primary-900/20 active:scale-95 cursor-pointer"
                id="btn-save-general-settings"
              >
                <Save className="w-4 h-4" />
                <span>حفظ جميع إعدادات المؤسسة والمطبوعات</span>
              </button>
            )}
          </div>
        </form>
      )}
    </>
  );
}
