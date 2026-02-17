"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHaStates, getHaDomain, callHaService, refreshHaStates,
  type HaDomainSummary, type HaEntity,
} from "@/lib/alfred";

const DOMAIN_CONFIG: Record<string, { label: string; emoji: string; color: string; toggleable: boolean }> = {
  light:         { label: "Lumières",      emoji: "💡", color: "yellow",  toggleable: true },
  switch:        { label: "Interrupteurs", emoji: "🔌", color: "blue",    toggleable: true },
  cover:         { label: "Volets",        emoji: "🪟", color: "cyan",    toggleable: true },
  climate:       { label: "Climatisation", emoji: "🌡️", color: "orange",  toggleable: false },
  sensor:        { label: "Capteurs",      emoji: "📊", color: "green",   toggleable: false },
  binary_sensor: { label: "Détecteurs",   emoji: "🔍", color: "purple",  toggleable: false },
  media_player:  { label: "Médias",       emoji: "🎵", color: "pink",    toggleable: true },
  automation:    { label: "Automations",   emoji: "⚡", color: "indigo",  toggleable: true },
};

const COLOR_CLASSES: Record<string, string> = {
  yellow:  "border-yellow-500/30 bg-yellow-500/5",
  blue:    "border-blue-500/30 bg-blue-500/5",
  cyan:    "border-cyan-500/30 bg-cyan-500/5",
  orange:  "border-orange-500/30 bg-orange-500/5",
  green:   "border-green-500/30 bg-green-500/5",
  purple:  "border-purple-500/30 bg-purple-500/5",
  pink:    "border-pink-500/30 bg-pink-500/5",
  indigo:  "border-indigo-500/30 bg-indigo-500/5",
};

const ACTIVE_STATES = new Set(["on", "open", "playing", "heating", "cooling", "auto"]);

function stateBadge(state: string) {
  const isActive = ACTIVE_STATES.has(state);
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
      isActive ? "bg-green-500/20 text-green-400" : "bg-gray-700/50 text-gray-500"
    }`}>
      {state}
    </span>
  );
}

function getAttrLabel(entity: HaEntity): string {
  const a = entity.attributes;
  const parts: string[] = [];
  if (a.temperature !== undefined) parts.push(`${a.temperature}°C`);
  if (a.humidity !== undefined) parts.push(`${a.humidity}%`);
  if (a.brightness !== undefined) parts.push(`${Math.round((Number(a.brightness) / 255) * 100)}%`);
  if (a.current_position !== undefined) parts.push(`pos:${a.current_position}%`);
  if (a.volume_level !== undefined) parts.push(`vol:${Math.round(Number(a.volume_level) * 100)}%`);
  return parts.join(" · ");
}

function getToggleService(domain: string, currentState: string): { service: string } | null {
  if (domain === "light" || domain === "switch" || domain === "automation") {
    return { service: currentState === "on" ? "turn_off" : "turn_on" };
  }
  if (domain === "cover") {
    return { service: currentState === "open" ? "close_cover" : "open_cover" };
  }
  if (domain === "media_player") {
    return { service: currentState === "playing" ? "media_pause" : "media_play" };
  }
  return null;
}

interface DomainPanelProps {
  summary: HaDomainSummary;
  onToggle: (entity: HaEntity) => Promise<void>;
}

function DomainPanel({ summary, onToggle }: DomainPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [entities, setEntities] = useState<HaEntity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const cfg = DOMAIN_CONFIG[summary.domain] ?? { label: summary.domain, emoji: "•", color: "blue", toggleable: false };

  const load = async () => {
    if (entities) { setExpanded((v) => !v); return; }
    setExpanded(true);
    setLoading(true);
    try {
      const data = await getHaDomain(summary.domain);
      setEntities(data.entities);
    } catch { setEntities([]); }
    finally { setLoading(false); }
  };

  const handleToggle = async (entity: HaEntity) => {
    setToggling(entity.entity_id);
    try {
      await onToggle(entity);
      // Refresh domain
      const data = await getHaDomain(summary.domain);
      setEntities(data.entities);
    } finally { setToggling(null); }
  };

  return (
    <div className={`rounded-xl border ${COLOR_CLASSES[cfg.color] ?? COLOR_CLASSES.blue} overflow-hidden`}>
      <button
        onClick={load}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{cfg.emoji}</span>
          <div>
            <div className="font-medium text-sm text-gray-200">{cfg.label}</div>
            <div className="text-xs text-gray-500">{summary.total} entités</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary.active > 0 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              {summary.active} actif{summary.active > 1 ? "s" : ""}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 divide-y divide-white/5 max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500 text-sm">Chargement…</div>
          )}
          {entities?.map((entity) => {
            const isActive = ACTIVE_STATES.has(entity.state);
            const toggleSvc = cfg.toggleable ? getToggleService(summary.domain, entity.state) : null;
            const attrLabel = getAttrLabel(entity);
            return (
              <div key={entity.entity_id} className="flex items-center gap-3 px-4 py-2.5">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-green-400" : "bg-gray-600"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{entity.name}</div>
                  {attrLabel && <div className="text-xs text-gray-500">{attrLabel}</div>}
                </div>
                {stateBadge(entity.state)}
                {toggleSvc && (
                  <button
                    onClick={() => handleToggle(entity)}
                    disabled={toggling === entity.entity_id}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 ${
                      isActive
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-white/10 hover:bg-white/20 text-gray-300"
                    } disabled:opacity-40`}
                  >
                    {toggling === entity.entity_id ? "…" : isActive ? "Éteindre" : "Allumer"}
                  </button>
                )}
              </div>
            );
          })}
          {entities?.length === 0 && (
            <div className="p-4 text-center text-gray-600 text-sm">Aucune entité</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeAssistantPage() {
  const [summary, setSummary] = useState<HaDomainSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getHaStates();
      setSummary(data.summary);
      setTotal(data.total);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshHaStates(); await load(); } finally { setRefreshing(false); }
  };

  const handleToggle = async (entity: HaEntity) => {
    const domain = entity.entity_id.split(".")[0]!;
    const svc = getToggleService(domain, entity.state);
    if (!svc) return;
    await callHaService(domain, svc.service, entity.entity_id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            🏠 Home Assistant
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? "Chargement…" : `${total} entités · raspberrypi`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="text-center text-gray-500 py-12 text-sm">Connexion à Home Assistant…</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.map((s) => (
          <DomainPanel key={s.domain} summary={s} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
