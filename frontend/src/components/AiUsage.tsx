"use client";

import { useEffect, useState } from "react";

interface AiMetric {
  id: string;
  key: string;
  value: any;
  recorded_at: string;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function AiUsage() {
  const [weekly, setWeekly] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);

  useEffect(() => {
    fetch("/api/metrics?category=ai&key=weekly_usage")
      .then(r => r.json())
      .then((data: AiMetric[]) => { if (data.length > 0) setWeekly(data[0].value); })
      .catch(() => {});
    fetch("/api/metrics?category=ai&key=daily_usage")
      .then(r => r.json())
      .then((data: AiMetric[]) => { if (data.length > 0) setDaily(data[0].value); })
      .catch(() => {});
  }, []);

  if (!weekly && !daily) return null;

  const models = daily?.models ? Object.entries(daily.models) as [string, any][] : [];

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gray-900 p-6 md:col-span-2">
      <h2 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-4">OpenClaw AI Usage</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {weekly && (
          <>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <div className="text-xl font-bold text-cyan-400">{formatTokens(weekly.totalTokens)}</div>
              <div className="text-[10px] text-gray-500">Tokens / week</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <div className="text-xl font-bold text-green-400">${weekly.estimatedCostUsd?.toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">Cost / week</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <div className="text-xl font-bold">{weekly.totalRequests}</div>
              <div className="text-[10px] text-gray-500">Requests / week</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3 text-center">
              <div className={`text-xl font-bold ${(weekly.successRate ?? 0) > 80 ? "text-green-400" : (weekly.successRate ?? 0) > 50 ? "text-yellow-400" : "text-red-400"}`}>
                {weekly.successRate ?? 0}%
              </div>
              <div className="text-[10px] text-gray-500">Success rate</div>
            </div>
          </>
        )}
      </div>

      {daily && (
        <div className="rounded-lg bg-gray-800/50 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Today ({daily.date})</span>
            <span className="text-xs text-gray-500">{daily.avgLatencyMs ? `${(daily.avgLatencyMs / 1000).toFixed(1)}s avg latency` : ""}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-mono font-bold">{formatTokens(daily.totalTokens ?? 0)}</div>
              <div className="text-[10px] text-gray-500">tokens</div>
            </div>
            <div>
              <div className="font-mono font-bold">${daily.estimatedCostUsd?.toFixed(2) ?? "0"}</div>
              <div className="text-[10px] text-gray-500">cost</div>
            </div>
            <div>
              <div className="font-mono font-bold">
                <span className="text-green-400">{daily.successfulRequests ?? 0}</span>
                <span className="text-gray-600">/</span>
                <span className="text-red-400">{daily.failedRequests ?? 0}</span>
              </div>
              <div className="text-[10px] text-gray-500">ok / fail</div>
            </div>
          </div>
        </div>
      )}

      {models.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500 mb-1">Models</div>
          {models.map(([name, data]) => {
            const shortName = name.split("/").pop() ?? name;
            return (
              <div key={name} className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-1.5">
                <span className="text-xs font-mono truncate max-w-[200px]" title={name}>{shortName}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{data.requests} req</span>
                  <span className="font-mono">{formatTokens(data.tokens)}</span>
                  {data.errors > 0 && <span className="text-red-400">{data.errors} err</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
