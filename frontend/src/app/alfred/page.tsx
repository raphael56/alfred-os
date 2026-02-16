"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, type AlfredStats } from "@/lib/alfred";

const HQ_CARDS = [
  {
    href: "/alfred/tasks",
    label: "Tâches",
    description: "Tâches autonomes planifiées et leur rapport d'exécution",
    color: "border-blue-500/30 hover:border-blue-500/60",
    iconColor: "text-blue-400",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    statKey: "tasks" as keyof AlfredStats,
  },
  {
    href: "/alfred/crons",
    label: "Crons",
    description: "Jobs récurrents automatiques d'Alfred",
    color: "border-purple-500/30 hover:border-purple-500/60",
    iconColor: "text-purple-400",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    statKey: "crons" as keyof AlfredStats,
  },
  {
    href: "/alfred/memories",
    label: "Mémoires",
    description: "Base de connaissances persistante d'Alfred",
    color: "border-amber-500/30 hover:border-amber-500/60",
    iconColor: "text-amber-400",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      </svg>
    ),
    statKey: "memories" as keyof AlfredStats,
  },
  {
    href: "/alfred/chat",
    label: "Chat",
    description: "Interface de conversation directe avec Alfred",
    color: "border-green-500/30 hover:border-green-500/60",
    iconColor: "text-green-400",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    statKey: null,
  },
];

export default function AlfredHQ() {
  const [stats, setStats] = useState<AlfredStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alfred HQ</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tour de contrôle — Vigie & Quartier Général</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${error ? "bg-red-500" : "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"}`} />
          <span className="text-xs text-gray-400">{error ? "offline" : "online"}</span>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Mémoires", value: stats.memories, color: "text-amber-400" },
            { label: "Rappels", value: stats.reminders, color: "text-red-400" },
            { label: "Tâches", value: stats.tasks, color: "text-blue-400" },
            { label: "Crons", value: stats.crons, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* HQ Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {HQ_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-2xl border bg-gray-900 p-6 flex items-start gap-4 transition-all ${card.color}`}
          >
            <div className={`${card.iconColor} mt-0.5 shrink-0`}>{card.icon}</div>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold text-gray-100">{card.label}</h2>
                {card.statKey && stats && (
                  <span className="text-xs text-gray-500">{stats[card.statKey]}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
