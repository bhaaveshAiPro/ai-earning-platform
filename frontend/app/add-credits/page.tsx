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

type Plan = "Starter" | "Pro" | "Agency";

export default function AddCreditsPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  const [plan, setPlan] = useState<Plan>("Starter");
  const [amount, setAmount] = useState<number>(9); // default for Starter
  const [method, setMethod] = useState<"paypal" | "bank">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load logged-in user
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

  // When plan changes, you can auto-set amount
  useEffect(() => {
    if (plan === "Starter") setAmount(9);     // e.g. 9 USD
    if (plan === "Pro") setAmount(29);        // e.g. 29 USD
    if (plan === "Agency") setAmount(99);     // e.g. 99 USD
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/payments/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          email: user.email,
          plan,
          amount,
          currency: "USD",
          method,
          paypalEmail: method === "paypal" ? paypalEmail : "",
          transactionId,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        console.error("Payment request error:", data);
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(
        "Payment request submitted ✅ We will review it and add credits after confirming your payment."
      );
      setTransactionId("");
      setNote("");
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
              Add More Credits
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Logged in as <span className="font-mono">{user.email}</span>
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs md:text-sm text-slate-300 hover:text-emerald-400 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Info */}
        <div className="text-xs md:text-sm text-slate-400 border border-slate-800 rounded-xl px-3 py-3 bg-slate-950/40">
          <p className="font-semibold text-slate-200 mb-1">How this works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Choose a plan and pay via PayPal or bank transfer.</li>
            <li>
              Put your payment reference / transaction ID in the form below.
            </li>
            <li>
              You (the admin) will check the payment and manually approve it in
              the admin panel to add credits.
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan */}
          <div className="grid gap-3 md:grid-cols-3">
            {(["Starter", "Pro", "Agency"] as Plan[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                  plan === p
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="font-semibold">{p}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {p === "Starter" && "Good for testing (e.g. 100 credits)"}
                  {p === "Pro" && "For regular usage (e.g. 500 credits)"}
                  {p === "Agency" && "Heavy usage (e.g. 2,000 credits)"}
                </div>
              </button>
            ))}
          </div>

          {/* Amount */}
          <label className="block text-sm text-slate-300">
            Amount (USD)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </label>

          {/* Method */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Payment Method</p>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  method === "paypal"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                PayPal
              </button>
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  method === "bank"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                Bank transfer
              </button>
            </div>
          </div>

          {/* PayPal email (only if PayPal) */}
          {method === "paypal" && (
            <label className="block text-sm text-slate-300">
              Your PayPal email (where you paid from)
              <input
                type="email"
                className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </label>
          )}

          {/* Transaction ID */}
          <label className="block text-sm text-slate-300">
            Transaction / reference ID
            <input
              type="text"
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500"
              placeholder="The payment reference so you can find it later"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </label>

          {/* Note */}
          <label className="block text-sm text-slate-300">
            Note (optional)
            <textarea
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500 resize-vertical"
              placeholder="Anything else you need to remember about this payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium px-4 py-2 transition-colors"
          >
            {loading ? "Submitting…" : "Submit payment request"}
          </button>
        </form>

        {/* Messages */}
        {error && (
          <p className="text-sm text-red-400 border border-red-500/40 rounded-xl px-3 py-2 bg-red-950/30">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 border border-emerald-500/40 rounded-xl px-3 py-2 bg-emerald-950/20">
            {success}
          </p>
        )}

        <p className="mt-4 text-[11px] text-slate-500">
          API: {API_URL}/payments/request
        </p>
      </div>
    </div>
  );
}