"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ApiResponse = {
  status: string;
  userId?: string;
  email?: string;
  credits?: number;
  message?: string;
};

const STORAGE_KEY = "ai_user";

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API_BASE || "http://localhost:3002";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      if (!data.userId) {
        setError("Backend did not return user id.");
        return;
      }

      // Save user in localStorage for dashboard
      const bundle = {
        userId: data.userId,
        email: data.email || email,
        credits: data.credits ?? 0,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
      }

      setMsg("Logged in successfully. Redirecting…");
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-700 px-8 py-6 text-white shadow-xl">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Login</h1>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            Home
          </Link>
        </header>

        <div className="flex gap-2 mb-6 text-sm">
          <button className="flex-1 rounded-md bg-emerald-500 py-2 font-medium">
            Login
          </button>
          <Link
            href="/register"
            className="flex-1 rounded-md border border-slate-600 py-2 text-center text-slate-200 hover:bg-slate-800"
          >
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-emerald-500 py-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        {error && (
          <p className="mt-4 flex items-center gap-1 text-xs text-red-400">
            ❌ {error}
          </p>
        )}

        {msg && !error && (
          <p className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
            ✅ {msg}
          </p>
        )}

        <p className="mt-6 text-[11px] text-slate-500">
          API: <span className="break-all">{API_BASE}</span>
        </p>
      </div>
    </main>
  );
}
