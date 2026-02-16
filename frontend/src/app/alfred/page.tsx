"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, type AlfredStats } from "@/lib/alfred";

const HQ_CARDS = [
  {
    href: "/alfred/routines",
    label: "Routines",
    description: "Briefings quotidiens — actu monde, tech/IA, trail. Renouvelés à 6h00",
    color: "border-sky-500/30 hover:border-sky-500/60",
    iconColor: "text-sky-400",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    statKey: null,
  },
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
  {
    href: "/alfred/google",
    label: "Google Workspace",
    description: "Gmail non lus, Google Tasks et documents Drive récents",
    color: "border-gray-600/30 hover:border-gray-500/60",
    iconColor: "",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
