/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { MONTHS_AR } from "../../school/businessRules";
import { Building, Phone, Mail, MapPin, Trash2, DollarSign, ToggleLeft, ToggleRight, Save, Upload, Landmark, FileCheck, CreditCard, Award, Calendar, Tag, FileText, Plus } from "lucide-react";
import { useSettings } from "./SettingsContext";
import { LanguageSetting, Select } from "../../ui";
import ThemePicker from "./ThemePicker";

export default function GeneralSettingsSection() {
  const {
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
        <form onSubmit={handleSettingsSubmit} className="space-y-8 bg-surface p-6 sm:p-8 rounded-3xl border border-line">

          {/* 0. Thème de couleur de l'école (D84) */}
          <ThemePicker />

          {/* Langue de l'interface (D93) : préférence de l'appareil, pas un réglage de l'école. */}
          <LanguageSetting />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. Basic Association Info */}
            <div className="space-y-4 bg-sand-50/70 p-5 rounded-2xl border border-sand-200/80">
              <h3 className="text-sm font-bold text-primary border-b pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-primary-600" />
                <span>معلومات المؤسسة والاتصال الرئيسية</span>
              </h3>

              <div className="space-y-1">
                <label htmlFor="gs-associationName" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم الجمعية / المدرسة <span className="text-danger-500">*</span></label>
                <input
                  id="gs-associationName"
                  type="text"
                  required
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-general-supervisor-name" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المشرف العام <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={generalSupervisorName}
                  onChange={(e) => setGeneralSupervisorName(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  placeholder="مثال: د. عبد العالي العلمي"
                  id="input-general-supervisor-name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-directorName" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم مدير المدرسة المسؤول (المدير التنفيذي) <span className="text-danger-500">*</span></label>
                <input
                  id="gs-directorName"
                  type="text"
                  required
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  placeholder="مثال: الشيخ عبد الرحمن السلاوي"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="gs-associationPhone" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الهاتف <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><Phone className="w-4 h-4" /></span>
                    <input
                      id="gs-associationPhone"
                      type="text"
                      required
                      value={associationPhone}
                      onChange={(e) => setAssociationPhone(e.target.value)}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="gs-associationEmail" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">البريد الإلكتروني <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><Mail className="w-4 h-4" /></span>
                    <input
                      id="gs-associationEmail"
                      type="email"
                      required
                      value={associationEmail}
                      onChange={(e) => setAssociationEmail(e.target.value)}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10 font-mono text-left"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-associationAddress" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">العنوان الجغرافي المقر الرسمي <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-ink-3"><MapPin className="w-4 h-4" /></span>
                  <textarea
                    id="gs-associationAddress"
                    required
                    rows={2}
                    value={associationAddress}
                    onChange={(e) => setAssociationAddress(e.target.value)}
                    className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label htmlFor="logo-upload-input" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">شعار المؤسسة الرسمي</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-surface ${
                    isDragging
                      ? "border-primary-500 bg-primary-50/50 scale-[1.01]"
                      : "border-line-strong hover:bg-sand-50"
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
                      <div className="relative w-24 h-24 bg-white rounded-xl border border-line p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={associationLogo}
                          alt="Association Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <label
                          htmlFor="logo-upload-input"
                          className="bg-white hover:bg-sand-50 text-ink-2 border border-line-strong px-3 py-1.5 rounded-lg text-[13px] font-bold transition cursor-pointer"
                        >
                          تغيير الشعار
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="bg-danger-50 hover:bg-danger-100 text-danger-700 border border-danger-200 px-3 py-1.5 rounded-lg text-[13px] font-bold transition"
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
                      <div className="text-[13px]">
                        <span className="text-primary-700 font-bold">انقر لرفع الشعار</span> أو اسحب الملف وأفلته هنا
                      </div>
                      <p className="text-[11.5px] text-ink-3">تدعم صور PNG, JPG حتى 2 ميغابايت</p>
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
                  <label htmlFor="gs-foundingDate" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">سنة / تاريخ التأسيس</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><Calendar className="w-4 h-4" /></span>
                    <input
                      id="gs-foundingDate"
                      type="text"
                      value={foundingDate}
                      onChange={(e) => setFoundingDate(e.target.value)}
                      placeholder="مثال: 2018-05-15 أو 2018"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="gs-licenseNumber" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الترخيص / وصل الإيداع القانوني</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><FileCheck className="w-4 h-4" /></span>
                    <input
                      id="gs-licenseNumber"
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="مثال: وصل إيداع نهائي رقم 1422 / سلا"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-bankRIB" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الحساب البنكي للجمعية (RIB)</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-ink-3"><CreditCard className="w-4 h-4" /></span>
                  <input
                    id="gs-bankRIB"
                    type="text"
                    value={bankRIB}
                    onChange={(e) => setBankRIB(e.target.value)}
                    placeholder="مثال: 230 780 0001234567890123 45 (البنك)"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10 font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <p className="text-[11.5px] text-ink-3 pt-0.5">يُدرج الحساب البنكي في الفواتير والتقارير المالية والوصولات الرسمية.</p>
              </div>

              {/* General Financial Rules & Toggles included here for symmetry */}
              <div className="border-t border-gold-200/60 pt-3 space-y-3">
                <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                  <span>الرسوم المرجعية والتفضيلات</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="gs-subscriptionFee" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رسوم الاشتراك الشهري المرجعية</label>
                    <input
                      id="gs-subscriptionFee"
                      type="number"
                      required
                      value={subscriptionFee}
                      onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="gs-currency" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">العملة الرسمية</label>
                    <input
                      id="gs-currency"
                      type="text"
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="gs-openingYear" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">سنة الافتتاح الرسمي (بداية الفوترة)</label>
                    <input
                      id="gs-openingYear"
                      type="number"
                      value={openingYear}
                      onChange={(e) => setOpeningYear(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="مثال: 2026"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="gs-openingMonth" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">شهر الافتتاح الرسمي</label>
                    <Select
                      id="gs-openingMonth"
                      aria-label="شهر الافتتاح الرسمي"
                      value={openingMonth}
                      onChange={(v) => setOpeningMonth(v)}
                    >
                      <option value="">—</option>
                      {MONTHS_AR.map((m) => <option key={m} value={m}>{m}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5" role="group" aria-labelledby="gs-feeOverridesLabel">
                  <span id="gs-feeOverridesLabel" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تعريفات خاصة لبعض الأشهر (عروض وتخفيضات)</span>
                  {feeOverrides.map((o, i) => (
                    <div key={i} className="grid grid-cols-7 gap-2 items-center">
                      <input
                        type="number"
                        aria-label="السنة"
                        value={o.year}
                        onChange={(e) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, year: Number(e.target.value) } : x)))}
                        className="col-span-2 p-2 border border-line-strong rounded-xl text-[13px] bg-white font-bold"
                      />
                      <Select
                        value={o.month}
                        onChange={(v) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, month: v } : x)))}
                        aria-label="الشهر"
                        size="sm"
                        className="col-span-2"
                      >
                        {MONTHS_AR.map((m) => <option key={m} value={m}>{m}</option>)}
                      </Select>
                      <input
                        type="number"
                        aria-label="المبلغ (د.م)"
                        value={o.amount}
                        onChange={(e) => setFeeOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))}
                        className="col-span-2 p-2 border border-line-strong rounded-xl text-[13px] bg-white font-bold"
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
                    className="text-[11.5px] text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
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
                  <label htmlFor="gs-activeAcademicSeason" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الموسم الدراسي النشط <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><Tag className="w-4 h-4" /></span>
                    <input
                      id="gs-activeAcademicSeason"
                      type="text"
                      required
                      value={activeAcademicSeason}
                      onChange={(e) => setActiveAcademicSeason(e.target.value)}
                      placeholder="مثال: 2026/2027"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="gs-receiptPrefixFormat" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">صيغة ترقيم الوصولات</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3"><FileText className="w-4 h-4" /></span>
                    <input
                      id="gs-receiptPrefixFormat"
                      type="text"
                      value={receiptPrefixFormat}
                      onChange={(e) => setReceiptPrefixFormat(e.target.value)}
                      placeholder="مثال: REC-{YEAR}-{NO}"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-10 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-mottoVision" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الشعار اللفظي / الرؤية المؤسساتية</label>
                <input
                  id="gs-mottoVision"
                  type="text"
                  value={mottoVision}
                  onChange={(e) => setMottoVision(e.target.value)}
                  placeholder="مثال: نحو جيل قرآني متخلق بأخلاق القرآن..."
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-internalBylaws" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">شروط وأحكام القانون الداخلي (تدرج باستمارة التسجيل)</label>
                <textarea
                  id="gs-internalBylaws"
                  rows={3}
                  value={internalBylaws}
                  onChange={(e) => setInternalBylaws(e.target.value)}
                  placeholder="أدخل نصوص البنود الرئيسية للقانون الداخلي للمدرسة..."
                  className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="gs-footerNotice" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نص الترويسة السفلي (للوصلات والشهادات الرسمية)</label>
                <input
                  id="gs-footerNotice"
                  type="text"
                  value={footerNotice}
                  onChange={(e) => setFooterNotice(e.target.value)}
                  placeholder="أدخل النص الختامي السفلية للمطبوعات..."
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              {/* Stamp & Registration Toggles */}
              <div className="space-y-2 pt-2 border-t border-primary-200/60">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-primary-100">
                  <div>
                    <p className="text-[13px] font-bold text-ink">السماح بالتسجيل الذاتي للطلاب الجدد</p>
                    <p className="text-[11.5px] text-ink-3">تفعيل خيار التسجيل الإلكتروني عبر البوابات.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowSelfRegistration(!allowSelfRegistration)}
                    className="text-primary-600 hover:text-primary-700 transition"
                  >
                    {allowSelfRegistration ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-ink-3" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-primary-100">
                  <div>
                    <p className="text-[13px] font-bold text-ink">إظهار خاتم وتوقيع الإدارة على وصولات الدفع</p>
                    <p className="text-[11.5px] text-ink-3">تضمين التوقيع الرسمي تلقائياً عند طباعة الوصل.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStampOnReceipts(!showStampOnReceipts)}
                    className="text-primary-600 hover:text-primary-700 transition"
                  >
                    {showStampOnReceipts ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-ink-3" />
                    )}
                  </button>
                </div>

                {showStampOnReceipts && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label htmlFor="gs-stampText" className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نص الختم المعتمد</label>
                    <input
                      id="gs-stampText"
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      placeholder="مثال: إدارة مدرسة الفجر الجديد القرآنية - سلا"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-line">
            {canUpdate && (
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-2"
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
