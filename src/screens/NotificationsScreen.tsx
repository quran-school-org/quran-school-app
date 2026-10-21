/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../db";
import { Bell } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function NotificationsScreen() {
  const {
    notifications,
    currentRole,
    loadDatabase,
    userNotifications,
  } = useApp();

  return (
    <div data-screen="notifications" className="space-y-6">

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-sand-200">
        <div>
          <h2 className="text-xl font-bold text-sand-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-700" />
            {currentRole === "ولي أمر"
              ? "صندوق إشعارات وتنبيهات أولياء الأمور"
              : currentRole === "طالب"
              ? "صندوق الإشعارات الشخصية للطالب"
              : "صندوق الإشعارات الفورية والتنبيهات"}
          </h2>
          <p className="text-xs text-sand-500">
            {currentRole === "ولي أمر"
              ? "إشعارات خاصة بانتظام وحفظ وحضور أبنائك والرسوم المستحقة."
              : currentRole === "طالب"
              ? "إشعارات وتنبيهات الأنشطة والامتحانات وسجل الحفظ الخاص بك."
              : "تابع العمليات الإدارية، المالية والتربوية دقيقة بدقيقة."}
          </p>
        </div>

        {currentRole === "مدير" && (
          <button
            onClick={() => {
              RealmSimDB.clearAllNotifications();
              loadDatabase();
            }}
            className="px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-700 rounded-lg text-xs font-bold transition"
          >
            مسح جميع التنبيهات
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden divide-y divide-sand-100">
        {userNotifications.length > 0 ? (
          userNotifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => {
                RealmSimDB.markNotificationAsRead(n.id);
                loadDatabase();
              }}
              className={`p-4 flex gap-4 transition cursor-pointer hover:bg-sand-50/50 ${!n.isRead ? "bg-primary-50/10 border-r-4 border-primary-600" : ""}`}
            >
              <div className="text-2xl pt-0.5">
                {n.type === "نجاح" ? "🟢" : n.type === "تنبيه" ? "🔴" : n.type === "مالي" ? "🪙" : "📁"}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sand-800 text-xs">{n.title}</h4>
                  <span className="text-[10px] text-sand-500 font-mono">{n.date}</span>
                </div>
                <p className="text-xs text-sand-600 leading-relaxed">{n.message}</p>

                {!n.isRead && (
                  <span className="inline-block text-[9px] text-primary-700 bg-primary-50 font-bold px-2 py-0.5 rounded">
                    جديد • انقر لتعليم كقروء
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sand-500 text-xs font-medium">
            لا توجد إشعارات أو تنبيهات موجهة لك حالياً.
          </div>
        )}
      </div>

    </div>
  );
}
