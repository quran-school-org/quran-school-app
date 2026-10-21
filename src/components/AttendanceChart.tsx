import React, { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Student, Class, Attendance } from "../types";
import { Filter, TrendingUp, TrendingDown, BarChart3, LineChart } from "lucide-react";

interface AttendanceChartProps {
  students: Student[];
  classes: Class[];
  attendance: Attendance[];
}

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getWeekDays = (baseSaturday: Date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseSaturday);
    d.setDate(baseSaturday.getDate() + i);
    days.push(formatDateStr(d));
  }
  return days;
};

const ARABIC_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export default function AttendanceChart({ students, classes, attendance }: AttendanceChartProps) {
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // Determine current Saturday and last Saturday dynamically
  const { thisWeekDates, lastWeekDates } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Offset to Saturday (Saturday = 0, Sunday = 1, ..., Friday = 6)
    const offset = (dayOfWeek + 1) % 7;
    const currentSaturday = new Date(today);
    currentSaturday.setDate(today.getDate() - offset);

    const lastSaturday = new Date(currentSaturday);
    lastSaturday.setDate(currentSaturday.getDate() - 7);

    return {
      thisWeekDates: getWeekDays(currentSaturday),
      lastWeekDates: getWeekDays(lastSaturday),
    };
  }, []);

  // Filter students based on chosen Class ID
  const targetStudents = useMemo(() => {
    if (filterClassId === "all") {
      return students;
    }
    return students.filter((s) => s.classId === filterClassId);
  }, [filterClassId, students]);

  // Calculate day attendance rates
  const calculateDayRate = (dateStr: string, studentsList: Student[]) => {
    const studentIds = new Set(studentsList.map((s) => s.id));
    if (studentIds.size === 0) return 0;

    const records = attendance.filter((a) => a.date === dateStr && studentIds.has(a.studentId));
    if (records.length === 0) return 0;

    const presentCount = records.filter((r) => r.status === "حاضر" || r.status === "متأخر").length;
    return Math.round((presentCount / records.length) * 100);
  };

  // Compile Chart Data
  const { chartData, thisWeekAvg, lastWeekAvg, trendDiff } = useMemo(() => {
    const data = ARABIC_DAYS.map((dayName, i) => {
      const thisWeekDate = thisWeekDates[i];
      const lastWeekDate = lastWeekDates[i];

      const thisWeekRate = calculateDayRate(thisWeekDate, targetStudents);
      const lastWeekRate = calculateDayRate(lastWeekDate, targetStudents);

      return {
        name: dayName,
        "الأسبوع الحالي": thisWeekRate,
        "الأسبوع الماضي": lastWeekRate,
        thisWeekDateFormatted: thisWeekDate,
        lastWeekDateFormatted: lastWeekDate,
      };
    });

    // Calculate Averages (only count days where there is at least some attendance records to avoid skewing)
    const getRecordedDaysAvg = (dates: string[]) => {
      const rates = dates.map((date) => {
        const studentIds = new Set(targetStudents.map((s) => s.id));
        if (studentIds.size === 0) return null;
        const records = attendance.filter((a) => a.date === date && studentIds.has(a.studentId));
        if (records.length === 0) return null;
        const presentCount = records.filter((r) => r.status === "حاضر" || r.status === "متأخر").length;
        return (presentCount / records.length) * 100;
      }).filter((r): r is number => r !== null);

      if (rates.length === 0) return 0;
      return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    };

    const thisWeekAverage = getRecordedDaysAvg(thisWeekDates);
    const lastWeekAverage = getRecordedDaysAvg(lastWeekDates);

    return {
      chartData: data,
      thisWeekAvg: thisWeekAverage,
      lastWeekAvg: lastWeekAverage,
      trendDiff: thisWeekAverage - lastWeekAverage,
    };
  }, [targetStudents, attendance, thisWeekDates, lastWeekDates]);

  const activeClassName = useMemo(() => {
    if (filterClassId === "all") return "جميع الحلقات";
    return classes.find((c) => c.id === filterClassId)?.name || "الحلقة المحددة";
  }, [filterClassId, classes]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6" id="attendance-chart-widget">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            📊 كشف ومقارنة معدلات حضور الطلاب
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            مقارنة نسبة الحضور اليومية للأسبوع الحالي مع الأسبوع المنصرم
          </p>
        </div>

        {/* Filters and Toggle buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الحلقات</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border">
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === "area" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
              title="رسم بياني مساحي"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === "bar" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
              title="رسم بياني شريطي"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* This Week Average */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-800 font-bold">متوسط الحضور هذا الأسبوع</p>
            <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{thisWeekAvg}%</p>
          </div>
          <span className="text-lg">📈</span>
        </div>

        {/* Last Week Average */}
        <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-bold">متوسط حضور الأسبوع الماضي</p>
            <p className="text-xl font-extrabold text-slate-700 mt-0.5">{lastWeekAvg}%</p>
          </div>
          <span className="text-lg">📉</span>
        </div>

        {/* Growth Rate / Trend */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          trendDiff >= 0 
            ? "bg-teal-50 border-teal-100 text-teal-950" 
            : "bg-rose-50 border-rose-100 text-rose-950"
        }`}>
          <div>
            <p className="text-[10px] font-bold">مستوى التطور والالتزام</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold">
                {trendDiff >= 0 ? `+${trendDiff}%` : `${trendDiff}%`}
              </span>
              {trendDiff >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </div>
          </div>
          <span className="text-xs bg-white/80 px-2 py-1 rounded-lg font-bold border shadow-xs">
            {trendDiff >= 0 ? "تحسن ملحوظ" : "يحتاج تواصل"}
          </span>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                stroke="#cbd5e1"
              />
              <YAxis 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{ 
                  direction: 'rtl', 
                  textAlign: 'right', 
                  borderRadius: '12px', 
                  borderColor: '#cbd5e1',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: any) => [`${value}%`, '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="الأسبوع الحالي" 
                stroke="#059669" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorThisWeek)" 
              />
              <Area 
                type="monotone" 
                dataKey="الأسبوع الماضي" 
                stroke="#64748b" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorLastWeek)" 
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                stroke="#cbd5e1"
              />
              <YAxis 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{ 
                  direction: 'rtl', 
                  textAlign: 'right', 
                  borderRadius: '12px', 
                  borderColor: '#cbd5e1',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: any) => [`${value}%`, '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="الأسبوع الحالي" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="الأسبوع الماضي" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3 text-xs text-slate-600">
        <span className="text-base">💡</span>
        <p>
          يتم حساب المعدلات بناءً على نسبة الحضور والغياب المسجلة يومياً للطلاب المنتمين لحلقة <strong className="text-emerald-800">{activeClassName}</strong>.
        </p>
      </div>

    </div>
  );
}
