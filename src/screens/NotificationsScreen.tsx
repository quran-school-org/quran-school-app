/**
 * Boîte de notifications (charte « لوحة الكتّاب »), selon le rôle.
 * Mêmes actions qu'auparavant (marquer comme lu, tout effacer pour le directeur).
 */
import React from "react";
import { AlertTriangle, Bell, CheckCircle2, Coins, Inbox, Trash2 } from "lucide-react";
import { RealmSimDB } from "../db";
import { useApp } from "../app/AppContext";
import { Button, Card, EmptyState, Ltr, PageHeader, Pill, cx } from "../ui";

const TYPE_ICON: Record<string, { icon: any; cls: string }> = {
  "نجاح": { icon: CheckCircle2, cls: "bg-success-100 text-success-700" },
  "تنبيه": { icon: AlertTriangle, cls: "bg-danger-100 text-danger" },
  "مالي": { icon: Coins, cls: "bg-gold-100 text-gold-800" },
};

export default function NotificationsScreen() {
  const { currentRole, loadDatabase, userNotifications } = useApp();
  const unread = userNotifications.filter((n) => !n.isRead).length;

  return (
    <div data-screen="notifications" className="flex flex-col gap-6">
      <PageHeader
        eyebrow={unread > 0 ? `${unread} غير مقروءة` : undefined}
        title={currentRole === "ولي أمر" ? "صندوق إشعارات وتنبيهات أولياء الأمور" : currentRole === "طالب" ? "صندوق الإشعارات الشخصية للطالب" : "الإشعارات"}
        description={
          currentRole === "ولي أمر"
            ? "إشعارات خاصة بانتظام وحفظ وحضور أبنائك والرسوم المستحقة."
            : currentRole === "طالب"
            ? "إشعارات وتنبيهات الأنشطة والامتحانات وسجل الحفظ الخاص بك."
            : "صندوق الإشعارات الفورية والتنبيهات: تابع العمليات الإدارية، المالية والتربوية دقيقة بدقيقة."
        }
        actions={
          currentRole === "مدير" && (
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" strokeWidth={1.75} />}
              onClick={() => {
                RealmSimDB.clearAllNotifications();
                loadDatabase();
              }}
            >
              مسح جميع التنبيهات
            </Button>
          )
        }
      />

      {userNotifications.length > 0 ? (
        <Card padded={false} className="overflow-hidden">
          <ul className="m-0 p-0 list-none divide-y divide-line-faint">
            {userNotifications.map((n) => {
              const t = TYPE_ICON[n.type] || { icon: Bell, cls: "bg-primary-100 text-primary" };
              const Icon = t.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      RealmSimDB.markNotificationAsRead(n.id);
                      loadDatabase();
                    }}
                    className={cx(
                      "w-full text-start flex gap-4 px-5 py-4 cursor-pointer border-0 border-s-4 transition-colors hover:bg-surface-2",
                      !n.isRead ? "bg-primary-50/60 border-s-gold" : "bg-transparent border-s-transparent",
                    )}
                  >
                    <span aria-hidden="true" className={cx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", t.cls)}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="flex flex-wrap justify-between items-center gap-2">
                        <span className={cx("text-[15px] text-ink", !n.isRead ? "font-bold" : "font-semibold")}>{n.title}</span>
                        <Ltr className="text-[12.5px] text-ink-3">{n.date}</Ltr>
                      </span>
                      <span className="text-[14px] text-ink-2 leading-relaxed">{n.message}</span>
                      {!n.isRead && <Pill tone="warn" className="self-start">جديد • انقر لتعليم كمقروء</Pill>}
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
    </div>
  );
}
