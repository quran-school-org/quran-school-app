/**
 * Sauvegarde et restauration de la base de l'école (audit UX/UI, constat 11,
 * D100) : actions rares et risquées, déplacées du tableau de bord vers
 * Paramètres. La restauration garde sa confirmation (ConfirmDialog, ton danger).
 */
import type React from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button, Card, CardHeader } from "../../ui";

export default function BackupSection({ onBackup, onRestore }: {
  onBackup: () => void;
  onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card aria-labelledby="backup-title" data-section="backup" className="flex flex-col gap-4">
      <CardHeader id="backup-title" title="النسخ الاحتياطي" />
      <p className="m-0 text-[14px] text-ink-2">
        تنزيل نسخة كاملة من بيانات المدرسة في ملف JSON، أو استرجاع نسخة سابقة. الاسترجاع يستبدل جميع البيانات الحالية.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button id="manual-db-backup-btn" onClick={onBackup} icon={<Download className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
          تنزيل نسخة احتياطية
        </Button>
        <input type="file" id="restore-backup-file-input" aria-label="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي" accept=".json" onChange={onRestore} className="hidden" />
        <Button id="manual-db-restore-btn" variant="danger" onClick={() => document.getElementById("restore-backup-file-input")?.click()} icon={<RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
          استرجاع نسخة
        </Button>
      </div>
    </Card>
  );
}
