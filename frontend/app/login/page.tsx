"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API;

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    if (!API_BASE) return "";
    return mode === "login" ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!API_BASE) return setMsg("❌ NEXT_PUBLIC_CUSTOMER_API is missing in Vercel env.");
    if (!email.trim() || !password.trim()) return setMsg("❌ Email and password required.");

    try {
      setLoading(true);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "ok") {
        return setMsg("❌ " + (data.message || "Request failed"));
      }

      // Expect backend to return user object
      const user = data.user || data.createdUser || data;

      const userId = user?._id || user?.id;
      const credits = user?.credits ?? 0;

      if (!userId) return setMsg("❌ Backend did not return user id.");

      localStorage.setItem("bhaavai_userId", String(userId));
      localStorage.setItem("bhaavai_email", String(email));
      localStorage.setItem("bhaavai_credits", String(credits));

      setMsg("✅ Success. Redirecting...");
      window.location.href = "/";
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-slate-800 bg-slate-900/70 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">{mode === "login" ? "Customer Login" : "Create Account"}</h1>
          <a href="/" className="text-xs text-slate-400 hover:text-emerald-300">Home</a>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-2 mb-4 text-xs">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 border ${
              mode === "login" ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md py-2 border ${
              mode === "register" ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Email</label>
            <input
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Password</label>
            <input
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-500 text-slate-950 rounded-md py-2 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Working..." : mode === "login" ? "Login" : "Register"}
          </button>

          {msg && <p className="text-xs text-slate-300">{msg}</p>}
          <p className="text-[11px] text-slate-500">
            API: <span className="font-mono">{API_BASE || "(missing)"}</span>
          </p>
        </form>
      </div>
    </main>
  );
}
