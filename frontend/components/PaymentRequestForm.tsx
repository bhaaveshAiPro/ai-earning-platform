"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API;

const PLANS = [
  { name: "Starter", amount: 9, credits: 5000 },
  { name: "Pro", amount: 29, credits: 25000 },
  { name: "Agency", amount: 79, credits: 100000 },
] as const;

export default function PaymentRequestForm() {
  const [plan, setPlan] = useState<(typeof PLANS)[number]["name"]>("Pro");
  const [method, setMethod] = useState<"paypal" | "bank">("paypal");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = PLANS.find((p) => p.name === plan)!;

  async function submit() {
    setMessage(null);

    if (!API_BASE) {
      setMessage("❌ Missing NEXT_PUBLIC_CUSTOMER_API in Vercel env.");
      return;
    }

    const userId = window.localStorage.getItem("bhaavai_userId");
    const email = window.localStorage.getItem("bhaavai_email");

    if (!userId || !email) {
      setMessage("❌ Please log in first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/payments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          plan: selected.name,
          amount: selected.amount,
          currency: "USD",
          method,
          paypalEmail: "bhaaveshsonaram@gmail.com",
          transactionId: transactionId.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        throw new Error(data.message || "Request failed");
      }

      setMessage("✅ Request submitted. Admin will approve and add credits.");
      setTransactionId("");
      setNote("");
    } catch (err: any) {
      setMessage("❌ " + (err.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="text-sm font-semibold mb-2 text-slate-100">
        After you pay (submit request)
      </h3>

      <div className="space-y-2 text-xs">
        <label className="block text-slate-300">Plan</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
          value={plan}
          onChange={(e) => setPlan(e.target.value as any)}
        >
          {PLANS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} — ${p.amount} — {p.credits.toLocaleString()} credits
            </option>
          ))}
        </select>

        <label className="block text-slate-300 mt-2">Payment method</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
        >
          <option value="paypal">PayPal</option>
          <option value="bank">Bank (coming soon)</option>
        </select>

        <label className="block text-slate-300 mt-2">
          Transaction ID (optional)
        </label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Paste PayPal Transaction ID"
        />

        <label className="block text-slate-300 mt-2">Note (optional)</label>
        <textarea
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs min-h-[70px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: Paid already / approve please"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="mt-2 w-full rounded-md bg-emerald-500 text-slate-950 font-semibold py-2 text-xs hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "I paid — Submit request"}
        </button>

        {message && (
          <div className="mt-2 rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
