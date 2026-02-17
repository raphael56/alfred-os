"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getN8nWorkflows, getN8nExecutions, triggerN8nWorkflow, refreshN8nWorkflows,
  type N8nWorkflow, type N8nExecution,
} from "@/lib/alfred";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: "Succès",  color: "text-green-400 bg-green-500/10" },
  error:   { label: "Erreur",  color: "text-red-400 bg-red-500/10" },
  running: { label: "En cours", color: "text-blue-400 bg-blue-500/10" },
  waiting: { label: "Attente", color: "text-yellow-400 bg-yellow-500/10" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function duration(start: string, stop?: string): string {
  if (!stop) return "en cours";
  const ms = new Date(stop).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.floor((ms % 60_000) / 1000)}s`;
}

export default function N8nPage() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ id: string; execId?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"workflows" | "executions">("workflows");

  const load = useCallback(async () => {
    try {
      const [wfData, execData] = await Promise.all([
        getN8nWorkflows(),
        getN8nExecutions(20),
      ]);
      setWorkflows(wfData.workflows);
      setExecutions(execData.executions);
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
    try { await refreshN8nWorkflows(); await load(); } finally { setRefreshing(false); }
  };

  const handleTrigger = async (wf: N8nWorkflow) => {
    if (!wf.active) return;
    setTriggering(wf.id);
    setTriggerResult(null);
    try {
      const res = await triggerN8nWorkflow(wf.id);
      setTriggerResult({ id: wf.id, execId: res.executionId });
      // Refresh executions after 2s
      setTimeout(async () => {
        const execData = await getN8nExecutions(20);
        setExecutions(execData.executions);
      }, 2000);
    } catch (e) {
      setError(`Erreur déclenchement: ${e}`);
    } finally {
      setTriggering(null);
    }
  };

  const active = workflows.filter((w) => w.active);
  const inactive = workflows.filter((w) => !w.active);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-orange-400">⚙️</span> n8n
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? "Chargement…" : `${workflows.length} workflows · ${active.length} actifs`}
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

      {triggerResult && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400 flex items-center gap-2">
          <span>✓</span>
          <span>Workflow déclenché{triggerResult.execId ? ` — exec#${triggerResult.execId}` : ""}</span>
          <button onClick={() => setTriggerResult(null)} className="ml-auto text-green-600 hover:text-green-400">×</button>
        </div>
      )}

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{workflows.length}</div>
            <div className="text-xs text-gray-500 mt-1">Workflows total</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{active.length}</div>
            <div className="text-xs text-gray-500 mt-1">Actifs</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{executions.filter(e => e.status === "success").length}</div>
            <div className="text-xs text-gray-500 mt-1">Succès récents</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {(["workflows", "executions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "workflows" ? `Workflows (${workflows.length})` : `Exécutions (${executions.length})`}
          </button>
        ))}
      </div>

      {/* Workflows tab */}
      {tab === "workflows" && (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">Actifs</h2>
              <div className="space-y-2">
                {active.map((wf) => (
                  <div key={wf.id} className="rounded-xl border border-green-500/20 bg-gray-900 p-4 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-100">{wf.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {wf.id} · Maj: {fmt(wf.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTrigger(wf)}
                      disabled={triggering === wf.id}
                      className="text-xs bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {triggering === wf.id ? "⏳" : "▶ Déclencher"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">Inactifs</h2>
              <div className="space-y-2">
                {inactive.map((wf) => (
                  <div key={wf.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-4 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-400">{wf.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">ID: {wf.id} · Maj: {fmt(wf.updatedAt)}</div>
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded flex-shrink-0">OFF</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && workflows.length === 0 && (
            <div className="text-center text-gray-600 py-12 text-sm">Aucun workflow</div>
          )}
        </div>
      )}

      {/* Executions tab */}
      {tab === "executions" && (
        <div className="space-y-2">
          {executions.map((exec) => {
            const sc = STATUS_CONFIG[exec.status] ?? { label: exec.status, color: "text-gray-400 bg-gray-700" };
            return (
              <div key={exec.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${sc.color}`}>
                  {sc.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">
                    {exec.workflowName ?? `Workflow ${exec.workflowId}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {fmt(exec.startedAt)} · {duration(exec.startedAt, exec.stoppedAt)}
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex-shrink-0">#{exec.id.slice(0, 8)}</div>
              </div>
            );
          })}
          {!loading && executions.length === 0 && (
            <div className="text-center text-gray-600 py-12 text-sm">Aucune exécution récente</div>
          )}
        </div>
      )}
    </div>
  );
}
