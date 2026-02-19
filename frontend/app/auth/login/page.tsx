"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API_URL || "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!API_BASE) {
        setError("NEXT_PUBLIC_CUSTOMER_API_URL is not set on the frontend.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json().catch(() => ({} as any));
      console.log("LOGIN RESPONSE FROM BACKEND:", payload);

      if (!res.ok) {
        setError(payload?.message || "Invalid credentials.");
        return;
      }

      const userId =
        payload.userId || payload.id || payload._id || payload?.data?.userId;

      if (!userId) {
        setError(
          "Backend did not return user id (login). Check console for raw payload."
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-saas-user",
          JSON.stringify({
            userId,
            email: payload.email ?? email,
            credits: payload.credits ?? 0,
          })
        );
      }

      router.push("/app");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error talking to API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 rounded-xl p-8 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              ❌ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium py-2 mt-2 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-slate-500 break-all">
          API base: {API_BASE || "(not set)"}
        </p>
      </div>
    </main>
  );
}
