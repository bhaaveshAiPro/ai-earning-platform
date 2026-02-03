"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API || "http://localhost:3002";
  

const PLANS = [
  {
    name: "Starter",
    price: "$9",
    period: "per month",
    credits: "500 credits / month",
    bestFor: "Trying out BhaavAI for small projects.",
    key: "starter",
    highlight: false,
    features: [
      "500 generation credits / month",
      "Access to text & image tools",
      "Email support",
      "Cancel anytime",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    credits: "3,000 credits / month",
    bestFor: "Freelancers & creators selling AI services.",
    key: "pro",
    highlight: true,
    features: [
      "3,000 generation credits / month",
      "Priority processing",
      "Early access to new models",
      "Basic white-label options",
    ],
  },
  {
    name: "Agency",
    price: "$99",
    period: "per month",
    credits: "15,000 credits / month",
    bestFor: "Agencies and teams with multiple clients.",
    key: "agency",
    highlight: false,
    features: [
      "15,000 credits / month",
      "Higher rate limits",
      "Dedicated Slack support",
      "Custom onboarding & setup",
    ],
  },
];

export default function PricingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Load logged-in user info from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("bhaavai_userId");
    const mail = localStorage.getItem("bhaavai_email");
    const creditsStr = localStorage.getItem("bhaavai_credits");

    if (id) setUserId(id);
    if (mail) setEmail(mail);
    if (creditsStr) setCredits(Number(creditsStr));
  }, []);

  async function handleFakePurchase(planKey: string, planName: string) {
    if (!userId) {
      // Not logged in -> send to login
      window.location.href = "/login";
      return;
    }

    try {
      setStatus(null);
      setLoadingPlan(planKey);

      const res = await fetch(`${API_BASE}/purchase/fake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan: planKey, // "starter" / "pro" / "agency"
        }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setStatus(
          `✅ Fake purchase successful: ${data.message}. New credits: ${data.credits}.`
        );
        setCredits(data.credits);
        if (typeof window !== "undefined") {
          localStorage.setItem("bhaavai_credits", String(data.credits));
        }
      } else {
        setStatus("❌ " + (data.message || "Purchase failed"));
      }
    } catch (err: any) {
      setStatus("❌ " + (err.message || "Purchase failed"));
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                B
              </div>
              <span className="font-semibold tracking-tight">BhaavAI</span>
            </Link>
            <Link
              href="/"
              className="ml-4 text-[11px] text-slate-400 hover:text-emerald-300"
            >
              Home
            </Link>
            <span className="ml-3 text-[11px] text-emerald-300">Pricing</span>
            <Link
              href="/profile"
              className="ml-3 text-[11px] text-slate-400 hover:text-emerald-300"
            >
              Profile
            </Link>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {userId ? (
              <span className="text-emerald-300">
                {email || "Logged in"} • Credits:{" "}
                {credits !== null ? credits : "…"}
              </span>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border border-slate-700 rounded-full px-3 py-1 hover:bg-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium hover:bg-emerald-400"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero + plans */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero text */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 mb-2">
            SIMPLE USAGE-BASED PRICING
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Choose a plan, plug in your brand,
            <br />
            start selling AI in a day.
          </h1>
          <p className="text-sm text-slate-400">
            Every plan comes with text & image generation, per-user credit
            tracking, and an admin dashboard to manage your customers. Upgrade
            or downgrade anytime.
          </p>
        </div>

        {/* Dev banner */}
        <div className="max-w-2xl mx-auto mb-6 text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          {userId ? (
            <>
              <div className="font-semibold mb-1">
                Developer mode: fake purchases enabled 💳
              </div>
              <p className="text-slate-400">
                You are logged in as{" "}
                <span className="text-slate-100">{email}</span> with{" "}
                <span className="text-emerald-300">
                  {credits !== null ? credits : "…"}
                </span>{" "}
                credits. Clicking{" "}
                <span className="font-semibold">
                  “Add credits with this plan”
                </span>{" "}
                will instantly add demo credits to your account, without any
                real payment.
              </p>
            </>
          ) : (
            <>
              <div className="font-semibold mb-1">
                Log in to simulate purchases
              </div>
              <p className="text-slate-400">
                To test credit top-ups, first{" "}
                <Link
                  href="/login"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  log in or create an account
                </Link>
                . Then come back here and use the fake purchase buttons.
              </p>
            </>
          )}
        </div>

        {status && (
          <div className="max-w-2xl mx-auto mb-6 text-[11px] text-slate-100 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
            {status}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-5 flex flex-col justify-between ${
                plan.highlight
                  ? "border-emerald-500 bg-slate-900/70 shadow-xl shadow-emerald-900/30"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 right-4 text-[10px] px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-semibold tracking-wide">
                  MOST POPULAR
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
                <p className="text-[11px] text-slate-400 mb-3">
                  {plan.bestFor}
                </p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="text-[11px] text-slate-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300 mb-4">
                  {plan.credits}
                </p>

                <ul className="text-[11px] text-slate-300 space-y-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[2px] h-[6px] w-[6px] rounded-full bg-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-2 space-y-2">
                {/* Normal CTA (go to login / signup) */}
                <Link
                  href="/login"
                  className={`block w-full text-center rounded-md py-2 text-xs font-semibold ${
                    plan.highlight
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "border border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  Get started with {plan.name}
                </Link>

                {/* Fake purchase button (dev/demo) */}
                <button
                  type="button"
                  onClick={() =>
                    handleFakePurchase(plan.key, plan.name)
                  }
                  disabled={loadingPlan === plan.key}
                  className="block w-full text-center rounded-md py-2 text-[11px] font-medium border border-dashed border-emerald-500 text-emerald-300 hover:bg-slate-900 disabled:opacity-60"
                >
                  {loadingPlan === plan.key
                    ? "Adding demo credits…"
                    : "Add credits with this plan (demo)"}
                </button>

                <p className="text-[10px] text-slate-500 text-center">
                  No real payment is made. This is only for testing your credit
                  flow.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ-ish footer text */}
        <div className="mt-10 grid md:grid-cols-3 gap-5 text-[11px] text-slate-400">
          <div>
            <h3 className="text-slate-200 font-semibold mb-1">
              How do credits work?
            </h3>
            <p>
              Each generation uses 1 credit by default. You can change the
              “credits per request” logic in the backend and expose it in your
              own UI however you like.
            </p>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-1">
              Can I resell access?
            </h3>
            <p>
              Yes. BhaavAI is built for reselling. Attach this backend to your
              own frontend, add Stripe or PayPal, and charge your customers
              while we keep track of their usage.
            </p>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-1">
              Can I change plans later?
            </h3>
            <p>
              Absolutely. You can move between Starter, Pro, and Agency as your
              usage grows. In production you&rsquo;ll map these plans to your
              Stripe or payment provider.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
