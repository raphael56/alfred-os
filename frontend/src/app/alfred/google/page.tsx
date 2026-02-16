"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGmail, refreshGmail,
  getGoogleTasks, refreshGoogleTasks,
  getDrive, refreshDrive,
  type GmailEmail, type GoogleTask, type DriveFile,
} from "@/lib/alfred";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtDue(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fromName(from: string): string {
  const match = from.match(/^([^<]+)/);
  return match?.[1]?.trim() ?? from;
}

// ── Gmail Panel ─────────────────────────────────────────────────────────────────
function GmailPanel() {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((fn: typeof getGmail | typeof refreshGmail) => {
    return fn()
      .then((r) => { setEmails(r.emails); setCount(r.count); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(getGmail); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(refreshGmail);
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
          <h2 className="font-semibold text-sm text-gray-100">Gmail non lus</h2>
          {!loading && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{count}</span>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
        >
          {refreshing ? "..." : "↻ Actualiser"}
        </button>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-gray-800/60">
        {loading && <p className="px-5 py-4 text-sm text-gray-500">Chargement...</p>}
        {error && <p className="px-5 py-4 text-sm text-red-400">{error}</p>}
        {!loading && !error && emails.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-600">Aucun email non lu.</p>
        )}
        {emails.map((e) => (
          <div key={e.id} className="px-5 py-3 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-300 truncate">{fromName(e.from)}</span>
                  <span className="text-xs text-gray-600 shrink-0">{timeAgo(e.date)}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{e.subject}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{e.snippet}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Tasks Panel ──────────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((fn: typeof getGoogleTasks | typeof refreshGoogleTasks) => {
    return fn()
      .then((r) => { setTasks(r.tasks); setCount(r.count); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(getGoogleTasks); }, [load]);

  const overdueCount = tasks.filter((t) => t.overdue).length;

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-semibold text-sm text-gray-100">Google Tasks</h2>
          {!loading && (
            <div className="flex gap-1">
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{count}</span>
              {overdueCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{overdueCount} en retard</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => { setRefreshing(true); load(refreshGoogleTasks); }}
          disabled={refreshing}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
        >
          {refreshing ? "..." : "↻ Actualiser"}
        </button>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-gray-800/60">
        {loading && <p className="px-5 py-4 text-sm text-gray-500">Chargement...</p>}
        {error && <p className="px-5 py-4 text-sm text-red-400">{error}</p>}
        {!loading && !error && tasks.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-600">Aucune tâche en attente.</p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className={`px-5 py-3 hover:bg-gray-800/40 transition-colors ${t.overdue ? "border-l-2 border-red-500/50" : ""}`}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                {t.status === "completed" && (
                  <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200">{t.title}</p>
                {t.due && (
                  <p className={`text-xs mt-0.5 ${t.overdue ? "text-red-400" : "text-gray-600"}`}>
                    {t.overdue ? "⚠ " : ""}Échéance: {fmtDue(t.due)}
                  </p>
                )}
                {t.notes && <p className="text-xs text-gray-600 truncate mt-0.5">{t.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Drive Panel ──────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  Doc: "bg-blue-500/20 text-blue-300",
  Sheet: "bg-green-500/20 text-green-300",
  Slides: "bg-orange-500/20 text-orange-300",
  PDF: "bg-red-500/20 text-red-300",
  Dossier: "bg-yellow-500/20 text-yellow-300",
};

function DrivePanel() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((fn: typeof getDrive | typeof refreshDrive) => {
    return fn()
      .then((r) => { setFiles(r.files); setCount(r.count); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(getDrive); }, [load]);

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929l-4-6.928L8 2.609l4 6.929-4 6.929zm12.57-.925H12.57L8.569 8.613h7.997l3.999 5.929z" />
          </svg>
          <h2 className="font-semibold text-sm text-gray-100">Google Drive</h2>
          {!loading && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{count}</span>}
        </div>
        <button
          onClick={() => { setRefreshing(true); load(refreshDrive); }}
          disabled={refreshing}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
        >
          {refreshing ? "..." : "↻ Actualiser"}
        </button>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-gray-800/60">
        {loading && <p className="px-5 py-4 text-sm text-gray-500">Chargement...</p>}
        {error && <p className="px-5 py-4 text-sm text-red-400">{error}</p>}
        {!loading && !error && files.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-600">Aucun fichier récent.</p>
        )}
        {files.map((f) => (
          <div key={f.id} className="px-5 py-3 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR[f.type] ?? "bg-gray-700 text-gray-400"}`}>
                {f.type}
              </span>
              <div className="flex-1 min-w-0">
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-300 hover:text-blue-400 transition-colors truncate block"
                  >
                    {f.name}
                  </a>
                ) : (
                  <p className="text-xs text-gray-300 truncate">{f.name}</p>
                )}
              </div>
              <span className="text-xs text-gray-600 shrink-0">{timeAgo(f.modified)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function AlfredGooglePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Workspace</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gmail · Tasks · Drive — résumé en temps réel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "600px" }}>
        <GmailPanel />
        <TasksPanel />
        <DrivePanel />
      </div>
    </div>
  );
}
