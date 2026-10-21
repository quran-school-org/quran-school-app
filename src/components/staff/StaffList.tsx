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
                  className={`bg-white rounded-2xl shadow-xs border ${
                    staff.isArchived 
                      ? "border-amber-200 bg-amber-50/10" 
                      : "border-slate-200 hover:border-slate-300"
                  } p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200`}
                >
                  {/* Category Tag Header */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}>
                      <span>{catCfg.icon}</span>
                      <span>{staff.category || "أستاذ / محفظ"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {staff.isFromSettings && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs" title="مربوط ديناميكياً من وثيقة الإعدادات العامة">
                          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>مربوط بالإعدادات</span>
                        </span>
                      )}

                      {staff.contractType && !staff.isFromSettings && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {staff.contractType}
                        </span>
                      )}

                      {staff.isArchived && (
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          مؤرشف
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Top Block with Photo & Name */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{catCfg.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate" title={staff.fullName}>
                          {staff.fullName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
                          {staff.roleTitle || staff.specialty}
                        </p>
                        {staff.cinNumber && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            CIN: <span className="font-bold text-slate-600">{staff.cinNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info & Direct Actions */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>الهاتف:</span>
                        </span>
                        <a
                          href={`tel:${staff.phone}`}
                          className="font-mono font-bold text-slate-800 hover:text-emerald-700 hover:underline"
                        >
                          {staff.phone}
                        </a>
                      </div>

                      {staff.whatsapp && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>الواتساب:</span>
                          </span>
                          <a
                            href={`https://wa.me/${staff.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <span>{staff.whatsapp}</span>
                          </a>
                        </div>
                      )}

                      {staff.email && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>البريد:</span>
                          </span>
                          <a
                            href={`mailto:${staff.email}`}
                            className="font-mono truncate max-w-[140px] text-slate-700 hover:underline"
                            title={staff.email}
                          >
                            {staff.email}
                          </a>
                        </div>
                      )}

                      {staff.workSchedule && (
                        <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>أوقات العمل:</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[160px]" title={staff.workSchedule}>
                            {staff.workSchedule}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Classes (Teachers) or Assigned Areas (Cleaners / Staff) */}
                    {cat === "أستاذ / محفظ" ? (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">الفصول والحلقات المسندة:</span>
                        {assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.map(c => (
                              <span key={c.id} className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-bold border border-emerald-100">
                                🏫 {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-600 italic text-[11px] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/20 inline-block">
                            ⚠️ لا توجد حلقة مسندة حالياً
                          </span>
                        )}
                      </div>
                    ) : staff.assignedAreas ? (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">المرافق والمهام المكلف بها:</span>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-700 font-medium">
                          📍 {staff.assignedAreas}
                        </div>
                      </div>
                    ) : null}

                    {/* Duties Summary if present */}
                    {staff.duties && (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">المهام والمسؤوليات:</span>
                        <p className="text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                          {staff.duties}
                        </p>
                      </div>
                    )}

                    {/* Monthly Salary / Stipend Tag */}
                    {(staff.monthlySalary !== undefined && staff.monthlySalary > 0) && (
                      <div className="flex items-center justify-between text-xs bg-emerald-50/40 p-2 rounded-lg border border-emerald-100/60">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          المكافأة / الراتب الشهري:
                        </span>
                        <span className="font-bold text-emerald-800 font-mono">
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
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-slate-200"
                        title="طباعة بطاقة العمل أو شارة الصدر"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>شارة العمل</span>
                      </button>

                      {canUpdate && (
                        <button
                          onClick={() => handleOpenForm(staff)}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-emerald-200"
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
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 border ${
                            staff.isArchived
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          <Archive className="w-3 h-3" />
                          <span>{staff.isArchived ? "إلغاء الأرشفة" : "أرشفة"}</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleStaffDelete(staff)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition border border-transparent hover:border-rose-200"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
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
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((staff) => {
                  const cat = staff.category || "أستاذ / محفظ";
                  const catCfg = STAFF_CATEGORIES_CONFIG[cat] || STAFF_CATEGORIES_CONFIG["أستاذ / محفظ"];
                  const assignedClasses = classes.filter(c => c.teacherId === staff.id);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                            {staff.photo ? (
                              <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{catCfg.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{staff.fullName}</span>
                              {staff.isFromSettings && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded" title="مربوط تلقائياً من الإعدادات">
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>إعدادات</span>
                                </span>
                              )}
                            </div>
                            {staff.cinNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">CIN: {staff.cinNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${catCfg.bg} ${catCfg.text}`}>
                            {catCfg.icon} {staff.category || "أستاذ / محفظ"}
                          </span>
                          <div className="text-xs text-slate-700 font-semibold">{staff.roleTitle || staff.specialty}</div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="text-slate-700">{staff.phone}</div>
                          {staff.email && <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{staff.email}</div>}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {staff.contractType || "مكافأة شهرية"}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-emerald-800 font-mono">
                        {staff.monthlySalary ? `${staff.monthlySalary.toLocaleString()} د.م` : "-"}
                      </td>

                      <td className="p-3.5">
                        {cat === "أستاذ / محفظ" ? (
                          assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedClasses.map(c => (
                                <span key={c.id} className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">غير مسند</span>
                          )
                        ) : (
                          <span className="text-slate-600 text-[11px] truncate block max-w-[150px]" title={staff.assignedAreas || staff.duties}>
                            {staff.assignedAreas || staff.duties || "-"}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openBadgeModal(staff)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                            title="شارة العمل"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenForm(staff)}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleStaffDelete(staff)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
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
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">لا يوجد عاملون أو أطر مطابقون للبحث أو الفلتر المختار</h4>
          <p className="text-xs text-slate-400">تأكد من كتابة الاسم أو التخصص بشكل صحيح أو قم بتبديل الفئات أعلاه.</p>
        </div>
      )}
    </>
  );
}
