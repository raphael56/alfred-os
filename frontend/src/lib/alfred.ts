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
export const getTasks = () =>
  api<{ tasks: AlfredTask[]; stats: unknown }>("/api/tasks").then((r) => r.tasks);

// Crons
export const getCrons = () =>
  api<{ crons: AlfredCron[]; stats: unknown }>("/api/crons").then((r) => r.crons);
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

// Routines
export interface RoutineCard {
  id: number;
  category: string;
  category_label: string;
  title: string;
  summary: string;
  bullets: string[];
  sources: string[];
  pinned: boolean;
  created_at: string;
  expires_at: string;
}

export interface RoutineStatus {
  category: string;
  label: string;
  generated: boolean;
}

export const getRoutines = () =>
  api<{ cards: RoutineCard[]; status: RoutineStatus[]; count: number }>("/api/routines");
export const pinRoutine = (id: number, pinned: boolean) =>
  api<{ ok: boolean }>(`/api/routines/${id}/pin`, { method: "POST", body: JSON.stringify({ pinned }) });
export const deleteRoutine = (id: number) =>
  api<{ ok: boolean }>(`/api/routines/${id}`, { method: "DELETE" });
export const generateRoutines = () =>
  api<{ message: string }>("/api/routines/generate", { method: "POST" });

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

// Home Assistant
export interface HaDomainSummary {
  domain: string;
  total: number;
  active: number;
}

export interface HaEntity {
  entity_id: string;
  state: string;
  name: string;
  attributes: Record<string, unknown>;
  last_changed: string;
}

export const getHaStates = () =>
  api<{ summary: HaDomainSummary[]; total: number }>("/api/homeassistant/states");
export const getHaDomain = (domain: string) =>
  api<{ entities: HaEntity[]; domain: string }>(`/api/homeassistant/domain/${domain}`);
export const callHaService = (domain: string, service: string, entity_id?: string, data?: Record<string, unknown>) =>
  api<{ ok: boolean }>("/api/homeassistant/service", {
    method: "POST",
    body: JSON.stringify({ domain, service, entity_id, data }),
  });
export const refreshHaStates = () =>
  api<{ ok: boolean; total: number }>("/api/homeassistant/states/refresh", { method: "POST" });

// n8n
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: "success" | "error" | "running" | "waiting" | string;
  startedAt: string;
  stoppedAt?: string;
}

export const getN8nWorkflows = () =>
  api<{ workflows: N8nWorkflow[]; count: number }>("/api/n8n/workflows");
export const getN8nExecutions = (limit = 20) =>
  api<{ executions: N8nExecution[]; count: number }>(`/api/n8n/executions?limit=${limit}`);
export const triggerN8nWorkflow = (id: string, data?: Record<string, unknown>) =>
  api<{ ok: boolean; executionId?: string }>(`/api/n8n/workflows/${id}/trigger`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
export const refreshN8nWorkflows = () =>
  api<{ ok: boolean; count: number }>("/api/n8n/workflows/refresh", { method: "POST" });
