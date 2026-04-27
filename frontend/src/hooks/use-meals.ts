/**
 * src/hooks/use-meals.ts
 *
 * Fetches ALL meals from the Express backend (L21-24: REST endpoints).
 * No date filter — Dashboard and Report filter client-side.
 * Real-time updates come via Socket.io meal:update events (L45-48).
 *
 * FIX: Fetch all meals (no ?date= restriction), normalize eaten_on to
 *      YYYY-MM-DD so Dashboard and Report date comparisons work correctly.
 */

import { useEffect, useState, useCallback } from "react";
import { meals as mealsApi, type Meal } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "./use-socket";

export type { Meal };

/** Normalize any date value to a YYYY-MM-DD string */
function normalizeDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const s = String(val);
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO string like 2026-04-27T... → slice
  return s.slice(0, 10);
}

export function useMeals() {
  const { user } = useAuth();
  const socket = useSocket();
  const [mealList, setMealList] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch ALL meals — no date filter — so Dashboard & Report can slice client-side
      const { meals } = await mealsApi.list();
      setMealList(
        meals.map((m) => ({
          ...m,
          id: m._id || m.id,
          // Normalize eaten_on to plain YYYY-MM-DD regardless of how the DB returns it
          eaten_on: normalizeDate(m.eaten_on),
        }))
      );
    } catch {
      /* ignore network errors silently */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // L45-48: listen for real-time meal:update from socket.io
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchMeals();
    socket.on("meal:update", handler);
    return () => {
      socket.off("meal:update", handler);
    };
  }, [socket, fetchMeals]);

  return { meals: mealList, loading, refetch: fetchMeals };
}
