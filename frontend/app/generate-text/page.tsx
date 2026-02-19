"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  userId: string;
  email: string;
  credits: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL || "http://localhost:3002";

export default function GenerateTextPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // protect route + load user
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("ai-saas-user") ||
            localStorage.getItem("user")
          : null;

      if (!raw) {
        router.replace("/login");
        return;
      }

      const parsed = JSON.parse(raw) as StoredUser;
      if (!parsed?.userId) {
        router.replace("/login");
        return;
      }

      setUser(parsed);
    } catch (e) {
      console.error(e);
      router.replace("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "text",
          prompt,
          userId: user.userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "completed") {
        console.error("Order error:", data);
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      // data.result is the AI text from your backend
      setResult(data.result || "No result text returned.");

      // If backend returns updated credits, store them
      if (typeof data.credits === "number") {
        const updated: StoredUser = {
          ...user,
          credits: data.credits,
        };
        setUser(updated);
        try {
          localStorage.setItem("ai-saas-user", JSON.stringify(updated));
          localStorage.setItem("user", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to update stored user:", e);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Check your API URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // while redirecting / loading user
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl bg-[#020617] border border-slate-800 shadow-xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Generate AI Text
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Logged in as <span className="font-mono">{user.email}</span> •{" "}
              Credits: <span className="font-semibold">{user.credits}</span>
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs md:text-sm text-slate-300 hover:text-emerald-400 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-slate-300 mb-1">
            Prompt
            <textarea
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500 resize-vertical"
              placeholder="Describe what you want the AI to write for your customer…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium px-4 py-2 transition-colors"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 border border-red-500/40 rounded-xl px-3 py-2 bg-red-950/30">
            {error}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-2 text-slate-200">
              Result
            </h2>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 text-sm px-3 py-3 whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}

        {/* API URL for debugging */}
        <p className="mt-4 text-[11px] text-slate-500">
          API: {API_URL}/order
        </p>
      </div>
    </div>
  );
}
