"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import TaskStats from "@/components/TaskStats";

export default function TasksPage() {
  const { tasks, addTask, cycleStatus, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState("");
  const [taskFilter, setTaskFilter] = useState<string>("all");

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addTask(newTask);
    setNewTask("");
  };

  const filteredTasks = taskFilter === "all" ? tasks : tasks.filter(t => t.status === taskFilter);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-gray-500 text-sm mt-0.5">Task management & progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Stats */}
        <TaskStats tasks={tasks} />

        {/* Task List */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">All Tasks</h2>

          {/* Filters */}
          <div className="flex gap-1 mb-3">
            {["all", "todo", "in_progress", "done"].map((f) => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  taskFilter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}>
                {f === "all" ? "All" : f === "in_progress" ? "Active" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Add task */}
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="New task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <button
              onClick={handleAddTask}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {/* Task items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTasks.length === 0 && <p className="text-gray-600 text-sm">No tasks{taskFilter !== "all" ? ` (${taskFilter})` : ""}.</p>}
            {filteredTasks.map((t) => (
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
                {t.tags && t.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
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
      </div>
    </div>
  );
}
