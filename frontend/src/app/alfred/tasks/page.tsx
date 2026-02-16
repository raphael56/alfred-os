"use client";

import { useEffect, useState } from "react";
import { getTasks, type AlfredTask } from "@/lib/alfred";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-400",
  running: "bg-yellow-500/20 text-yellow-400 animate-pulse",
  done: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function AlfredTasksPage() {
  const [tasks, setTasks] = useState<AlfredTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const shown = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tâches autonomes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tasks.length} tâche{tasks.length !== 1 ? "s" : ""} au total</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
        >
          {["all", "pending", "running", "done", "failed"].map((s) => (
            <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500 text-sm">Chargement...</p>}

      <div className="space-y-3">
        {shown.length === 0 && !loading && (
          <p className="text-gray-600 text-sm">Aucune tâche.</p>
        )}
        {shown.map((t) => (
          <div key={t.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_STYLE[t.status] ?? STATUS_STYLE.pending}`}>
                {t.status}
              </span>
              <p className="text-sm text-gray-200 flex-1">{t.description}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Planifié: {fmt(t.scheduled_at)}</span>
              {t.started_at && <span>Démarré: {fmt(t.started_at)}</span>}
              {t.finished_at && <span>Terminé: {fmt(t.finished_at)}</span>}
            </div>
            {t.result && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">Rapport</summary>
                <pre className="mt-2 bg-gray-800 rounded-lg p-3 text-gray-300 whitespace-pre-wrap overflow-auto max-h-48">{t.result}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
