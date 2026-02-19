"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL ||
  "https://ai-saas-platform-customer-production.up.railway.app";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Register response:", data); // <-- useful in DevTools

      // If HTTP error or backend status != ok
      if (!res.ok || data.status !== "ok") {
        const msg =
          data?.message ||
          "Registration failed. Please check your details and try again.";
        setError(msg);
        return;
      }

      if (!data.userId) {
        // This SHOULD NOT happen with our backend, but just in case:
        setError("Registration succeeded but user id was missing from backend.");
        return;
      }

      // ✅ Success
      setSuccess("Account created! You can now log in.");
      // You can also redirect here if you want:
      // window.location.href = "/login";

    } catch (err: any) {
      console.error("Register error:", err);
      setError("Network error contacting backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-lg">
        <h1 className="text-xl font-semibold mb-6">Create Account</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              ❌ {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-emerald-400 flex items-center gap-1">
              ✅ {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 hover:bg-emerald-600 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-400">
          API: {API_BASE}
        </p>
      </div>
    </div>
  );
}
