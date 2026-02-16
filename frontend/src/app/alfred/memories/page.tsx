"use client";

import { useEffect, useState } from "react";
import { getMemories, forgetMemory, type AlfredMemory } from "@/lib/alfred";

const SOURCE_STYLE: Record<string, string> = {
  user: "bg-blue-500/20 text-blue-400",
  auto: "bg-green-500/20 text-green-400",
  openclaw: "bg-orange-500/20 text-orange-400",
};

export default function AlfredMemoriesPage() {
  const [memories, setMemories] = useState<AlfredMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = (limit = 100) => {
    getMemories(limit)
      .then(setMemories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleForget = async (key: string) => {
    if (!confirm(`Oublier "${key}" ?`)) return;
    try {
      await forgetMemory(key);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = search
    ? memories.filter(
        (m) =>
          m.key.toLowerCase().includes(search.toLowerCase()) ||
          m.value.toLowerCase().includes(search.toLowerCase())
      )
    : memories;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mémoires</h1>
          <p className="text-gray-500 text-sm mt-0.5">{memories.length} entrées persistantes</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher dans les mémoires..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 placeholder-gray-600"
      />

      {loading && <p className="text-gray-500 text-sm">Chargement...</p>}

      <div className="space-y-2">
        {filtered.length === 0 && !loading && (
          <p className="text-gray-600 text-sm">Aucune mémoire trouvée.</p>
        )}
        {filtered.map((m) => (
          <div key={m.key} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-start gap-3">
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-200 truncate">{m.key}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${SOURCE_STYLE[m.source] ?? "bg-gray-700 text-gray-400"}`}>
                  {m.source}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-3 break-words">{m.value}</p>
              <p className="text-xs text-gray-600">
                {new Date(m.updated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
            <button
              onClick={() => handleForget(m.key)}
              className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 transition-colors shrink-0"
              title="Oublier"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
