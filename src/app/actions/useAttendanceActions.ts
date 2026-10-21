/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useEffect, useRef } from "react";
import { RealmSimDB } from "../../db";
import { Student, Attendance } from "../../types";
import { Html5Qrcode } from "html5-qrcode";
import { Check, Camera } from "lucide-react";
import { parseClassSchedule } from "../helpers";
import type { DerivedScope } from "../scope";

export function useAttendanceActions(s: DerivedScope) {
  const {
    addSysNotification,
    attendance,
    attendanceDate,
    classes,
    isScanning,
    loadDatabase,
    schoolName,
    selectedStudentForReport,
    setIsScanning,
    setScanStatus,
    students,
  } = s;

  // Attendance processing
  const getConsecutiveAbsences = (studentId: string): number => {
    const studentRecords = attendance
      .filter(a => a.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));

    let consecutiveCount = 0;
    for (const record of studentRecords) {
      if (record.status === "غائب") {
        consecutiveCount++;
      } else {
        break;
      }
    }
    return consecutiveCount;
  };

  const handleSendAbsenceWarning = (student: Student) => {
    const consecutiveCount = getConsecutiveAbsences(student.id);
    const phone = (student.parentPhone || "").replace(/\s+/g, "");
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "212" + phone.substring(1);
    }
    const message = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) *${student.fullName}* المحترم(ة). نحيطكم علماً بأن ابنكم/ابنتكم قد تغيب عن حصص التحفيظ بـ *${consecutiveCount} حصص متتالية*. نرجو منكم التواصل مع إدارة ${schoolName} لتبرير هذا الغياب والتعاون معنا لضمان التزام الطالب وتقدمه الدراسي. جزاكم الله خيراً.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, "_blank");

    addSysNotification(
      "إنذار غياب",
      `تم إرسال إنذار غياب لولي أمر الطالب ${student.fullName} عبر واتساب لتغيبه ${consecutiveCount} حصص متتالية.`,
      "تنبيه"
    );
  };

  const handleToggleAttendance = (studentId: string, status: "حاضر" | "غائب" | "متأخر", notes?: string) => {
    const updated: Attendance = {
      id: `a_${attendanceDate}_${studentId}`,
      date: attendanceDate,
      studentId,
      status,
      notes
    };
    RealmSimDB.saveAttendance(updated);

    // Check if the new attendance status marks 3 or more consecutive absences
    const student = students.find(s => s.id === studentId);
    if (status === "غائب" && student) {
      const nextRecords = [
        updated,
        ...attendance.filter(a => a.studentId === studentId && a.date !== attendanceDate)
      ].sort((a, b) => b.date.localeCompare(a.date));

      let consecutiveCount = 0;
      for (const record of nextRecords) {
        if (record.status === "غائب") {
          consecutiveCount++;
        } else {
          break;
        }
      }

      if (consecutiveCount >= 3) {
        addSysNotification(
          "تنبيه غياب متكرر ⚠️",
          `الطالب ${student.fullName} متغيب لـ ${consecutiveCount} حصص متتالية! يرجى إرسال إنذار غياب لولي أمره.`,
          "تنبيه"
        );
      }
    }

    loadDatabase();
  };

  const playBeep = (type: "success" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio not supported or blocked by user interaction", e);
    }
  };

  const handleScannedValue = (scannedText: string) => {
    if (!scannedText || scannedText.trim() === "") return;
    
    let targetId = scannedText.trim();
    
    if (targetId.startsWith("ALFAJR ID-")) {
      targetId = targetId.replace("ALFAJR ID-", "");
    }
    targetId = targetId.replace(/\*/g, "");
    
    const normalizedTarget = targetId.toLowerCase().trim();

    const foundStudent = students.find(
      s => s.id.toLowerCase() === normalizedTarget || 
           s.fullName.toLowerCase() === normalizedTarget ||
           s.fullName.includes(scannedText)
    );

    if (foundStudent) {
      const studentClass = classes.find(c => c.id === foundStudent.classId);
      let finalStatus: "حاضر" | "غائب" | "متأخر" = "حاضر";
      let note = "تسجيل حضور سريع بالرمز";
      let alertMessage = `تم رصد حضور الطالب(ة) بنجاح: ${foundStudent.fullName}`;

      if (studentClass) {
        const parsed = parseClassSchedule(studentClass.schedule);
        if (parsed.startTime) {
          const now = new Date();
          const currentTotalMin = now.getHours() * 60 + now.getMinutes();
          const startTotalMin = parsed.startTime.hours * 60 + parsed.startTime.minutes;
          
          const delay = currentTotalMin - startTotalMin;
          if (delay >= 10) {
            finalStatus = "متأخر";
            note = `متأخر تلقائياً بـ ${delay} دقيقة (بدأت الحلقة في ${String(parsed.startTime.hours).padStart(2, '0')}:${String(parsed.startTime.minutes).padStart(2, '0')})`;
            alertMessage = `تم رصد حضور الطالب(ة) متأخراً: ${foundStudent.fullName} (متأخر بـ ${delay} دقيقة)`;
          } else {
            finalStatus = "حاضر";
            note = `حاضر في الوقت (بدأت الحلقة في ${String(parsed.startTime.hours).padStart(2, '0')}:${String(parsed.startTime.minutes).padStart(2, '0')})`;
            alertMessage = `تم رصد حضور الطالب(ة) في الوقت المحدد: ${foundStudent.fullName}`;
          }
        }
      }

      handleToggleAttendance(foundStudent.id, finalStatus, note);
      playBeep("success");

      setScanStatus({
        type: "success",
        message: alertMessage
      });

      addSysNotification(
        finalStatus === "متأخر" ? "حضور متأخر بالرمز 🕒" : "حضور سريع بالرمز 🟢",
        `تم تسجيل حضور الطالب ${foundStudent.fullName} تلقائياً (${finalStatus === "متأخر" ? "متأخر" : "حاضر"}) لمسح بطاقة هويته. ${note}`,
        finalStatus === "متأخر" ? "تنبيه" : "نجاح"
      );
    } else {
      playBeep("error");
      setScanStatus({
        type: "error",
        message: `عذراً، لم نتمكن من العثور على طالب بالمعرف: "${scannedText}"`
      });
    }
  };

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isScanning) {
      setScanStatus({ type: "info", message: "جاري تشغيل الكاميرا والمستشعر..." });
      
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("qr-scanner-viewport");
        qrScannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            handleScannedValue(decodedText);
          },
          () => {
            // Silence frame scan errors to prevent console spam
          }
        ).catch((err) => {
          console.error("Camera startup error:", err);
          playBeep("error");
          setScanStatus({
            type: "error",
            message: "فشل تشغيل الكاميرا. يرجى التحقق من منح صلاحيات الكاميرا للموقع والمحاولة مجدداً."
          });
          setIsScanning(false);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current) {
          if (qrScannerRef.current.isScanning) {
            qrScannerRef.current.stop().then(() => {
              qrScannerRef.current = null;
            }).catch(err => console.error("Failed to stop scanner on unmount:", err));
          } else {
            qrScannerRef.current = null;
          }
        }
      };
    } else {
      if (qrScannerRef.current) {
        if (qrScannerRef.current.isScanning) {
          qrScannerRef.current.stop().then(() => {
            qrScannerRef.current = null;
          }).catch(err => console.error("Failed to stop scanner:", err));
        } else {
          qrScannerRef.current = null;
        }
      }
    }
  }, [isScanning, students]);

  // Print A4 Monthly Attendance Report
  const handlePrintReport = () => {
    const reportElement = document.getElementById("printable-monthly-report");
    if (!reportElement) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    let stylesHtml = "";
    document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    const tailwindCdn = `<script src="https://cdn.tailwindcss.com"></script>`;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير حضور وغياب - ${selectedStudentForReport?.fullName || ""}</title>
          ${tailwindCdn}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white p-4">
          <div class="w-full">
            ${reportElement.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return {
    getConsecutiveAbsences,
    handleSendAbsenceWarning,
    handleToggleAttendance,
    playBeep,
    handleScannedValue,
    qrScannerRef,
    handlePrintReport,
  };
}
