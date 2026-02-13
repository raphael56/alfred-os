"use client";

import { useEffect, useState, useCallback } from "react";

interface SystemSnapshot {
  cpu_load?: number;
  memory?: { used_pct: number; total_gb: number; used_gb: number };
  disk?: { used_pct: number; total_gb: number; used_gb: number };
}

function GaugeBar({ label, value, max, unit, detail, color }: {
  label: string; value: number; max: number; unit: string; detail?: string; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-gray-400">{detail}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-gray-500 mt-0.5">{value}{unit}</div>
    </div>
  );
}

export default function SystemMetrics() {
  const [data, setData] = useState<SystemSnapshot | null>(null);
  const [history, setHistory] = useState<{ cpu: number; mem: number; time: string }[]>([]);

  const collect = useCallback(() => {
    fetch("/api/metrics/system", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.metrics) {
          setData(d.metrics);
          setHistory((prev) => {
            const next = [...prev, {
              cpu: d.metrics.cpu_load ?? 0,
              mem: d.metrics.memory?.used_pct ?? 0,
              time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            }];
            return next.slice(-20);
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    collect();
    const interval = setInterval(collect, 60000);
    return () => clearInterval(interval);
  }, [collect]);

  if (!data) return null;

  const cpuColor = (data.cpu_load ?? 0) > 4 ? "bg-red-500" : (data.cpu_load ?? 0) > 2 ? "bg-yellow-500" : "bg-green-500";
  const memColor = (data.memory?.used_pct ?? 0) > 80 ? "bg-red-500" : (data.memory?.used_pct ?? 0) > 60 ? "bg-yellow-500" : "bg-blue-500";
  const diskColor = (data.disk?.used_pct ?? 0) > 80 ? "bg-red-500" : (data.disk?.used_pct ?? 0) > 60 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">System Health</h2>
      <div className="space-y-4">
        <GaugeBar
          label="CPU Load"
          value={Math.round((data.cpu_load ?? 0) * 100) / 100}
          max={8}
          unit=""
          detail="load avg 1m"
          color={cpuColor}
        />
        <GaugeBar
          label="Memory"
          value={data.memory?.used_pct ?? 0}
          max={100}
          unit="%"
          detail={`${data.memory?.used_gb ?? 0}/${data.memory?.total_gb ?? 0} GB`}
          color={memColor}
        />
        <GaugeBar
          label="Disk"
          value={data.disk?.used_pct ?? 0}
          max={100}
          unit="%"
          detail={`${data.disk?.used_gb ?? 0}/${data.disk?.total_gb ?? 0} GB`}
          color={diskColor}
        />
      </div>
      {history.length > 1 && (
        <div className="mt-4 flex items-end gap-[2px] h-12">
          {history.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-[1px]" title={`${h.time}: CPU ${h.cpu} | Mem ${h.mem}%`}>
              <div className="w-full bg-green-500/60 rounded-t" style={{ height: `${Math.min((h.cpu / 8) * 100, 100)}%` }} />
              <div className="w-full bg-blue-500/60 rounded-b" style={{ height: `${Math.min(h.mem, 100)}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
