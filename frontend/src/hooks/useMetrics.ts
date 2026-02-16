"use client";

import { useEffect, useState, useCallback } from "react";

export interface Metric {
  id: string;
  category: string;
  key: string;
  value: any;
  recorded_at: string;
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((data) => { setMetrics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const addMetric = useCallback(async (category: string, key: string, value: any) => {
    if (!category || !key) return;
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, key, value }),
    });
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, addMetric, refresh: fetchMetrics };
}
