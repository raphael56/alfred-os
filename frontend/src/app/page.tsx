"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<string>("checking...");

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("offline"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Alfred OS</h1>
        <p className="mt-2 text-gray-400">Sovereign Dashboard</p>
        <div className="mt-6 flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              health === "operational" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            Backend: <strong>{health}</strong>
          </span>
        </div>
      </div>
    </main>
  );
}
