"use client";

import { useEffect, useState, useCallback } from "react";

export interface Alert {
  level: string;
  category: string;
  message: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then(setAlerts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, refresh: fetchAlerts };
}
