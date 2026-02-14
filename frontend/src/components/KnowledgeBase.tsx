"use client";

import { useEffect, useState, useCallback } from "react";

interface KnowledgeEntry {
  id: string;
  content: string;
  source: string | null;
  tags: string[] | null;
  created_at: string;
}

interface SearchResult {
  id: string;
  content: string;
  source: string | null;
  tags: string[] | null;
  score: number;
  match_type: string;
}

interface KnowledgeStats {
  total_entries: number;
  with_embeddings: number;
  sources: { source: string; count: number }[];
  top_tags: { tag: string; count: number }[];
}

export default function KnowledgeBase() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ content: "", source: "", tags: "" });
  const [view, setView] = useState<"search" | "browse">("search");

  const loadStats = useCallback(() => {
    fetch("/api/knowledge/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const loadEntries = useCallback(() => {
    fetch("/api/knowledge?limit=20").then(r => r.json()).then(setEntries).catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
    loadEntries();
  }, [loadStats, loadEntries]);

  const search = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 8 }),
      });
      const data = await resp.json();
      setResults(data);
    } catch {}
    setSearching(false);
  };

  const addEntry = async () => {
    if (!newEntry.content.trim()) return;
    const tags = newEntry.tags.split(",").map(t => t.trim()).filter(Boolean);
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newEntry.content,
        source: newEntry.source || null,
        tags: tags.length > 0 ? tags : null,
      }),
    });
    setNewEntry({ content: "", source: "", tags: "" });
    setShowAdd(false);
    loadStats();
    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    loadStats();
    loadEntries();
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const matchColor = (type: string) => {
    if (type === "semantic") return "text-green-400 bg-green-400/10";
    if (type === "fulltext") return "text-blue-400 bg-blue-400/10";
    return "text-gray-400 bg-gray-400/10";
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gray-900 p-6 md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-purple-400 uppercase tracking-wider">Knowledge Base</h2>
          {stats && (
            <span className="text-xs text-gray-500">
              {stats.total_entries} entries &middot; {stats.with_embeddings} with embeddings
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView("search")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === "search" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-300"}`}>
              Search
            </button>
            <button onClick={() => setView("browse")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === "browse" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-300"}`}>
              Browse
            </button>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            {showAdd ? "Cancel" : "+ Add"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 space-y-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <textarea
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
            rows={3} placeholder="Knowledge content..."
            value={newEntry.content}
            onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
          />
          <div className="flex gap-2">
            <input className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
              placeholder="source (e.g. architecture)" value={newEntry.source}
              onChange={e => setNewEntry({ ...newEntry, source: e.target.value })} />
            <input className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
              placeholder="tags (comma-separated)" value={newEntry.tags}
              onChange={e => setNewEntry({ ...newEntry, tags: e.target.value })} />
            <button onClick={addEntry}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-medium transition-colors">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Search view */}
      {view === "search" && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button onClick={search} disabled={searching}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                searching ? "bg-purple-500/20 text-purple-300 cursor-wait" : "bg-purple-600 hover:bg-purple-500"
              }`}>
              {searching ? "..." : "Search"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map(r => (
                <div key={r.id} className="rounded-lg bg-gray-800/50 px-4 py-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{r.content}</p>
                    <button onClick={() => deleteEntry(r.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs shrink-0 transition-opacity">
                      x
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${matchColor(r.match_type)}`}>
                      {r.match_type} ({(r.score * 100).toFixed(0)}%)
                    </span>
                    {r.source && (
                      <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{r.source}</span>
                    )}
                    {r.tags?.map(t => (
                      <span key={t} className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.length === 0 && searchQuery && !searching && (
            <p className="text-gray-600 text-sm text-center py-4">No results. Try different keywords.</p>
          )}

          {/* Sources overview */}
          {stats && results.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stats.sources.slice(0, 8).map(s => (
                <div key={s.source} className="rounded-lg bg-gray-800/50 px-3 py-2 text-center">
                  <div className="text-lg font-bold">{s.count}</div>
                  <div className="text-[10px] text-gray-500 truncate">{s.source || "unknown"}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Browse view */}
      {view === "browse" && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {entries.length === 0 && <p className="text-gray-600 text-sm">No knowledge entries yet.</p>}
          {entries.map(e => (
            <div key={e.id} className="rounded-lg bg-gray-800/50 px-4 py-3 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1 line-clamp-2">{e.content}</p>
                <button onClick={() => deleteEntry(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs shrink-0 transition-opacity">
                  x
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {e.source && (
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{e.source}</span>
                )}
                {e.tags?.map(t => (
                  <span key={t} className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{t}</span>
                ))}
                <span className="text-[10px] text-gray-600 ml-auto">{new Date(e.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
