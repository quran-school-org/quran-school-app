/**
 * Sauvegarde et restauration de la base (constat 11 de l'audit UX, D100) :
 * actions rares et lourdes, sorties du tableau de bord. Même logique qu'avant
 * (`handleBackupRealmDB`, `handleRestoreRealmDB` : la confirmation de la
 * restauration reste dans ce second gestionnaire).
 */
import type React from "react";
import { Download, RefreshCw } from "lucide-react";
import { useSettings } from "./SettingsContext";
import { Button, Card, CardHeader } from "../../ui";

export interface BackupSectionProps {
  onBackup: () => void;
  onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BackupSection({ onBackup, onRestore }: BackupSectionProps) {
  const { subTab } = useSettings();
  if (subTab !== "general") return null;

  return (
    <Card data-section="backup" id="settings-backup-section" aria-labelledby="settings-backup-title" className="flex flex-col gap-4">
      <CardHeader
        id="settings-backup-title"
        level={3}
        title="النسخ الاحتياطي"
        description="نزّل نسخة كاملة من بيانات المدرسة في ملف JSON واحتفظ بها في مكان آمن. الاسترجاع يستبدل جميع البيانات الحالية ببيانات الملف، فلا تستعمله إلا عند الضرورة."
      />
      <div className="flex flex-wrap gap-2.5">
        <Button id="manual-db-backup-btn" onClick={onBackup} title="تحميل نسخة احتياطية كاملة من قاعدة البيانات كملف JSON" icon={<Download className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
          تنزيل نسخة احتياطية
        </Button>
        <input type="file" id="restore-backup-file-input" aria-label="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي" accept=".json" onChange={onRestore} className="hidden" />
        <Button id="manual-db-restore-btn" variant="danger" onClick={() => document.getElementById("restore-backup-file-input")?.click()} title="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي" icon={<RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
          استرجاع نسخة
        </Button>
      </div>
    </Card>
  );
}
