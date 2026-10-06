import React from "react";
import {
  ALL_MODULES,
  CRUDAction,
  getDefaultPermissionsForRole,
  ModuleId,
  ModuleMeta,
  UserPermissions,
  UserRole,
} from "../types";
import {
  ShieldCheck,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Printer,
  Sparkles,
  Check,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  Layers,
  Lock,
} from "lucide-react";

interface PermissionMatrixEditorProps {
  permissions: UserPermissions;
  onChange: (newPermissions: UserPermissions) => void;
  role: UserRole;
  disabled?: boolean;
}

export const PermissionMatrixEditor: React.FC<PermissionMatrixEditorProps> = ({
  permissions,
  onChange,
  role,
  disabled = false,
}) => {
  // Group modules by category
  const generalModules = ALL_MODULES.filter((m) => m.category === "عام");
  const teacherModules = ALL_MODULES.filter((m) => m.category === "المدرسين");
  const studentParentModules = ALL_MODULES.filter(
    (m) => m.category === "الطلاب وأولياء الأمور"
  );

  // Helper to get permission for a module
  const getPerm = (moduleId: string, action: CRUDAction): boolean => {
    return Boolean(permissions[moduleId]?.[action]);
  };

  // Toggle single permission
  const handleToggle = (moduleId: string, action: CRUDAction) => {
    if (disabled) return;
    const currentModulePerm = permissions[moduleId] || {
      read: false,
      create: false,
      update: false,
      delete: false,
      print: false,
    };
    
    // Auto-enable 'read' if enabling create/update/delete/print
    let newRead = currentModulePerm.read;
    const newActionVal = !currentModulePerm[action];
    if ((action === "create" || action === "update" || action === "delete" || action === "print") && newActionVal) {
      newRead = true;
    }

    const updatedPermissions: UserPermissions = {
      ...permissions,
      [moduleId]: {
        ...currentModulePerm,
        read: newRead,
        [action]: newActionVal,
      },
    };

    onChange(updatedPermissions);
  };

  // Toggle whole row (module)
  const handleToggleRow = (moduleId: string) => {
    if (disabled) return;
    const current = permissions[moduleId] || {
      read: false,
      create: false,
      update: false,
      delete: false,
      print: false,
    };
    const allChecked =
      current.read && current.create && current.update && current.delete && Boolean(current.print);

    const newValue = !allChecked;
    const updatedPermissions: UserPermissions = {
      ...permissions,
      [moduleId]: {
        read: newValue,
        create: newValue,
        update: newValue,
        delete: newValue,
        print: newValue,
      },
    };
    onChange(updatedPermissions);
  };

  // Toggle whole column (action across all modules)
  const handleToggleColumn = (action: CRUDAction) => {
    if (disabled) return;
    const allChecked = ALL_MODULES.every((m) => getPerm(m.id, action));
    const newValue = !allChecked;

    const updatedPermissions: UserPermissions = { ...permissions };
    ALL_MODULES.forEach((m) => {
      const existing = updatedPermissions[m.id] || {
        read: false,
        create: false,
        update: false,
        delete: false,
        print: false,
      };
      let newRead = existing.read;
      if (action !== "read" && newValue) {
        newRead = true;
      }
      updatedPermissions[m.id] = {
        ...existing,
        read: action === "read" ? newValue : newRead,
        [action]: newValue,
      };
    });
    onChange(updatedPermissions);
  };

  // Select All
  const handleSelectAll = () => {
    if (disabled) return;
    const updated: UserPermissions = {};
    ALL_MODULES.forEach((m) => {
      updated[m.id] = { read: true, create: true, update: true, delete: true, print: true };
    });
    onChange(updated);
  };

  // Deselect All
  const handleDeselectAll = () => {
    if (disabled) return;
    const updated: UserPermissions = {};
    ALL_MODULES.forEach((m) => {
      updated[m.id] = { read: false, create: false, update: false, delete: false, print: false };
    });
    onChange(updated);
  };

  // Apply Role Preset
  const handleApplyRolePreset = () => {
    if (disabled) return;
    const defaultPerms = getDefaultPermissionsForRole(role);
    onChange(defaultPerms);
  };

  // Render a table section for a group of modules
  const renderModuleSection = (title: string, modules: ModuleMeta[], badgeBg: string) => (
    <div className="space-y-2 mb-6">
      <div className={`flex items-center justify-between p-3 rounded-xl border ${badgeBg}`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h4 className="text-xs font-bold">{title}</h4>
        </div>
        <span className="text-[11px] font-semibold bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
          {modules.filter((m) => getPerm(m.id, "read")).length} / {modules.length} مفعلة
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold">
              <th className="p-3 text-right font-bold min-w-[220px]">اسم القسم / الصفحة</th>
              
              {/* Column Read */}
              <th className="p-2 text-center w-28">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleColumn("read")}
                  className="w-full hover:bg-slate-200/70 p-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="تحديد/إلغاء تحديد كل خانات العرض"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>عرض</span>
                </button>
              </th>

              {/* Column Create */}
              <th className="p-2 text-center w-28">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleColumn("create")}
                  className="w-full hover:bg-slate-200/70 p-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="تحديد/إلغاء تحديد كل خانات الإضافة"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>إضافة</span>
                </button>
              </th>

              {/* Column Update */}
              <th className="p-2 text-center w-28">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleColumn("update")}
                  className="w-full hover:bg-slate-200/70 p-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="تحديد/إلغاء تحديد كل خانات التعديل"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>تعديل</span>
                </button>
              </th>

              {/* Column Delete */}
              <th className="p-2 text-center w-28">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleColumn("delete")}
                  className="w-full hover:bg-slate-200/70 p-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="تحديد/إلغاء تحديد كل خانات الحذف والحرص"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف / أرشفة</span>
                </button>
              </th>

              {/* Column Print */}
              <th className="p-2 text-center w-24">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleColumn("print")}
                  className="w-full hover:bg-slate-200/70 p-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="تحديد/إلغاء تحديد كل خانات الطباعة"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-600" />
                  <span>طباعة</span>
                </button>
              </th>

              {/* Row toggle */}
              <th className="p-2 text-center w-20 text-[11px] text-slate-500 font-semibold">
                الكل
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((module) => {
              const hasRead = getPerm(module.id, "read");
              const hasCreate = getPerm(module.id, "create");
              const hasUpdate = getPerm(module.id, "update");
              const hasDelete = getPerm(module.id, "delete");
              const hasPrint = getPerm(module.id, "print");
              const isAllRow = hasRead && hasCreate && hasUpdate && hasDelete && hasPrint;

              return (
                <tr
                  key={module.id}
                  className={`hover:bg-slate-50/90 transition ${
                    hasRead ? "bg-white" : "bg-slate-50/40 opacity-75"
                  }`}
                >
                  {/* Module Name & Desc */}
                  <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{module.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {module.description}
                    </p>
                  </td>

                  {/* Read Checkbox */}
                  <td className="p-2 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-blue-50 transition">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={hasRead}
                        onChange={() => handleToggle(module.id, "read")}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* Create Checkbox */}
                  <td className="p-2 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-emerald-50 transition">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={hasCreate}
                        onChange={() => handleToggle(module.id, "create")}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* Update Checkbox */}
                  <td className="p-2 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-amber-50 transition">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={hasUpdate}
                        onChange={() => handleToggle(module.id, "update")}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* Delete Checkbox */}
                  <td className="p-2 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-rose-50 transition">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={hasDelete}
                        onChange={() => handleToggle(module.id, "delete")}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* Print Checkbox */}
                  <td className="p-2 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-purple-50 transition">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={hasPrint}
                        onChange={() => handleToggle(module.id, "print")}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* Row toggle button */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleToggleRow(module.id)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        isAllRow
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={isAllRow ? "إلغاء الكل لهذا الصف" : "تحديد الكل لهذا الصف"}
                    >
                      {isAllRow ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Quick Actions Toolbar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
        {/* Title & Subtitle */}
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">مصفوفة صلاحيات الوصول</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                تحكم مخصص
              </span>
            </div>
            <p className="text-xs text-slate-300">
              تخصيص مستويات التحكم لكل قسم
            </p>
          </div>
        </div>

        {/* Quick Horizontal Control Bar */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            أزرار التحكم السريع:
          </span>
          
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={disabled}
              onClick={handleApplyRolePreset}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              title="تطبيق القالب التلقائي المناسب للدور المختار"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تطبيق قالب الدور ({role})</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تحديد الكل</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleDeselectAll}
              className="px-3 py-2 rounded-xl bg-rose-800/80 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>تفريغ الكل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      {renderModuleSection(
        "الأقسام والخدمات العامة والإدارية",
        generalModules,
        "bg-emerald-50 text-emerald-900 border-emerald-200"
      )}

      {renderModuleSection(
        "بوابة المدرسين والمحفظين",
        teacherModules,
        "bg-amber-50 text-amber-900 border-amber-200"
      )}

      {renderModuleSection(
        "بوابة الطلاب وأولياء الأمور",
        studentParentModules,
        "bg-blue-50 text-blue-900 border-blue-200"
      )}
    </div>
  );
};
