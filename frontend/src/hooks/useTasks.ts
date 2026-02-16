"use client";

import { useEffect, useState, useCallback } from "react";

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  tags: string[] | null;
  due_date: string | null;
  created_at: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const addTask = useCallback(async (title: string, priority = 1) => {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });
    fetchTasks();
  }, [fetchTasks]);

  const cycleStatus = useCallback(async (task: Task) => {
    const next: Record<string, string> = { todo: "in_progress", in_progress: "done", done: "todo" };
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next[task.status] || "todo" }),
    });
    fetchTasks();
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, addTask, cycleStatus, deleteTask, refresh: fetchTasks };
}
