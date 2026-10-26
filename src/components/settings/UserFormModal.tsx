/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs, bandeau sombre en jetons de texte clair (contraste).
 */
import { UserRole, getDefaultPermissionsForRole } from "../../types";
import { MIN_NEW_PASSWORD_LENGTH } from "../../security/accounts";
import { PermissionMatrixEditor } from "../PermissionMatrixEditor";
import { useId } from "react";
import { Lock, AlertTriangle, Sparkles, Eye, EyeOff, KeyRound } from "lucide-react";
import { isPrimaryDirector } from "./shared";
import { useSettings } from "./SettingsContext";
import { Button, FormField, Input, Modal, Select } from "../../ui";

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

  const usernameId = useId();
  const passwordId = useId();
  const linkedLabelId = useId();
  if (!showUserModal) return null;
  const close = () => setShowUserModal(false);

  /** Choix du rôle : applique le préréglage de droits du rôle (inchangé). */
  const onRoleChange = (v: string) => {
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
  };

  return (
    <Modal
      modalId="user-form"
      size="lg"
      tone="night"
      title={editingUser ? "تعديل حساب المستخدم" : "إضافة حساب مستخدم جديد"}
      subtitle="قم بملء البيانات وتخصيص مستويات الوصول بكل دقة."
      onClose={close}
      onSubmit={handleUserSubmit}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary" disabled={userFormSaving} id="btn-confirm-save-user">
            {userFormSaving ? "جاري الحفظ..." : "حفظ الحساب"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField className="col-span-2" label={<>الاسم الكامل <span className="text-danger-500">*</span></>}>
          {(id) => (
            <Input id={id} type="text" required value={formFullName} onChange={(e) => handleFullNameChange(e.target.value)} placeholder="مثال: ذ. مصطفى العلوي" />
          )}
        </FormField>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1 mb-1">
            <label htmlFor={usernameId} className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المستخدم (Username) <span className="text-danger-500">*</span></label>
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
          <Input
            id={usernameId}
            type="text"
            required
            disabled={!!editingUser}
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="mustafa_alawi"
            className="font-mono text-left"
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
          <label htmlFor={passwordId} className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">كلمة المرور المؤقتة <span className="text-danger-500">*</span></label>
          <div className="relative">
            <span className="absolute right-3 top-3 text-ink-3 pointer-events-none"><Lock className="w-3.5 h-3.5" /></span>
            <Input
              id={passwordId}
              type={showFormPassword ? "text" : "password"}
              required={!formAttachExisting}
              minLength={MIN_NEW_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-9 pl-9 font-mono text-left"
            />
            <button
              type="button"
              onClick={() => setShowFormPassword(!showFormPassword)}
              className="absolute left-2.5 top-2.5 p-1 text-ink-3 hover:text-primary-700 hover:bg-sand-100 rounded-lg transition cursor-pointer"
              title={showFormPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              aria-label={showFormPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showFormPassword ? <EyeOff className="w-4 h-4 text-danger-500" /> : <Eye className="w-4 h-4 text-primary-600" />}
            </button>
          </div>
          <p className="text-[11.5px] text-ink-3">{MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل. سيُطلب من المستخدم تغييرها عند أول دخول.</p>
          </>)}
        </div>
        ) : (
        <div className="space-y-1">
          <span className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">كلمة المرور</span>
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
        <FormField label="نوع الصلاحية الافتراضية">
          {(id) => (
            <Select
              id={id}
              data-field="user-role"
              value={formRole}
              disabled={isPrimaryDirector(editingUser)}
              onChange={onRoleChange}
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
          )}
        </FormField>

        <FormField label="حالة الحساب">
          {(id) => (
            <Select
              id={id}
              value={formIsActive ? "active" : "blocked"}
              disabled={isPrimaryDirector(editingUser)}
              onChange={(v) => setFormIsActive(v === "active")}
            >
              <option value="active">نشط ومفعل</option>
              <option value="blocked">موقوف / مجمد</option>
            </Select>
          )}
        </FormField>
      </div>

      {/* Liens explicites du compte (Lot 0) */}
      <div className="border-t pt-4 space-y-2" dir="rtl">
        {(formRole === "طالب" || formRole === "ولي أمر") ? (
          <div role="group" aria-labelledby={linkedLabelId} className="space-y-2">
            <span id={linkedLabelId} className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">
              {formRole === "طالب" ? "ملف الطالب المرتبط بهذا الحساب" : "الأبناء المرتبطون بهذا الحساب"}
              <span className="text-ink-3 font-medium"> ({formLinkedStudentIds.length})</span>
            </span>
            <p className="text-[11.5px] text-ink-3">لا يرى صاحب الحساب إلا ملفات الطلاب المحددة هنا.</p>
            <Input
              type="text"
              aria-label="بحث باسم الطالب أو ولي الأمر..."
              value={linkedStudentSearch}
              onChange={(e) => setLinkedStudentSearch(e.target.value)}
              placeholder="بحث باسم الطالب أو ولي الأمر..."
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
          <FormField label="ملف العامل / المدرس المرتبط" hint="يُستعمل لعرض حلقات المدرس وإيقاف الحساب تلقائياً عند أرشفة الملف.">
            {(id) => (
              <Select id={id} value={formLinkedTeacherId} onChange={(v) => setFormLinkedTeacherId(v)}>
                <option value="">— بدون ربط —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}{t.roleTitle ? ` (${t.roleTitle})` : ""}</option>
                ))}
              </Select>
            )}
          </FormField>
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
    </Modal>
  );
}
