"use client";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface Props {
  tasks: Task[];
}

export default function TaskStats({ tasks }: Props) {
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Task Progress</h2>
      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
        <div
          className="bg-green-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center text-2xl font-bold mb-4">{pct}%</div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-gray-800 p-3">
          <div className="text-xl font-bold text-gray-400">{todo}</div>
          <div className="text-xs text-gray-500">Todo</div>
        </div>
        <div className="rounded-lg bg-yellow-500/10 p-3">
          <div className="text-xl font-bold text-yellow-400">{inProgress}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="rounded-lg bg-green-500/10 p-3">
          <div className="text-xl font-bold text-green-400">{done}</div>
          <div className="text-xs text-gray-500">Done</div>
        </div>
      </div>
    </div>
  );
}
