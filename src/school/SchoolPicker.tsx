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
    <div data-screen="school-picker" className="min-h-screen bg-sand-50 flex items-center justify-center p-4 md:p-8" dir="rtl">
      <div className="w-full max-w-lg bg-surface border border-line overflow-hidden rounded-3xl shadow-pop">
        <div className="h-2 bg-gradient-to-r from-primary-600 via-gold-500 to-primary-700"></div>
        <div className="p-6 md:p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary">اختيار المدرسة</h2>
            <p className="text-[13px] text-ink-3 mt-1 font-medium">مرحباً {userName}، اختر المدرسة التي تريد الدخول إليها.</p>
          </div>

          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-xl text-[13px] font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-danger-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2" id="school-picker-list">
            {schools.length === 0 && (
              <p className="text-[13px] text-ink-3 text-center py-4">لا توجد مدرسة مرتبطة بحسابك حالياً.</p>
            )}
            {schools.map((school) => {
              const isMember = memberSchoolIds.includes(school.id);
              return (
                <button
                  key={school.id}
                  type="button"
                  disabled={busy || !isMember}
                  onClick={() => onSelect(school.id)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 bg-sand-50 hover:bg-primary-50 border border-line hover:border-primary-300 rounded-xl transition text-right disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary-700" />
                    <span className="text-sm font-bold text-ink">{school.name || school.id}</span>
                  </span>
                  <span className="text-[11.5px] font-mono text-ink-3">
                    {isMember ? school.id : `${school.id} • لست عضواً`}
                  </span>
                </button>
              );
            })}
          </div>

          {isSuperAdmin && (
            <form onSubmit={handleCreate} className="border-t border-line-soft pt-4 space-y-3" id="create-school-form">
              <h3 className="text-[13px] font-bold text-primary-2 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary-600" />
                <span>إنشاء مدرسة جديدة (المشرف العام)</span>
              </h3>
              {formError && <p className="text-[12.5px] text-danger-700 font-bold">{formError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم المدرسة"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="school-id"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-[13px] transition flex items-center justify-center gap-2 disabled:bg-primary-400 cursor-pointer"
              >
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>إنشاء المدرسة (وتعييني مديراً لها)</span>
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-xl border border-danger-200 text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
