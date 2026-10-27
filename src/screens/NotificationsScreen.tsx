/**
 * Boîte de notifications (charte « لوحة الكتّاب »), selon le rôle.
 * Mêmes actions qu'auparavant (marquer comme lu, tout effacer pour le directeur,
 * désormais après confirmation dans une fenêtre de la charte : nombre et
 * caractère définitif de la suppression).
 */
import { useState } from "react";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Coins, Inbox, Trash2 } from "lucide-react";
import { RealmSimDB } from "../db";
import { useApp } from "../app/AppContext";
import { isNotificationRead } from "../types";
import { ActionAlert, Button, Card, EmptyState, Modal, PageHeader, Pill, cx } from "../ui";
import { formatDateAr } from "../format/date";

const TYPE_ICON: Record<string, { icon: any; cls: string }> = {
  "نجاح": { icon: CheckCircle2, cls: "bg-success-100 text-success-700" },
  "تنبيه": { icon: AlertTriangle, cls: "bg-danger-100 text-danger" },
  "مالي": { icon: Coins, cls: "bg-gold-100 text-gold-800" },
};

export default function NotificationsScreen() {
  const { currentRole, loadDatabase, userNotifications, notifications, authUid } = useApp();
  const unread = userNotifications.filter((n) => !isNotificationRead(n, authUid)).length;
  const [confirmClear, setConfirmClear] = useState(false);
  /** Toutes les notifications de l'école (celles que la suppression efface), pas seulement la liste filtrée. */
  const schoolTotal = (notifications || userNotifications).length;
  /**
   * « Tout marquer comme lu » : seulement pour le personnel. Hors bureau, une mise à jour ne peut
   * qu'ajouter son propre uid à `readBy` (R-07, D65, U-03) : c'est exactement ce que fait cette action.
   * Les familles ne lisent pas les notifications (R-07) : pas d'action d'écriture pour elles.
   */
  const canMarkRead = !!authUid && currentRole !== "ولي أمر" && currentRole !== "طالب";
  const markAllRead = () => {
    if (!authUid) return;
    userNotifications.filter((n) => !isNotificationRead(n, authUid)).forEach((n) => RealmSimDB.markNotificationAsRead(n.id, authUid));
    loadDatabase();
  };
  const clearAll = () => {
    RealmSimDB.clearAllNotifications();
    loadDatabase();
    setConfirmClear(false);
  };

  return (
    <div data-screen="notifications" className="flex flex-col gap-6">
      <PageHeader
        eyebrow={unread > 0 ? `${unread} غير مقروءة` : undefined}
        title="الإشعارات"
        actions={
          <>
            {canMarkRead && unread > 0 && (
              <Button variant="primary" data-action="mark-all-notifications-read" icon={<CheckCheck className="w-4 h-4" strokeWidth={1.75} />} onClick={markAllRead}>
                تعليم الكل كمقروء
              </Button>
            )}
            {currentRole === "مدير" && (
              <Button
                variant="ghost"
                data-action="clear-notifications"
                disabled={schoolTotal === 0}
                className="text-danger hover:bg-danger-100"
                icon={<Trash2 className="w-4 h-4" strokeWidth={1.75} />}
                onClick={() => setConfirmClear(true)}
              >
                مسح الكل
              </Button>
            )}
          </>
        }
      />

      {userNotifications.length > 0 ? (
        <Card padded={false} className="overflow-hidden">
          <ul className="m-0 p-0 list-none divide-y divide-line-faint">
            {userNotifications.map((n) => {
              const read = isNotificationRead(n, authUid);
              const t = TYPE_ICON[n.type] || { icon: Bell, cls: "bg-primary-100 text-primary" };
              const Icon = t.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!read && authUid) RealmSimDB.markNotificationAsRead(n.id, authUid);
                      loadDatabase();
                    }}
                    className={cx(
                      "w-full min-h-11 text-start flex gap-4 px-5 py-4 cursor-pointer border-0 border-s-4 transition-colors hover:bg-surface-2",
                      !read ? "bg-primary-50/60 border-s-gold" : "bg-transparent border-s-transparent",
                    )}
                  >
                    <span aria-hidden="true" className={cx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", t.cls)}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="flex flex-wrap justify-between items-center gap-2">
                        <span className={cx("text-body text-ink", !read ? "font-bold" : "font-semibold")}>{n.title}</span>
                        <span className="text-small text-ink-3">{formatDateAr(n.date)}</span>
                      </span>
                      <span className="text-body text-ink-2 leading-relaxed">{n.message}</span>
                      {!read && (
                        <Pill tone="warn" className="self-start">
                          جديد<span className="sr-only"> — انقر لتعليم الإشعار كمقروء</span>
                        </Pill>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={<Inbox className="w-8 h-8" strokeWidth={1.5} />} title="لا إشعارات">لا توجد إشعارات أو تنبيهات موجهة لك حالياً.</EmptyState>
      )}

      {confirmClear && (
        <Modal
          modalId="confirm-clear-notifications"
          size="sm"
          title="مسح جميع التنبيهات؟"
          icon={<AlertTriangle className="w-6 h-6" strokeWidth={1.75} />}
          onClose={() => setConfirmClear(false)}
          footer={
            <>
              <Button onClick={() => setConfirmClear(false)}>إلغاء</Button>
              <Button variant="danger-solid" data-action="confirm-clear-notifications" icon={<Trash2 className="w-4 h-4" strokeWidth={1.75} />} onClick={clearAll}>
                {`حذف نهائي (${schoolTotal})`}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="m-0 text-body text-ink leading-relaxed">{`عدد التنبيهات التي ستُحذف: ${schoolTotal} (جميع تنبيهات المدرسة، المقروءة وغير المقروءة، لدى جميع المستخدمين).`}</p>
            <ActionAlert tone="danger" title="إجراء نهائي">لا يمكن التراجع عن هذا الحذف ولا استرجاع التنبيهات بعده.</ActionAlert>
          </div>
        </Modal>
      )}
    </div>
  );
}
