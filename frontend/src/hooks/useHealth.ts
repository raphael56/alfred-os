"use client";

import { useEffect, useState, useCallback } from "react";

export function useHealth() {
  const [health, setHealth] = useState<string>("checking...");

  const fetchHealth = useCallback(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("offline"));
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return { health, refresh: fetchHealth };
}
