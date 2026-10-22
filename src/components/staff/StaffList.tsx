/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Edit2, Archive, Mail, Phone, Trash2, MessageCircle, AlertCircle, Printer, Sparkles, Clock, DollarSign } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG } from "./shared";
import { useStaff } from "./StaffContext";

export default function StaffList() {
  const {
    classes,
    viewMode,
    canUpdate,
    canDelete,
    handleOpenForm,
    filteredTeachers,
    openBadgeModal,
    handleStaffDelete,
    handleStaffArchive,
  } = useStaff();

  return (
    <>
      {/* Staff Grid or Table View */}
      {filteredTeachers.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((staff) => {
              const cat = staff.category || "أستاذ / محفظ";
              const catCfg = STAFF_CATEGORIES_CONFIG[cat] || STAFF_CATEGORIES_CONFIG["أستاذ / محفظ"];
              const assignedClasses = classes.filter(c => c.teacherId === staff.id);

              return (
                <div
                  key={staff.id}
                  className={`bg-surface rounded-2xl border ${
                    staff.isArchived 
                      ? "border-gold-200 bg-gold-50/10" 
                      : "border-line hover:border-line-strong"
                  } p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200`}
                >
                  {/* Category Tag Header */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className={`inline-flex items-center gap-1 text-[12.5px] font-bold px-2.5 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}>
                      <span>{catCfg.icon}</span>
                      <span>{staff.category || "أستاذ / محفظ"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {staff.isFromSettings && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-md" title="مربوط ديناميكياً من وثيقة الإعدادات العامة">
                          <Sparkles className="w-3 h-3 text-primary-600 shrink-0" />
                          <span>مربوط بالإعدادات</span>
                        </span>
                      )}

                      {staff.contractType && !staff.isFromSettings && (
                        <span className="text-[11.5px] font-bold text-ink-3 bg-sand-100 px-2 py-0.5 rounded-md">
                          {staff.contractType}
                        </span>
                      )}

                      {staff.isArchived && (
                        <span className="bg-gold-600 text-white text-[12.5px] font-bold px-2 py-0.5 rounded-md">
                          مؤرشف
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Top Block with Photo & Name */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-line bg-sand-100 flex items-center justify-center">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{catCfg.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary text-sm truncate" title={staff.fullName}>
                          {staff.fullName}
                        </h3>
                        <p className="text-[13px] font-semibold text-ink-2 mt-0.5 truncate">
                          {staff.roleTitle || staff.specialty}
                        </p>
                        {staff.cinNumber && (
                          <p className="text-[11.5px] text-ink-3 font-mono mt-0.5">
                            CIN: <span className="font-bold text-ink-2">{staff.cinNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info & Direct Actions */}
                    <div className="bg-sand-50 p-3 rounded-xl border border-line-soft text-[13px] space-y-2">
                      <div className="flex items-center justify-between text-ink-2">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-ink-3" />
                          <span>الهاتف:</span>
                        </span>
                        <a
                          href={`tel:${staff.phone}`}
                          className="font-mono font-bold text-ink hover:text-primary-700 hover:underline"
                        >
                          {staff.phone}
                        </a>
                      </div>

                      {staff.whatsapp && (
                        <div className="flex items-center justify-between text-ink-2">
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-primary-500" />
                            <span>الواتساب:</span>
                          </span>
                          <a
                            href={`https://wa.me/${staff.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-primary-700 hover:underline flex items-center gap-1"
                          >
                            <span>{staff.whatsapp}</span>
                          </a>
                        </div>
                      )}

                      {staff.email && (
                        <div className="flex items-center justify-between text-ink-2">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-ink-3" />
                            <span>البريد:</span>
                          </span>
                          <a
                            href={`mailto:${staff.email}`}
                            className="font-mono truncate max-w-[140px] text-ink-2 hover:underline"
                            title={staff.email}
                          >
                            {staff.email}
                          </a>
                        </div>
                      )}

                      {staff.workSchedule && (
                        <div className="flex items-center justify-between text-ink-2 pt-1 border-t border-sand-200/60">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-ink-3" />
                            <span>أوقات العمل:</span>
                          </span>
                          <span className="text-[12.5px] font-semibold text-ink-2 truncate max-w-[160px]" title={staff.workSchedule}>
                            {staff.workSchedule}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Classes (Teachers) or Assigned Areas (Cleaners / Staff) */}
                    {cat === "أستاذ / محفظ" ? (
                      <div className="space-y-1 text-[13px]">
                        <span className="block font-bold text-ink-3">الفصول والحلقات المسندة:</span>
                        {assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.map(c => (
                              <span key={c.id} className="bg-primary-50 text-primary-800 text-[11.5px] px-2 py-0.5 rounded-lg font-bold border border-primary-100">
                                🏫 {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gold-600 italic text-[12.5px] bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-100/20 inline-block">
                            ⚠️ لا توجد حلقة مسندة حالياً
                          </span>
                        )}
                      </div>
                    ) : staff.assignedAreas ? (
                      <div className="space-y-1 text-[13px]">
                        <span className="block font-bold text-ink-3">المرافق والمهام المكلف بها:</span>
                        <div className="bg-sand-50 p-2 rounded-lg border border-line-soft text-[12.5px] text-ink-2 font-medium">
                          📍 {staff.assignedAreas}
                        </div>
                      </div>
                    ) : null}

                    {/* Duties Summary if present */}
                    {staff.duties && (
                      <div className="space-y-1 text-[13px]">
                        <span className="block font-bold text-ink-3">المهام والمسؤوليات:</span>
                        <p className="text-[12.5px] text-ink-2 bg-sand-50/70 p-2 rounded-lg border border-line-soft line-clamp-2 leading-relaxed">
                          {staff.duties}
                        </p>
                      </div>
                    )}

                    {/* Monthly Salary / Stipend Tag */}
                    {(staff.monthlySalary !== undefined && staff.monthlySalary > 0) && (
                      <div className="flex items-center justify-between text-[13px] bg-primary-50/40 p-2 rounded-lg border border-primary-100/60">
                        <span className="font-bold text-ink-2 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                          المكافأة / الراتب الشهري:
                        </span>
                        <span className="font-bold text-primary-800 font-mono">
                          {staff.monthlySalary.toLocaleString()} د.م
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="border-t pt-3 mt-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {/* Print Badge Button */}
                      <button
                        onClick={() => openBadgeModal(staff)}
                        className="flex-1 py-1.5 bg-sand-100 hover:bg-sand-200 text-ink-2 text-[12.5px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-line"
                        title="طباعة بطاقة العمل أو شارة الصدر"
                      >
                        <Printer className="w-3.5 h-3.5 text-ink-2" />
                        <span>شارة العمل</span>
                      </button>

                      {canUpdate && (
                        <button
                          onClick={() => handleOpenForm(staff)}
                          className="flex-1 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-800 text-[12.5px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-primary-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canUpdate && (
                        <button
                          onClick={() => handleStaffArchive(staff)}
                          className={`flex-1 py-1 text-[11.5px] font-bold rounded-lg transition flex items-center justify-center gap-1 border ${
                            staff.isArchived
                              ? "bg-primary-50 hover:bg-primary-100 text-primary-800 border-primary-200"
                              : "bg-gold-50 hover:bg-gold-100 text-gold-800 border-gold-200"
                          }`}
                        >
                          <Archive className="w-3 h-3" />
                          <span>{staff.isArchived ? "إلغاء الأرشفة" : "أرشفة"}</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleStaffDelete(staff)}
                          className="p-1 hover:bg-danger-50 text-danger-600 rounded-lg transition border border-transparent hover:border-danger-200"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Roster View */
          <div className="bg-surface rounded-2xl border border-line overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-sand-50 border-b border-line text-ink-2 font-bold">
                <tr>
                  <th className="p-3.5">الكادر / العامل</th>
                  <th className="p-3.5">الفئة والمسمى الوظيفي</th>
                  <th className="p-3.5">معلومات الاتصال</th>
                  <th className="p-3.5">نوع التعاقد</th>
                  <th className="p-3.5">المكافأة الشهرية</th>
                  <th className="p-3.5">المهام / الفصول</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-faint">
                {filteredTeachers.map((staff) => {
                  const cat = staff.category || "أستاذ / محفظ";
                  const catCfg = STAFF_CATEGORIES_CONFIG[cat] || STAFF_CATEGORIES_CONFIG["أستاذ / محفظ"];
                  const assignedClasses = classes.filter(c => c.teacherId === staff.id);

                  return (
                    <tr key={staff.id} className="hover:bg-sand-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-line bg-sand-100 flex items-center justify-center">
                            {staff.photo ? (
                              <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{catCfg.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-ink flex items-center gap-1.5">
                              <span>{staff.fullName}</span>
                              {staff.isFromSettings && (
                                <span className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.2 rounded" title="مربوط تلقائياً من الإعدادات">
                                  <Sparkles className="w-2.5 h-2.5 text-primary-600" />
                                  <span>إعدادات</span>
                                </span>
                              )}
                            </div>
                            {staff.cinNumber && (
                              <div className="text-[11.5px] text-ink-3 font-mono">CIN: {staff.cinNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[11.5px] font-bold px-2 py-0.5 rounded ${catCfg.bg} ${catCfg.text}`}>
                            {catCfg.icon} {staff.category || "أستاذ / محفظ"}
                          </span>
                          <div className="text-[13px] text-ink-2 font-semibold">{staff.roleTitle || staff.specialty}</div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 font-mono text-[12.5px]">
                          <div className="text-ink-2">{staff.phone}</div>
                          {staff.email && <div className="text-ink-3 text-[11.5px] truncate max-w-[120px]">{staff.email}</div>}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-ink-2 bg-sand-100 px-2 py-1 rounded text-[12.5px]">
                          {staff.contractType || "مكافأة شهرية"}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-primary-800 font-mono">
                        {staff.monthlySalary ? `${staff.monthlySalary.toLocaleString()} د.م` : "-"}
                      </td>

                      <td className="p-3.5">
                        {cat === "أستاذ / محفظ" ? (
                          assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedClasses.map(c => (
                                <span key={c.id} className="bg-primary-50 text-primary-800 text-[11.5px] px-1.5 py-0.5 rounded font-bold">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-ink-3 text-[11.5px]">غير مسند</span>
                          )
                        ) : (
                          <span className="text-ink-2 text-[12.5px] truncate block max-w-[150px]" title={staff.assignedAreas || staff.duties}>
                            {staff.assignedAreas || staff.duties || "-"}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openBadgeModal(staff)}
                            className="p-1.5 hover:bg-sand-100 text-ink-2 rounded-lg transition"
                            title="شارة العمل"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenForm(staff)}
                              className="p-1.5 hover:bg-primary-50 text-primary-700 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleStaffDelete(staff)}
                              className="p-1.5 hover:bg-danger-50 text-danger-600 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-surface rounded-2xl p-12 text-center border border-line space-y-3">
          <AlertCircle className="w-12 h-12 text-ink-3 mx-auto" />
          <h4 className="font-bold text-ink-2 text-sm">لا يوجد عاملون أو أطر مطابقون للبحث أو الفلتر المختار</h4>
          <p className="text-[13px] text-ink-3">تأكد من كتابة الاسم أو التخصص بشكل صحيح أو قم بتبديل الفئات أعلاه.</p>
        </div>
      )}
    </>
  );
}
