/**
 * Page de choix de l'école après connexion (plusieurs écoles, ou super-admin).
 * Le super-admin peut aussi créer une école. Reprend le style de l'écran de connexion.
 */
import React, { useState } from "react";
import { Building, LogOut, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import type { SchoolInfo } from "../types";

interface SchoolPickerProps {
  schools: SchoolInfo[];
  memberSchoolIds: string[];
  isSuperAdmin: boolean;
  userName: string;
  busy: boolean;
  error: string;
  onSelect: (schoolId: string) => void;
  onCreate: (schoolId: string, name: string) => Promise<boolean>;
  onLogout: () => void;
}

const SCHOOL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

export default function SchoolPicker({ schools, memberSchoolIds, isSuperAdmin, userName, busy, error, onSelect, onCreate, onLogout }: SchoolPickerProps) {
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!SCHOOL_ID_PATTERN.test(newId)) {
      setFormError("المعرّف: حروف لاتينية صغيرة وأرقام وشرطات فقط (2 إلى 40 حرفاً).");
      return;
    }
    if (!newName.trim()) {
      setFormError("يرجى إدخال اسم المدرسة.");
      return;
    }
    if (await onCreate(newId, newName.trim())) {
      setNewId("");
      setNewName("");
    }
  };

  return (
    <div data-screen="school-picker" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700"></div>
        <div className="p-6 md:p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800">اختيار المدرسة</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">مرحباً {userName}، اختر المدرسة التي تريد الدخول إليها.</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2" id="school-picker-list">
            {schools.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">لا توجد مدرسة مرتبطة بحسابك حالياً.</p>
            )}
            {schools.map((school) => {
              const isMember = memberSchoolIds.includes(school.id);
              return (
                <button
                  key={school.id}
                  type="button"
                  disabled={busy || !isMember}
                  onClick={() => onSelect(school.id)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition text-right disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span className="text-sm font-bold text-slate-800">{school.name || school.id}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isMember ? school.id : `${school.id} • لست عضواً`}
                  </span>
                </button>
              );
            })}
          </div>

          {isSuperAdmin && (
            <form onSubmit={handleCreate} className="border-t border-slate-100 pt-4 space-y-3" id="create-school-form">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>إنشاء مدرسة جديدة (المشرف العام)</span>
              </h3>
              {formError && <p className="text-[11px] text-rose-700 font-bold">{formError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم المدرسة"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="school-id"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:bg-emerald-400 cursor-pointer"
              >
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>إنشاء المدرسة (وتعييني مديراً لها)</span>
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
