"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMetrics } from "@/hooks/useMetrics";

const SystemMetrics = dynamic(() => import("@/components/SystemMetrics"), { ssr: false });
const MetricsChart = dynamic(() => import("@/components/MetricsChart"), { ssr: false });

export default function SystemPage() {
  const { metrics, addMetric } = useMetrics();
  const [tables, setTables] = useState<string[]>([]);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [metricForm, setMetricForm] = useState({ category: "", key: "", value: "" });

  useEffect(() => {
    fetch("/api/sys/schema").then(r => r.json()).then(d => setTables(d.tables || [])).catch(() => {});
  }, []);

  const handleAddMetric = async () => {
    if (!metricForm.category || !metricForm.key || !metricForm.value) return;
    let val: any = metricForm.value;
    try { val = JSON.parse(val); } catch { val = isNaN(Number(val)) ? val : Number(val); }
    await addMetric(metricForm.category, metricForm.key, val);
    setMetricForm({ category: "", key: "", value: "" });
    setShowMetricForm(false);
  };

  const uniqueCharts = metrics.reduce<{ category: string; key: string }[]>((acc, m) => {
    if (!acc.find((a) => a.category === m.category && a.key === m.key)) {
      acc.push({ category: m.category, key: m.key });
    }
    return acc;
  }, []);

  const chartColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System</h1>
        <p className="text-gray-500 text-sm mt-0.5">Infrastructure metrics & database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System Health Gauges */}
        <SystemMetrics />

        {/* Metrics Charts */}
        {uniqueCharts.map((c, i) => (
          <MetricsChart
            key={`${c.category}-${c.key}`}
            metrics={metrics}
            title={`${c.category} / ${c.key}`}
            category={c.category}
            metricKey={c.key}
            color={chartColors[i % chartColors.length]}
          />
        ))}

        {/* Latest Metrics */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Latest Metrics</h2>
            <button onClick={() => setShowMetricForm(!showMetricForm)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              {showMetricForm ? "Cancel" : "+ Add"}
            </button>
          </div>
          {showMetricForm && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                placeholder="category" value={metricForm.category}
                onChange={(e) => setMetricForm({ ...metricForm, category: e.target.value })} />
              <input className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                placeholder="key" value={metricForm.key}
                onChange={(e) => setMetricForm({ ...metricForm, key: e.target.value })} />
              <div className="flex gap-1">
                <input className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="value" value={metricForm.value}
                  onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMetric()} />
                <button onClick={handleAddMetric} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-2 py-1 text-xs font-medium transition-colors">OK</button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.length === 0 && <p className="text-gray-600 text-sm">No metrics recorded.</p>}
            {metrics.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{m.category}</span>
                  <span className="text-sm">{m.key}</span>
                </div>
                <span className="text-sm font-mono font-bold">{typeof m.value === "number" ? m.value : JSON.stringify(m.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Schema */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Database</h2>
          <div className="space-y-2">
            {tables.map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-4 py-2">
                <span className="text-blue-400 text-xs font-mono bg-blue-400/10 px-2 py-0.5 rounded">TABLE</span>
                <span className="text-sm font-mono">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
