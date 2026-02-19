"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL ||
  "https://ai-saas-platform-customer-production.up.railway.app";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse error, we handle below
      }

      console.log("REGISTER RESPONSE FROM BACKEND:", res.status, data);

      // ❗ If backend returned an error (409, 500, etc.)
      if (!res.ok) {
        if (res.status === 409) {
          setError(
            data?.message || "This email is already registered. Please log in."
          );
          return;
        }

        setError(
          data?.message ||
            `Registration failed (status ${res.status}). Please try again.`
        );
        return;
      }

      // ✅ Status OK – we expect data.userId
      const userId = data?.userId;

      if (!userId) {
        console.error("Register: missing userId in response", data);
        setError(
          "Unexpected server response. Please try again or contact support."
        );
        return;
      }

      // Save simple session info
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", userId);
        localStorage.setItem("userEmail", data.email || email);
        localStorage.setItem("userCredits", String(data.credits ?? 0));
      }

      setMsg("Account created successfully! Redirecting to dashboard...");
      setError(null);

      router.push("/dashboard");
    } catch (err) {
      console.error("Register error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 p-8 shadow-xl border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Create Account</h1>
          <button
            className="text-sm text-slate-400 hover:text-slate-200"
            onClick={() => router.push("/")}
          >
            Home
          </button>
        </div>

        <div className="flex mb-6 gap-2">
          <button
            type="button"
            className="flex-1 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            onClick={() => router.push("/auth/login")}
          >
            Login
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-md border border-emerald-500 bg-emerald-500 text-slate-950 font-medium"
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400 flex items-center gap-1">
            ❌ {error}
          </p>
        )}
        {msg && (
          <p className="mt-4 text-sm text-emerald-400 flex items-center gap-1">
            ✅ {msg}
          </p>
        )}

        <p className="mt-6 text-[11px] text-slate-500">
          API: {API_BASE}
        </p>
      </div>
    </main>
  );
}
