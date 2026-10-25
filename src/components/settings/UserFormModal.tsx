/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { UserRole, getDefaultPermissionsForRole } from "../../types";
import { MIN_NEW_PASSWORD_LENGTH } from "../../security/accounts";
import { PermissionMatrixEditor } from "../PermissionMatrixEditor";
import { Lock, X, AlertTriangle, Sparkles, Eye, EyeOff, KeyRound } from "lucide-react";
import { isPrimaryDirector } from "./shared";
import { useSettings } from "./SettingsContext";
import { Select } from "../../ui";

export default function UserFormModal() {
  const {
    teachers,
    students,
    onResetUserPassword,
    showFormPassword,
    setShowFormPassword,
    userFormSaving,
    formAttachExisting,
    setFormAttachExisting,
    handleResetPassword,
    showUserModal,
    setShowUserModal,
    editingUser,
    formUsername,
    setFormUsername,
    formFullName,
    formPassword,
    setFormPassword,
    formLinkedTeacherId,
    setFormLinkedTeacherId,
    formLinkedStudentIds,
    setFormLinkedStudentIds,
    linkedStudentSearch,
    setLinkedStudentSearch,
    formRole,
    setFormRole,
    formIsActive,
    setFormIsActive,
    setFormCanEditStudents,
    setFormCanEditTeachers,
    setFormCanEditGrades,
    setFormCanEditPayments,
    setFormTeacherTakeAttendance,
    setFormTeacherRecordGrades,
    setFormTeacherWriteBehaviorReports,
    setFormTeacherEditOwnStudents,
    setFormTeacherSendAlertsToParents,
    setFormParentViewOwnStats,
    setFormParentViewOwnAttendance,
    setFormParentViewCertificates,
    setFormParentViewOwnPayments,
    setFormParentUpdateContactInfo,
    setFormParentRegisterInActivities,
    formPermissions,
    setFormPermissions,
    handleFullNameChange,
    handleAutoGenerateUsername,
    handleUserSubmit,
  } = useSettings();

  return (
    <>
      {/* App User Modals */}
      {showUserModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn bg-night/55 backdrop-blur-[2px]" id="app-user-form-modal" style={{ direction: "rtl" }}>
          <div className="bg-surface border border-line w-full max-w-4xl lg:max-w-5xl overflow-hidden my-6 animate-scaleIn max-h-[92vh] flex flex-col rounded-3xl shadow-pop">
            <div className="bg-night p-6 text-night-text flex justify-between items-center shrink-0 border-b border-night-line">
              <div>
                <h3 className="font-bold text-base">{editingUser ? "تعديل حساب المستخدم" : "إضافة حساب مستخدم جديد"}</h3>
                <p className="text-[11.5px] text-primary-200 mt-1">قم بملء البيانات وتخصيص مستويات الوصول بكل دقة.</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الاسم الكامل <span className="text-danger-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="مثال: ذ. مصطفى العلوي"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المستخدم (Username) <span className="text-danger-500">*</span></label>
                    {!editingUser && (
                      <button
                        type="button"
                        onClick={handleAutoGenerateUsername}
                        className="text-[11.5px] text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                        title="توليد اسم مستخدم فريد تلقائياً بناءً على الاسم الكامل"
                      >
                        <Sparkles className="w-3 h-3 text-gold-500" />
                        <span>توليد تلقائي</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="mustafa_alawi"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono text-left"
                  />
                  <p className="text-[11.5px] text-ink-3">{editingUser ? "اسم المستخدم هو معرّف الدخول ولا يمكن تغييره بعد إنشاء الحساب." : "يتم توليده تلقائياً بشكل فريد من الاسم الكامل لمنع التشابه."}</p>
                </div>

                {!editingUser ? (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11.5px] text-ink-2 font-bold cursor-pointer mb-1">
                    <input type="checkbox" checked={formAttachExisting} onChange={(e) => setFormAttachExisting(e.target.checked)} />
                    <span>إضافة حساب موجود في مدرسة أخرى (نفس اسم المستخدم)</span>
                  </label>
                  {!formAttachExisting && (<>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">كلمة المرور المؤقتة <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-ink-3 pointer-events-none"><Lock className="w-3.5 h-3.5" /></span>
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required={!formAttachExisting}
                      minLength={MIN_NEW_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-9 font-mono text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute left-2.5 top-2.5 p-1 text-ink-3 hover:text-primary-700 hover:bg-sand-100 rounded-lg transition cursor-pointer"
                      title={showFormPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4 text-danger-500" /> : <Eye className="w-4 h-4 text-primary-600" />}
                    </button>
                  </div>
                  <p className="text-[11.5px] text-ink-3">{MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل. سيُطلب من المستخدم تغييرها عند أول دخول.</p>
                  </>)}
                </div>
                ) : (
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">كلمة المرور</label>
                  <div className="p-2.5 border border-line bg-sand-50 rounded-xl text-[12.5px] text-ink-2 flex items-center justify-between gap-2">
                    <span>لا تُخزَّن كلمات المرور في المنظومة ولا يمكن عرضها.</span>
                    {onResetUserPassword && (
                      <button
                        type="button"
                        onClick={() => handleResetPassword(editingUser)}
                        className="text-[11.5px] text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>إعادة تعيين</span>
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نوع الصلاحية الافتراضية</label>
                  <Select
                    aria-label="نوع الصلاحية الافتراضية"
                    data-field="user-role"
                    value={formRole}
                    disabled={isPrimaryDirector(editingUser)}
                    onChange={(v) => {
                      const newRole = v as UserRole;
                      setFormRole(newRole);
                      // Auto-apply roles preset
                      if (newRole === "مدير") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(true);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(true);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      } else if (newRole === "إداري") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(true);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(true);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      } else if (newRole === "مؤطر") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(false);
                      } else if (newRole === "مدرس") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(false);
                      } else if (newRole === "متطوع" || newRole === "عامل نظافة / صيانة" || newRole === "أخرى") {
                        setFormCanEditStudents(false);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(false);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(false);
                        setFormTeacherRecordGrades(false);
                        setFormTeacherWriteBehaviorReports(false);
                        setFormTeacherEditOwnStudents(false);
                        setFormTeacherSendAlertsToParents(false);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(newRole === "متطوع");
                      } else {
                        // Student or Parent
                        setFormCanEditStudents(false);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(false);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(false);
                        setFormTeacherRecordGrades(false);
                        setFormTeacherWriteBehaviorReports(false);
                        setFormTeacherEditOwnStudents(false);
                        setFormTeacherSendAlertsToParents(false);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      }

                      // Update permissions matrix to match new role
                      setFormPermissions(getDefaultPermissionsForRole(newRole));
                    }}
                  >
                    <option value="مدير">مدير (Director - كامل الصلاحيات)</option>
                    <option value="إداري">إداري / عضو مكتب تنفيذي (Administrator)</option>
                    <option value="مؤطر">مؤطر / مشرف تربوي (Mentor / Supervisor)</option>
                    <option value="مدرس">أستاذ / محفظ (Teacher)</option>
                    <option value="متطوع">متطوع بالأنشطة والفعاليات (Volunteer)</option>
                    <option value="عامل نظافة / صيانة">عامل نظافة وصيانة (Maintenance / Cleaning)</option>
                    <option value="ولي أمر">ولي أمر (Parent Portal)</option>
                    <option value="طالب">طالب (Student Portal - 15+ سنة)</option>
                    <option value="أخرى">أخرى (Other)</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">حالة الحساب</label>
                  <Select
                    aria-label="حالة الحساب"
                    value={formIsActive ? "active" : "blocked"}
                    disabled={isPrimaryDirector(editingUser)}
                    onChange={(v) => setFormIsActive(v === "active")}
                  >
                    <option value="active">نشط ومفعل</option>
                    <option value="blocked">موقوف / مجمد</option>
                  </Select>
                </div>
              </div>

              {/* Liens explicites du compte (Lot 0) */}
              <div className="border-t pt-4 space-y-2" dir="rtl">
                {(formRole === "طالب" || formRole === "ولي أمر") ? (
                  <div className="space-y-2">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">
                      {formRole === "طالب" ? "ملف الطالب المرتبط بهذا الحساب" : "الأبناء المرتبطون بهذا الحساب"}
                      <span className="text-ink-3 font-medium"> ({formLinkedStudentIds.length})</span>
                    </label>
                    <p className="text-[11.5px] text-ink-3">لا يرى صاحب الحساب إلا ملفات الطلاب المحددة هنا.</p>
                    <input
                      type="text"
                      value={linkedStudentSearch}
                      onChange={(e) => setLinkedStudentSearch(e.target.value)}
                      placeholder="بحث باسم الطالب أو ولي الأمر..."
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                    <div className="max-h-40 overflow-y-auto border border-line rounded-xl divide-y divide-line-faint">
                      {students
                        .filter((st) => {
                          const q = linkedStudentSearch.trim();
                          return formLinkedStudentIds.includes(st.id) || !q || (st.fullName || "").includes(q) || (st.parentName || "").includes(q) || (st.parentPhone || "").includes(q);
                        })
                        .slice(0, 50)
                        .map((st) => (
                          <label key={st.id} className="flex items-center gap-2 px-3 py-1.5 text-[13px] cursor-pointer hover:bg-sand-50">
                            <input
                              type="checkbox"
                              checked={formLinkedStudentIds.includes(st.id)}
                              onChange={(e) => {
                                setFormLinkedStudentIds((prev) => {
                                  if (!e.target.checked) return prev.filter((id) => id !== st.id);
                                  return formRole === "طالب" ? [st.id] : [...prev, st.id];
                                });
                              }}
                            />
                            <span className="font-bold text-ink-2">{st.fullName}</span>
                            <span className="text-ink-3">— {st.parentName} {st.parentPhone}</span>
                            <span className="text-sand-400 font-mono mr-auto">{st.id}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملف العامل / المدرس المرتبط</label>
                    <Select
                      aria-label="ملف العامل / المدرس المرتبط"
                      value={formLinkedTeacherId}
                      onChange={(v) => setFormLinkedTeacherId(v)}
                    >
                      <option value="">— بدون ربط —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName}{t.roleTitle ? ` (${t.roleTitle})` : ""}</option>
                      ))}
                    </Select>
                    <p className="text-[11.5px] text-ink-3">يُستعمل لعرض حلقات المدرس وإيقاف الحساب تلقائياً عند أرشفة الملف.</p>
                  </div>
                )}
              </div>

              {/* Odoo CRUD Permission Matrix */}
              <div className="border-t pt-4 text-right" dir="rtl">
                <PermissionMatrixEditor
                  permissions={formPermissions}
                  onChange={setFormPermissions}
                  role={formRole}
                  disabled={isPrimaryDirector(editingUser)}
                />
              </div>

              {isPrimaryDirector(editingUser) && (
                <div className="bg-gold-50 border border-gold-200 text-gold-800 p-3 rounded-xl flex items-start gap-2 text-[11.5px]">
                  <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <p>حساب المدير الأساسي لهذه المدرسة له الصلاحيات المطلقة دائماً ولا يمكن تعديل نوع حسابه أو حظره لضمان عدم انقطاع الوصول إلى النظام.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={userFormSaving}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
                  id="btn-confirm-save-user"
                >
                  {userFormSaving ? "جاري الحفظ..." : "حفظ الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
