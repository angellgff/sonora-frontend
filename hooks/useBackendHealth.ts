"use client";

import { useState, useEffect, useCallback } from "react";

type BackendStatus = "connected" | "disconnected" | "checking";

export function useBackendHealth(intervalMs: number = 15000) {
    const [status, setStatus] = useState<BackendStatus>("checking");

    const checkHealth = useCallback(async () => {
        try {
            const response = await fetch("/api/health", { cache: "no-store" });
            setStatus(response.ok ? "connected" : "disconnected");
        } catch {
            setStatus("disconnected");
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkHealth();

        // Poll periodically
        const interval = setInterval(checkHealth, intervalMs);
        return () => clearInterval(interval);
    }, [checkHealth, intervalMs]);

    return { status, checkHealth };
}
