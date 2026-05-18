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
  isEmailVerified: boolean;
}
interface AuthResponse {
  token: string;
  user: AuthUser;
}
interface RegisterResponse {
  message: string;
  email: string;
}

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, username: string) =>
    apiFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),

  verifyEmail: (token: string) =>
    apiFetch<AuthResponse>("/auth/verify-email/" + token),

  resendVerification: (email: string) =>
    apiFetch<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
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

// ── Food Catalogue — Prisma + PostgreSQL ─────────────────────────────────────
export interface Food {
  id: number;
  name: string;
  brand?: string | null;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre: number;
  createdAt: string;
}

export interface FoodLog {
  id: number;
  foodId: number;
  userId: string;
  grams: number;
  eatenOn: string;
  mealType: string;
  notes?: string | null;
  food?: Pick<Food, "name" | "calories" | "protein" | "carbs" | "fats">;
  createdAt: string;
}

interface FoodListResponse {
  foods: Food[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const foods = {
  // Search the food catalogue (public — no login needed)
  search: (params: { search?: string; category?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search)   q.set("search",   params.search);
    if (params.category) q.set("category", params.category);
    if (params.page)     q.set("page",     String(params.page));
    if (params.limit)    q.set("limit",    String(params.limit));
    return apiFetch<FoodListResponse>(`/api/foods?${q.toString()}`);
  },

  getOne: (id: number) =>
    apiFetch<{ food: Food & { logs: FoodLog[] } }>(`/api/foods/${id}`),

  create: (data: Omit<Food, "id" | "createdAt">) =>
    apiFetch<{ food: Food }>("/api/foods", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Omit<Food, "id" | "createdAt">>) =>
    apiFetch<{ food: Food }>(`/api/foods/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: number) => apiFetch(`/api/foods/${id}`, { method: "DELETE" }),

  // Food logs (what the user ate)
  getLogs: (date?: string) =>
    apiFetch<{ logs: FoodLog[] }>(`/api/foods/logs${date ? `?date=${date}` : ""}`),

  logFood: (data: { foodId: number; grams?: number; eatenOn?: string; mealType?: string; notes?: string }) =>
    apiFetch<{ log: FoodLog }>("/api/foods/logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeLog: (id: number) => apiFetch(`/api/foods/logs/${id}`, { method: "DELETE" }),
};
