/**
 * src/lib/api.ts
 *
 * Central HTTP client for the NutriGuide frontend.
 * All calls go to the Express backend (L17-24: Express routing).
 * JWT is stored in localStorage and sent as a Bearer token (L41-44).
 *
 * This replaces all Supabase client calls.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Token helpers (L41-44: JWT) ───────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem("ng_token");
}
export function setToken(token: string) {
  localStorage.setItem("ng_token", token);
}
export function clearToken() {
  localStorage.removeItem("ng_token");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Auth (L41-44) ─────────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  id?: string; // alias
  email: string;
  username: string;
  role: string;
}
interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, username: string) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),

  me: () => apiFetch<{ user: AuthUser }>("/auth/me"),

  logout: () =>
    apiFetch("/auth/logout", { method: "POST" }).finally(clearToken),
};

// ── Meals (L21-24: routes + route params) ────────────────────────────────────
export interface Meal {
  _id: string;
  id?: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  eaten_on: string;
  notes?: string | null;
  createdAt: string;
}

export const meals = {
  list: (date?: string) =>
    apiFetch<{ meals: Meal[] }>(`/api/meals${date ? `?date=${date}` : ""}`),

  create: (data: Omit<Meal, "_id" | "id" | "user_id" | "createdAt">) =>
    apiFetch<{ meal: Meal }>("/api/meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Meal>) =>
    apiFetch<{ meal: Meal }>(`/api/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: string) => apiFetch(`/api/meals/${id}`, { method: "DELETE" }),
};

// ── Profile (L21-24) ──────────────────────────────────────────────────────────
export interface Profile {
  username: string;
  avatar_url?: string;
  dietary_preference: string;
  daily_calorie_goal: number;
}

export const profile = {
  get: () => apiFetch<{ profile: Profile }>("/api/profile"),
  update: (data: Partial<Profile>) =>
    apiFetch<{ profile: Profile }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
