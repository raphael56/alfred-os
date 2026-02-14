"use client";

import { useEffect, useState } from "react";

interface AlertSettings {
  cpu_load_max: number;
  memory_pct_max: number;
  disk_pct_max: number;
  sleep_hours_min: number;
  anaerobic_max: number;
}

interface SyncSettings {
  garmin_interval_min: number;
  system_interval_min: number;
}

export default function SettingsPage() {
  const [alerts, setAlerts] = useState<AlertSettings>({
    cpu_load_max: 4, memory_pct_max: 80, disk_pct_max: 85, sleep_hours_min: 6, anaerobic_max: 200
  });
  const [sync, setSync] = useState<SyncSettings>({ garmin_interval_min: 30, system_interval_min: 5 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.alerts) setAlerts(d.alerts);
      if (d.sync) setSync(d.sync);
    }).catch(() => {});
  }, []);

  const save = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alerts, sync }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-right focus:outline-none focus:border-blue-500" />
        {unit && <span className="text-xs text-gray-500 w-8">{unit}</span>}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Alfred OS Configuration</p>
        </div>
        <a href="/" className="text-sm text-blue-400 hover:text-blue-300">Back to Dashboard</a>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-yellow-400 uppercase tracking-wider mb-4">Alert Thresholds</h2>
          <div className="divide-y divide-gray-800">
            <Field label="CPU load max" value={alerts.cpu_load_max} onChange={v => setAlerts({...alerts, cpu_load_max: v})} />
            <Field label="Memory usage max" value={alerts.memory_pct_max} onChange={v => setAlerts({...alerts, memory_pct_max: v})} unit="%" />
            <Field label="Disk usage max" value={alerts.disk_pct_max} onChange={v => setAlerts({...alerts, disk_pct_max: v})} unit="%" />
            <Field label="Sleep minimum" value={alerts.sleep_hours_min} onChange={v => setAlerts({...alerts, sleep_hours_min: v})} unit="h" />
            <Field label="Anaerobic load max" value={alerts.anaerobic_max} onChange={v => setAlerts({...alerts, anaerobic_max: v})} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-4">Sync Intervals</h2>
          <div className="divide-y divide-gray-800">
            <Field label="Garmin sync interval" value={sync.garmin_interval_min} onChange={v => setSync({...sync, garmin_interval_min: v})} unit="min" />
            <Field label="System metrics interval" value={sync.system_interval_min} onChange={v => setSync({...sync, system_interval_min: v})} unit="min" />
          </div>
        </div>

        <button onClick={save}
          className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${
            saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}>
          {saved ? "Saved" : "Save Settings"}
        </button>
      </div>
    </main>
  );
}
