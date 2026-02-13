"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import TaskStats from "@/components/TaskStats";

const MetricsChart = dynamic(() => import("@/components/MetricsChart"), { ssr: false });
const GarminDashboard = dynamic(() => import("@/components/GarminDashboard"), { ssr: false });

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  tags: string[] | null;
  due_date: string | null;
  created_at: string;
}

interface Metric {
  id: string;
  category: string;
  key: string;
  value: any;
  recorded_at: string;
}

export default function Home() {
  const [health, setHealth] = useState<string>("checking...");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [newTask, setNewTask] = useState("");
  const [tables, setTables] = useState<string[]>([]);

  const fetchAll = useCallback(() => {
    fetch("/api/health").then(r => r.json()).then(d => setHealth(d.status)).catch(() => setHealth("offline"));
    fetch("/api/tasks").then(r => r.json()).then(setTasks).catch(() => {});
    fetch("/api/metrics").then(r => r.json()).then(setMetrics).catch(() => {});
    fetch("/api/sys/schema").then(r => r.json()).then(d => setTables(d.tables || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, priority: 1 }),
    });
    setNewTask("");
    fetchAll();
  };

  const cycleStatus = async (task: Task) => {
    const next: Record<string, string> = { todo: "in_progress", in_progress: "done", done: "todo" };
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next[task.status] || "todo" }),
    });
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const seedMetrics = async () => {
    const categories = [
      { category: "system", key: "cpu_load", gen: () => 20 + Math.random() * 60 },
      { category: "system", key: "memory_pct", gen: () => 40 + Math.random() * 40 },
      { category: "sport", key: "garmin_vo2max", gen: () => 48 + Math.random() * 8 },
    ];
    for (const c of categories) {
      for (let i = 0; i < 8; i++) {
        await fetch("/api/metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: c.category, key: c.key, value: Math.round(c.gen() * 10) / 10 }),
        });
      }
    }
    fetchAll();
  };

  const statusColor = (s: string) => {
    if (s === "done") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (s === "in_progress") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const statusIcon = (s: string) => {
    if (s === "done") return "\u2713";
    if (s === "in_progress") return "\u25B6";
    return "\u25CB";
  };

  const uniqueCharts = metrics.reduce<{ category: string; key: string }[]>((acc, m) => {
    if (!acc.find((a) => a.category === m.category && a.key === m.key)) {
      acc.push({ category: m.category, key: m.key });
    }
    return acc;
  }, []);

  const chartColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alfred OS</h1>
          <p className="text-gray-500 mt-1">Sovereign Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${health === "operational" ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-red-500 shadow-lg shadow-red-500/50"}`} />
          <span className="text-sm text-gray-400">{health}</span>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Sport / Garmin Cards */}
        <GarminDashboard />

        {/* System Status */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">System Overview</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-xs text-gray-500">Tasks</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="text-2xl font-bold">{metrics.length}</div>
              <div className="text-xs text-gray-500">Metrics</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="text-2xl font-bold">{tables.length}</div>
              <div className="text-xs text-gray-500">Tables</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <a href="/api/swagger-ui/" target="_blank" className="block rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors text-center">
              Open Swagger UI
            </a>
            {metrics.length === 0 && (
              <button onClick={seedMetrics} className="w-full rounded-lg bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-sm text-purple-400 hover:bg-purple-500/20 transition-colors">
                Seed Demo Metrics
              </button>
            )}
          </div>
        </div>

        {/* Task Stats */}
        <TaskStats tasks={tasks} />

        {/* Tasks List */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:row-span-2">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Tasks</h2>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="New task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button
              onClick={addTask}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {tasks.length === 0 && <p className="text-gray-600 text-sm">No tasks yet.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg bg-gray-800/50 px-4 py-3 group">
                <button
                  onClick={() => cycleStatus(t)}
                  className={`shrink-0 w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-colors ${statusColor(t.status)}`}
                >
                  {statusIcon(t.status)}
                </button>
                <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-gray-500" : ""}`}>
                  {t.title}
                </span>
                <span className="text-xs text-gray-600">P{t.priority}</span>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-sm transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Charts - dynamically generated */}
        {uniqueCharts.map((c, i) => (
          <MetricsChart
            key={`${c.category}-${c.key}`}
            metrics={metrics}
            title={`${c.category} / ${c.key}`}
            category={c.category}
            metricKey={c.key}
            color={chartColors[i % chartColors.length]}
          />
        ))}

        {/* Recent Metrics Table */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Latest Metrics</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.length === 0 && <p className="text-gray-600 text-sm">No metrics recorded.</p>}
            {metrics.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{m.category}</span>
                  <span className="text-sm">{m.key}</span>
                </div>
                <span className="text-sm font-mono font-bold">{typeof m.value === "number" ? m.value : JSON.stringify(m.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Schema */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Database</h2>
          <div className="space-y-2">
            {tables.map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-4 py-2">
                <span className="text-blue-400 text-xs font-mono bg-blue-400/10 px-2 py-0.5 rounded">TABLE</span>
                <span className="text-sm font-mono">{t}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
