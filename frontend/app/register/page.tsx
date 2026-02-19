"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API_URL || "";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!API_BASE) {
        setError("Frontend API base URL is not set (NEXT_PUBLIC_CUSTOMER_API_URL).");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({} as any));
      console.log("Register response:", data);

      if (!res.ok) {
        setError(data?.message || "Server returned an error.");
        return;
      }

      if (!data.userId) {
        // this is the message you were seeing
        setError("Backend did not return user id (userId). Check API response shape.");
        return;
      }

      // Save user in localStorage (simple session)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-saas-user",
          JSON.stringify({
            userId: data.userId,
            email: data.email,
            credits: data.credits ?? 0,
          })
        );
      }

      // Redirect to app/dashboard
      router.push("/app");
    } catch (err: any) {
      console.error("Register error:", err);
      setError("Network error connecting to API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Create Account</h1>
          <a href="/" className="text-sm text-slate-400 hover:text-slate-200">
            Home
          </a>
        </div>

        <div className="flex mb-6 space-x-2">
          <a
            href="/auth/login"
            className="flex-1 py-2 text-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
          >
            Login
          </a>
          <button
            className="flex-1 py-2 text-center rounded-lg bg-emerald-600 text-white text-sm"
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@mail.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400 flex items-center space-x-2">
            <span>✖</span>
            <span>{error}</span>
          </p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          API: {API_BASE || "NOT SET"}
        </p>
      </div>
    </main>
  );
}
