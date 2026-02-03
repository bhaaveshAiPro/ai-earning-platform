"use client";

import { useState } from "react";

const API_BASE = "http://localhost:3002";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/auth/login" : "/auth/register";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        throw new Error(data.message || "Request failed");
      }

      // Save user info in localStorage for later use (credits + userId)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("bhaavai_userId", data.userId);
        window.localStorage.setItem("bhaavai_email", data.email);
        window.localStorage.setItem(
          "bhaavai_credits",
          String(data.credits ?? 0)
        );
      }

      setMessage(
        mode === "login"
          ? "Logged in successfully. Redirecting..."
          : "Account created. Redirecting..."
      );

      // Redirect to homepage after 1 second
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }, 1000);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-1 text-center">BhaavAI</h1>
        <p className="text-xs text-slate-400 mb-4 text-center">
          {mode === "login" ? "Log in to your account" : "Create your account"}
        </p>

        {/* Mode switcher */}
        <div className="flex gap-2 mb-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
            className={`flex-1 rounded-full px-3 py-1.5 border ${
              mode === "login"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                : "border-slate-700 text-slate-300"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setMessage(null);
            }}
            className={`flex-1 rounded-full px-3 py-1.5 border ${
              mode === "register"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                : "border-slate-700 text-slate-300"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Registering..."
              : mode === "login"
              ? "Log in"
              : "Register"}
          </button>
        </form>

        {message && (
          <div className="mt-3 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200">
            {message}
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Backend: <span className="font-mono">http://localhost:3002</span>
        </p>
      </div>
    </main>
  );
}
