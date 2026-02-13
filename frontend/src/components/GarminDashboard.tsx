"use client";

import { useEffect, useState, useCallback } from "react";

interface GarminData {
  heart_rate?: { resting?: number; max?: number; zones?: any };
  sleep?: { duration?: number; score?: number; deep?: number; light?: number; rem?: number; awake?: number };
  fitness?: { vo2max?: number; fitnessAge?: number };
  training_load?: { aerobicLow?: number; aerobicHigh?: number; anaerobic?: number; total?: number };
  weekly_summary?: { km?: number; target?: number; runs?: number; time?: number };
  running_stats?: any;
  body_composition?: { weight?: number; bmi?: number; bodyFat?: number; muscleMass?: number };
  resting_hr?: number;
  vo2max?: number;
  weekly_km?: number;
  sleep_hours?: number;
  race?: { name?: string; date?: string; distance?: string; daysUntil?: number };
  activities?: Array<{
    name: string;
    type: string;
    date: string;
    distance: number;
    duration: number;
    avgHR?: number;
    avgPace?: string;
    calories: number;
    elevation?: number;
  }>;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ProgressRing({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" className="text-gray-800" strokeWidth="6" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="text-center -mt-[62px] mb-4">
        <div className="text-lg font-bold">{value}</div>
        <div className="text-[10px] text-gray-500">{unit}</div>
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

export default function GarminDashboard() {
  const [data, setData] = useState<GarminData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch("/api/garmin/latest").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const resp = await fetch("/api/sync/garmin/refresh", { method: "POST" });
      const result = await resp.json();
      if (result.status === "refreshed") {
        setLastSync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        loadData();
      }
    } catch {}
    setSyncing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!data) return null;

  const race = data.race;
  const raceDays = race?.date ? daysUntil(race.date) : null;
  const weeklyKm = data.weekly_km ?? data.weekly_summary?.km ?? 0;
  const weeklyTarget = data.weekly_summary?.target ?? 60;
  const vo2 = data.vo2max ?? data.fitness?.vo2max ?? 0;
  const restHr = data.resting_hr ?? data.heart_rate?.resting ?? 0;
  const sleepH = data.sleep_hours ?? data.sleep?.duration ?? 0;
  const activities = data.activities ?? [];

  return (
    <>
      {/* Race Countdown + Sync Button */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-gray-900 p-6 md:col-span-2 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div>
            {race && raceDays !== null && raceDays > 0 ? (
              <>
                <h2 className="text-sm font-medium text-orange-400 uppercase tracking-wider mb-1">Next Race</h2>
                <div className="text-2xl font-bold">{race.name}</div>
                <div className="text-sm text-gray-400 mt-1">{race.distance} &middot; {race.date}</div>
              </>
            ) : (
              <h2 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Garmin Sport</h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            {race && raceDays !== null && raceDays > 0 && (
              <div className="text-right">
                <div className="text-5xl font-black text-orange-400">{raceDays}</div>
                <div className="text-sm text-gray-400">days to go</div>
              </div>
            )}
            <button
              onClick={triggerSync}
              disabled={syncing}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                syncing
                  ? "bg-orange-500/20 text-orange-300 cursor-wait"
                  : "bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50"
              }`}
            >
              <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync Garmin"}
            </button>
          </div>
        </div>
        {lastSync && (
          <div className="text-xs text-gray-500 mt-2 text-right">Last sync: {lastSync}</div>
        )}
      </div>

      {/* Key Fitness Metrics */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Fitness Snapshot</h2>
        <div className="grid grid-cols-2 gap-4">
          <ProgressRing value={Math.round(weeklyKm * 10) / 10} max={weeklyTarget} label="Weekly km" unit={`/ ${weeklyTarget}`} color="#f59e0b" />
          <ProgressRing value={vo2} max={65} label="VO2max" unit="ml/kg/min" color="#10b981" />
          <ProgressRing value={restHr} max={80} label="Resting HR" unit="bpm" color="#ef4444" />
          <ProgressRing value={Math.round(sleepH * 10) / 10} max={8} label="Sleep" unit="hours" color="#8b5cf6" />
        </div>
      </div>

      {/* Training Load */}
      {data.training_load && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Training Load</h2>
          <div className="space-y-3">
            {[
              { label: "Aerobic Low", value: data.training_load.aerobicLow, color: "bg-blue-500", max: 2000 },
              { label: "Aerobic High", value: data.training_load.aerobicHigh, color: "bg-orange-500", max: 2000 },
              { label: "Anaerobic", value: data.training_load.anaerobic, color: "bg-red-500", max: 500 },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{bar.label}</span>
                  <span className="font-mono">{bar.value ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div className={`h-full rounded-full ${bar.color} transition-all duration-1000`}
                    style={{ width: `${Math.min(((bar.value ?? 0) / bar.max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Composition */}
      {data.body_composition && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Body</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Weight", value: data.body_composition.weight, unit: "kg" },
              { label: "BMI", value: data.body_composition.bmi, unit: "" },
              { label: "Body Fat", value: data.body_composition.bodyFat, unit: "%" },
              { label: "Muscle", value: data.body_composition.muscleMass, unit: "kg" },
            ].filter(s => s.value != null).map((s) => (
              <div key={s.label} className="rounded-lg bg-gray-800 p-3 text-center">
                <div className="text-xl font-bold">{s.value}{s.unit && <span className="text-xs text-gray-500 ml-0.5">{s.unit}</span>}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-2">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Recent Activities</h2>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {activities.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-800/50 px-4 py-3">
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  a.type === "running" ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"
                }`}>
                  {a.type === "running" ? "R" : a.type?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.date}</div>
                </div>
                {a.distance > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold">{a.distance.toFixed(1)} km</div>
                    {a.avgPace && <div className="text-xs text-gray-500">{a.avgPace} /km</div>}
                  </div>
                )}
                <div className="text-right">
                  <div className="text-sm font-mono">{a.duration} min</div>
                  {a.avgHR && <div className="text-xs text-gray-500">{a.avgHR} bpm</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
