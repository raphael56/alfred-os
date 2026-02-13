"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Metric {
  id: string;
  category: string;
  key: string;
  value: any;
  recorded_at: string;
}

interface Props {
  metrics: Metric[];
  title: string;
  category: string;
  metricKey: string;
  color?: string;
}

export default function MetricsChart({ metrics, title, category, metricKey, color = "#3b82f6" }: Props) {
  const filtered = metrics
    .filter((m) => m.category === category && m.key === metricKey)
    .reverse()
    .map((m) => ({
      time: new Date(m.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      value: typeof m.value === "number" ? m.value : typeof m.value === "object" && m.value !== null ? m.value.value ?? 0 : Number(m.value) || 0,
    }));

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
        <p className="text-gray-600 text-sm">No data for {category}/{metricKey}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={filtered}>
          <defs>
            <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color }}
          />
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${metricKey})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
