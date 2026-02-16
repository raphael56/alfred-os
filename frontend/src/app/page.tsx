"use client";

import { useEffect, useState, useCallback } from "react";
import SummaryCard from "@/components/SummaryCard";
import { useHealth } from "@/hooks/useHealth";
import { useTasks } from "@/hooks/useTasks";
import { useAlerts } from "@/hooks/useAlerts";

interface GarminSnapshot {
  vo2max?: number;
  resting_hr?: number;
  sleep_hours?: number;
  weekly_km?: number;
}

export default function Home() {
  const { health } = useHealth();
  const { tasks } = useTasks();
  const { alerts } = useAlerts();
  const [garmin, setGarmin] = useState<GarminSnapshot | null>(null);
  const [metricCount, setMetricCount] = useState(0);

  useEffect(() => {
    fetch("/api/garmin/latest").then(r => r.json()).then(setGarmin).catch(() => {});
    fetch("/api/metrics").then(r => r.json()).then((d: any[]) => setMetricCount(d.length)).catch(() => {});
  }, []);

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${health === "operational" ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-red-500 shadow-lg shadow-red-500/50"}`} />
          <span className="text-xs text-gray-400">{health}</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-lg px-4 py-2 text-sm flex items-center gap-2 ${
              a.level === "critical" ? "bg-red-500/20 border border-red-500/30 text-red-400" :
              a.level === "warning" ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400" :
              "bg-blue-500/20 border border-blue-500/30 text-blue-400"
            }`}>
              <span className="font-medium">{a.category}</span>
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          href="/tasks"
          title="Tasks"
          value={`${taskPct}%`}
          subtitle={`${doneTasks}/${tasks.length} done`}
          color="border-green-500/30 hover:border-green-500/50"
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          href="/sport"
          title="VO2max"
          value={garmin?.vo2max ?? "—"}
          subtitle="ml/kg/min"
          color="border-emerald-500/30 hover:border-emerald-500/50"
          icon={
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
            </svg>
          }
        />
        <SummaryCard
          href="/sport"
          title="Resting HR"
          value={garmin?.resting_hr ?? "—"}
          subtitle="bpm"
          color="border-red-500/30 hover:border-red-500/50"
          icon={
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
        />
        <SummaryCard
          href="/system"
          title="Metrics"
          value={metricCount}
          subtitle="total recorded"
          color="border-blue-500/30 hover:border-blue-500/50"
          icon={
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          }
        />
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Recent Tasks</h2>
            <a href="/tasks" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all</a>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-gray-600 text-sm">No tasks yet.</p>}
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg bg-gray-800/50 px-4 py-2.5">
                <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  t.status === "done" ? "bg-green-500/20 text-green-400" :
                  t.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {t.status === "done" ? "\u2713" : t.status === "in_progress" ? "\u25B6" : "\u25CB"}
                </span>
                <span className={`text-sm flex-1 truncate ${t.status === "done" ? "line-through text-gray-500" : ""}`}>
                  {t.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sport snapshot */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Sport Snapshot</h2>
            <a href="/sport" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">View all</a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "VO2max", value: garmin?.vo2max, unit: "ml/kg/min", color: "text-emerald-400" },
              { label: "Resting HR", value: garmin?.resting_hr, unit: "bpm", color: "text-red-400" },
              { label: "Sleep", value: garmin?.sleep_hours ? Math.round(garmin.sleep_hours * 10) / 10 : null, unit: "hours", color: "text-purple-400" },
              { label: "Weekly km", value: garmin?.weekly_km ? Math.round(garmin.weekly_km * 10) / 10 : null, unit: "km", color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-gray-800 p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value ?? "—"}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
