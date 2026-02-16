const BASE = "/alfred-api";

export interface AlfredTask {
  id: number;
  description: string;
  status: "pending" | "running" | "done" | "failed";
  scheduled_at: string;
  started_at?: string;
  finished_at?: string;
  result?: string;
}

export interface AlfredCron {
  id: number;
  name: string;
  schedule: string;
  description: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count: number;
  last_status?: string;
}

export interface AlfredMemory {
  key: string;
  value: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface AlfredStats {
  memories: number;
  reminders: number;
  tasks: number;
  crons: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Alfred API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

// Tasks
export const getTasks = () => api<AlfredTask[]>("/api/tasks");

// Crons
export const getCrons = () => api<AlfredCron[]>("/api/crons");
export const createCron = (data: { name: string; schedule: string; description: string }) =>
  api<AlfredCron>("/api/crons", { method: "POST", body: JSON.stringify(data) });
export const toggleCron = (id: number, enabled: boolean) =>
  api<AlfredCron>(`/api/crons/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
export const deleteCron = (id: number) =>
  api<void>(`/api/crons/${id}`, { method: "DELETE" });

// Memories
export const getMemories = (limit = 50) => api<AlfredMemory[]>(`/api/memories?limit=${limit}`);
export const forgetMemory = (key: string) =>
  api<void>(`/api/memories/${encodeURIComponent(key)}`, { method: "DELETE" });

// Stats
export const getStats = () => api<AlfredStats>("/api/stats");

// Google Workspace
export interface GmailEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string | null;
}

export interface GoogleTask {
  id: string;
  title: string;
  due: string | null;
  notes: string | null;
  status: string;
  overdue: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  type: string;
  modified: string | null;
  url: string | null;
}

export const getGmail = (limit = 10) =>
  api<{ emails: GmailEmail[]; count: number }>(`/api/google/gmail?limit=${limit}`);
export const refreshGmail = () =>
  api<{ emails: GmailEmail[]; count: number }>("/api/google/gmail/refresh", { method: "POST" });

export const getGoogleTasks = () =>
  api<{ tasks: GoogleTask[]; count: number }>("/api/google/tasks");
export const refreshGoogleTasks = () =>
  api<{ tasks: GoogleTask[]; count: number }>("/api/google/tasks/refresh", { method: "POST" });

export const getDrive = (limit = 15) =>
  api<{ files: DriveFile[]; count: number }>(`/api/google/drive?limit=${limit}`);
export const refreshDrive = () =>
  api<{ files: DriveFile[]; count: number }>("/api/google/drive/refresh", { method: "POST" });

// Chat
export const chat = (message: string): Promise<string> =>
  api<{ reply: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  }).then((r) => r.reply);
