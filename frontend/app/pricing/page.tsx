"use client";

import { useEffect, useState } from "react";
import PaymentInfo from "../../components/PaymentInfo";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API;

type UserInfo = {
  email: string;
  credits: number;
};

export default function PricingPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user info from localStorage and (optionally) refresh from backend
  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = window.localStorage.getItem("bhaavai_userId");
    const email = window.localStorage.getItem("bhaavai_email");
    const creditsStr = window.localStorage.getItem("bhaavai_credits");

    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Start with local values
    setUser({
      email: email || "customer",
      credits: creditsStr ? Number(creditsStr) : 0,
    });

    // If no API base, stop here
    if (!API_BASE) {
      setLoading(false);
      return;
    }

    // Refresh from backend
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/user/${id}`);
        const data = await res.json();
        if (data?.status === "ok" && data.user) {
          setUser({
            email: data.user.email,
            credits: data.user.credits ?? 0,
          });
          window.localStorage.setItem(
            "bhaavai_credits",
            String(data.user.credits ?? 0)
          );
        }
      } catch {
        // ignore network errors for now
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "$9",
      description: "Test your AI SaaS idea.",
      credits: "5,000 credits",
      bestFor: "Solo creators and small tests",
    },
    {
      name: "Pro",
      price: "$29",
      description: "Grow with paying customers.",
      credits: "25,000 credits",
      bestFor: "Freelancers and first 50+ users",
      highlight: true,
    },
    {
      name: "Agency",
      price: "$79",
      description: "Handle many client projects.",
      credits: "100,000 credits",
      bestFor: "Agencies and resellers",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              B
            </div>
            <span className="font-semibold tracking-tight">BhaavAI</span>
            <a
              href="/pricing"
              className="ml-4 text-[11px] text-slate-400 hover:text-emerald-300"
            >
              Pricing
            </a>
            <a
              href="/profile"
              className="ml-3 text-[11px] text-slate-400 hover:text-emerald-300"
            >
              Profile
            </a>
          </div>

          <div className="text-[11px] text-slate-400">
            {loading ? (
              <>Loading account…</>
            ) : user ? (
              <>
                Logged in as{" "}
                <span className="text-slate-200">{user.email}</span> • Credits:{" "}
                <span className="text-emerald-300">{user.credits}</span>
              </>
            ) : (
              <>
                Not logged in.{" "}
                <a
                  href="/login"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Log in
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            PRICING
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Simple credit-based pricing.
          </h1>
          <p className="text-sm text-slate-400">
            You pay once, we top up your credits. Your AI backend is ready
            to serve your users 24/7.
          </p>
          <p className="text-[11px] text-slate-500">
            1 credit ≈ 1 short text generation or a fraction of an image.
            You can adjust pricing when you resell to your customers.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-5 bg-slate-900/70 shadow-xl text-sm flex flex-col justify-between ${
                plan.highlight
                  ? "border-emerald-500/70 shadow-emerald-500/20 shadow-lg"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.highlight && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-300">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400">/ one-time</span>
                </div>
                <p className="text-xs text-slate-400">{plan.description}</p>
                <p className="text-xs text-emerald-300 font-medium">
                  {plan.credits}
                </p>
                <p className="text-[11px] text-slate-500">
                  Best for: {plan.bestFor}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button className="w-full rounded-md bg-emerald-500 text-slate-950 font-semibold py-2 text-xs hover:bg-emerald-400">
                  Choose {plan.name}
                </button>

                <p className="text-[10px] text-slate-500 text-center">
                  After payment, your credits are added manually in the admin
                  panel.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="grid md:grid-cols-[2fr,1fr] gap-6 items-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm">
            <h2 className="text-base font-semibold mb-2">
              How payments work
            </h2>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
              <li>Choose a plan (Starter / Pro / Agency).</li>
              <li>Send payment using PayPal or bank wire.</li>
              <li>
                After payment is confirmed, you open the admin dashboard and
                increase your customer&apos;s credits.
              </li>
            </ol>
            <p className="mt-3 text-[11px] text-slate-500">
              Later, you can integrate automatic webhooks and fully automate
              top-ups. For now this simple flow is enough to start making
              money.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
            <h3 className="text-sm font-semibold mb-2">
              PayPal / bank details
            </h3>
            <PaymentInfo />
          </div>
        </div>
      </section>
    </main>
  );
}
