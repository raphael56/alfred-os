"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HistoryPoint {
  value: any;
  time: string;
}

const SPORT_METRICS = [
  { key: "vo2max", label: "VO2max", color: "#10b981", unit: "ml/kg/min" },
  { key: "resting_hr", label: "Resting HR", color: "#ef4444", unit: "bpm" },
  { key: "sleep_hours", label: "Sleep", color: "#8b5cf6", unit: "h" },
  { key: "weekly_km", label: "Weekly km", color: "#f59e0b", unit: "km" },
];

export default function SportHistory() {
  const [selected, setSelected] = useState("vo2max");
  const [data, setData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    fetch(`/api/metrics/history?category=sport&key=${selected}&days=30`)
      .then(r => r.json())
      .then(d => {
        const pts = (d.data || []).map((p: HistoryPoint) => {
          const val = typeof p.value === "number" ? p.value : typeof p.value === "object" ? null : Number(p.value);
          return {
            date: new Date(p.time).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
            value: val,
          };
        }).filter((p: any) => p.value !== null);
        setData(pts);
      })
      .catch(() => setData([]));
  }, [selected]);

  const metric = SPORT_METRICS.find(m => m.key === selected) || SPORT_METRICS[0];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Sport History (30d)</h2>
        <div className="flex gap-1">
          {SPORT_METRICS.map(m => (
            <button key={m.key} onClick={() => setSelected(m.key)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                selected === m.key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              style={selected === m.key ? { backgroundColor: m.color + "33" , color: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {data.length > 1 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${selected}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "#9ca3af" }} />
            <Area type="monotone" dataKey="value" stroke={metric.color} fill={`url(#grad-${selected})`} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-600 text-sm text-center py-8">Not enough data for {metric.label} history.</p>
      )}
    </div>
  );
}
