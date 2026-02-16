"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRoutines, pinRoutine, deleteRoutine, generateRoutines,
  type RoutineCard, type RoutineStatus,
} from "@/lib/alfred";

const CATEGORY_STYLE: Record<string, { border: string; badge: string; icon: string }> = {
  world: {
    border: "border-blue-500/25 hover:border-blue-500/50",
    badge: "bg-blue-500/15 text-blue-300",
    icon: "🌍",
  },
  tech: {
    border: "border-violet-500/25 hover:border-violet-500/50",
    badge: "bg-violet-500/15 text-violet-300",
    icon: "🤖",
  },
  sport: {
    border: "border-orange-500/25 hover:border-orange-500/50",
    badge: "bg-orange-500/15 text-orange-300",
    icon: "🏔️",
  },
};

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `Expire dans ${h}h${m > 0 ? m + "m" : ""}`;
  return `Expire dans ${m}min`;
}

function Card({
  card,
  onPin,
  onDelete,
}: {
  card: RoutineCard;
  onPin: (id: number, pinned: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLE[card.category] ?? CATEGORY_STYLE.world;
  const expired = new Date(card.expires_at).getTime() < Date.now() && !card.pinned;

  return (
    <div
      className={`rounded-2xl border bg-gray-900 transition-all ${style.border} ${expired ? "opacity-50" : ""}`}
    >
      {/* Card header */}
      <button
        className="w-full text-left p-5"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5 shrink-0">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {card.category_label}
              </span>
              {card.pinned && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                  📌 Épinglé
                </span>
              )}
              {!card.pinned && (
                <span className="text-[10px] text-gray-600">{timeLeft(card.expires_at)}</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-100 text-sm leading-snug">{card.title}</h3>
            <p className={`text-xs text-gray-400 mt-1.5 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {card.summary}
            </p>
          </div>
          <span className="text-gray-600 shrink-0 ml-1 text-lg">{expanded ? "▴" : "▾"}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800/60 pt-4">
          {card.bullets.length > 0 && (
            <ul className="space-y-1.5">
              {card.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-gray-600 shrink-0 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {card.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.sources.map((s, i) => (
                <span key={i} className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onPin(card.id, !card.pinned)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                card.pinned
                  ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/10"
                  : "bg-gray-800 text-gray-400 hover:text-yellow-300"
              }`}
            >
              {card.pinned ? "📌 Désépingler" : "📌 Épingler"}
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="text-xs text-red-500/60 hover:text-red-400 px-3 py-1.5 transition-colors"
            >
              Supprimer
            </button>
            <span className="ml-auto text-[10px] text-gray-700">
              {new Date(card.created_at).toLocaleString("fr-FR", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RoutineStatus }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
      status.generated
        ? "bg-green-500/10 border-green-500/20 text-green-400"
        : "bg-gray-800 border-gray-700 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.generated ? "bg-green-400" : "bg-gray-600"}`} />
      {status.label}
    </div>
  );
}

export default function AlfredRoutinesPage() {
  const [cards, setCards] = useState<RoutineCard[]>([]);
  const [statuses, setStatuses] = useState<RoutineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(() => {
    getRoutines()
      .then((r) => { setCards(r.cards); setStatuses(r.status); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePin = async (id: number, pinned: boolean) => {
    await pinRoutine(id, pinned).catch(console.error);
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteRoutine(id).catch(console.error);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await generateRoutines().catch(console.error);
    setTimeout(() => { setGenerating(false); load(); }, 5000);
  };

  const categories = ["world", "tech", "sport"];
  const filtered = filter === "all" ? cards : cards.filter((c) => c.category === filter);
  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routines</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Briefings quotidiens — renouvelés à 6h00 · Expire 24h après génération
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); load(); }}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg border border-gray-800 transition-colors"
          >
            ↻
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {generating ? "Génération..." : "⚡ Générer maintenant"}
          </button>
        </div>
      </div>

      {/* Generation status */}
      {statuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => <StatusBadge key={s.category} status={s} />)}
          <span className="text-xs text-gray-600 self-center ml-1">— génération 06:00/06:05/06:10</span>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === cat
                ? "bg-gray-700 border-gray-600 text-gray-100"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            {cat === "all" ? "Tout" : (CATEGORY_STYLE[cat]?.icon ?? "") + " " + (statuses.find(s => s.category === cat)?.label ?? cat)}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Chargement...</p>}

      {generating && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-300">
          ⚡ Génération en cours... Les cards apparaîtront dans 3-5 minutes.
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-500 text-sm">Aucune routine disponible.</p>
          <p className="text-gray-600 text-xs mt-1">
            Les routines sont générées automatiquement chaque matin à 06:00.<br />
            Cliquez sur "Générer maintenant" pour une génération immédiate.
          </p>
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-yellow-400/70 uppercase tracking-widest">Épinglés</h2>
          {pinned.map((c) => (
            <Card key={c.id} card={c} onPin={handlePin} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Main grid */}
      {unpinned.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Aujourd'hui</h2>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {unpinned.map((c) => (
              <Card key={c.id} card={c} onPin={handlePin} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
