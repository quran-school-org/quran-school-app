/**
 * Page de choix de l'école après connexion (plusieurs écoles, ou super-admin).
 * Le super-admin peut aussi créer une école. Charte « لوحة الكتّاب » (comme la connexion).
 */
import React, { useState } from "react";
import { Building, LogOut, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import type { SchoolInfo } from "../types";
import { ActionAlert, Button, Emblem, FormField, Input } from "../ui";

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
    <div data-screen="school-picker" className="min-h-screen bg-app flex items-center justify-center p-4 md:p-8" dir="rtl">
      <div className="w-full max-w-lg flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Emblem size={56} />
          <h1 className="m-0 font-display font-bold text-heading sm:text-heading text-primary">اختيار المدرسة</h1>
          <p className="m-0 text-body text-ink-2">مرحباً {userName}، اختر المدرسة التي تريد الدخول إليها.</p>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 flex flex-col gap-4">
          {error && <ActionAlert role="alert" tone="danger" icon={<ShieldAlert className="w-5 h-5" strokeWidth={1.75} />} title={error} />}

          <div className="flex flex-col gap-2" id="school-picker-list">
            {schools.length === 0 && <p className="m-0 text-body text-ink-3 text-center py-4">لا توجد مدرسة مرتبطة بحسابك حالياً.</p>}
            {schools.map((school) => {
              const isMember = memberSchoolIds.includes(school.id);
              return (
                <button
                  key={school.id}
                  type="button"
                  disabled={busy || !isMember}
                  onClick={() => onSelect(school.id)}
                  className="w-full min-h-14 flex items-center justify-between gap-3 px-4 py-3 bg-white border border-line rounded-xl text-start cursor-pointer transition-colors hover:border-primary hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true" className="w-9 h-9 rounded-lg bg-night text-gold inline-flex items-center justify-center shrink-0"><Building className="w-4 h-4" strokeWidth={1.75} /></span>
                    <span className="text-body font-semibold text-ink truncate" title={school.name || school.id}>{school.name || school.id}</span>
                  </span>
                  <span className="text-small text-ink-3 shrink-0" dir="ltr">{isMember ? school.id : `${school.id} • لست عضواً`}</span>
                </button>
              );
            })}
          </div>

          {isSuperAdmin && (
            <form onSubmit={handleCreate} className="border-t border-line-soft pt-4 flex flex-col gap-3" id="create-school-form">
              <h2 className="m-0 flex items-center gap-1.5 font-sans font-semibold text-body text-primary">
                <Plus className="w-4 h-4 text-gold-700" strokeWidth={1.75} aria-hidden="true" />إنشاء مدرسة جديدة (المشرف العام)
              </h2>
              {formError && <p role="alert" className="m-0 text-small text-danger font-semibold">{formError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="اسم المدرسة">
                  {(id) => <Input id={id} type="text" value={newName} onChange={(e: any) => setNewName(e.target.value)} placeholder="اسم المدرسة" />}
                </FormField>
                <FormField label="معرّف المدرسة">
                  {(id) => <Input id={id} type="text" dir="ltr" value={newId} onChange={(e: any) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="school-id" className="text-end" />}
                </FormField>
              </div>
              <Button type="submit" variant="primary" block disabled={busy} icon={busy ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : <Plus className="w-4 h-4" strokeWidth={1.75} />}>
                إنشاء المدرسة (وتعييني مديراً لها)
              </Button>
            </form>
          )}

          <Button variant="danger" block onClick={onLogout} icon={<LogOut className="w-4 h-4" strokeWidth={1.75} />}>خروج</Button>
        </div>
      </div>
    </div>
  );
}
