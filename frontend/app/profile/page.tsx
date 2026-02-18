"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API;

type Order = {
  _id: string;
  service: string;
  prompt: string;
  date: string;
};

type UserData = {
  email: string;
  credits: number;
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = window.localStorage.getItem("bhaavai_userId");
    const email = window.localStorage.getItem("bhaavai_email");
    const creditsStr = window.localStorage.getItem("bhaavai_credits");

    if (!id) {
      setUserId(null);
      setLoadingUser(false);
      setLoadingOrders(false);
      return;
    }

    setUserId(id);

    // Start with local info
    setUser({
      email: email || "customer",
      credits: creditsStr ? Number(creditsStr) : 0,
    });

    if (!API_BASE) {
      setLoadingUser(false);
      setLoadingOrders(false);
      return;
    }

    // Fetch fresh user
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
          if (data.user.email) {
            window.localStorage.setItem("bhaavai_email", data.user.email);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingUser(false);
      }
    })();

    // Fetch orders
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/user/${id}`);
        const data = await res.json();
        if (data?.status === "ok" && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch {
        // ignore
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("bhaavai_userId");
      window.localStorage.removeItem("bhaavai_email");
      window.localStorage.removeItem("bhaavai_credits");
      window.location.href = "/login";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              B
            </div>
            <a href="/" className="font-semibold tracking-tight">
              BhaavAI
            </a>
            <a
              href="/pricing"
              className="ml-3 text-[11px] text-slate-400 hover:text-emerald-300"
            >
              Pricing
            </a>
            <a
              href="/profile"
              className="ml-3 text-[11px] text-emerald-300"
            >
              Profile
            </a>
          </div>

          {userId ? (
            <button
              onClick={handleLogout}
              className="text-[11px] border border-slate-700 rounded-full px-3 py-1 hover:bg-slate-800"
            >
              Logout
            </button>
          ) : (
            <a
              href="/login"
              className="text-[11px] bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium hover:bg-emerald-400"
            >
              Log in
            </a>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[1.3fr,1.7fr] gap-6 items-start">
        {/* Left: user info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm">
            <h1 className="text-lg font-semibold mb-2">Profile</h1>

            {!userId && (
              <p className="text-xs text-slate-400">
                You are not logged in.{" "}
                <a
                  href="/login"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Log in
                </a>{" "}
                to see your credits and history.
              </p>
            )}

            {userId && (
              <>
                {loadingUser ? (
                  <p className="text-xs text-slate-400">
                    Loading your account…
                  </p>
                ) : user ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">User ID: </span>
                      <code className="text-[10px] break-all text-slate-300">
                        {userId}
                      </code>
                    </div>
                    <div>
                      <span className="text-slate-400">Email: </span>
                      <span className="text-slate-200">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Credits: </span>
                      <span className="text-emerald-300 font-semibold">
                        {user.credits}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Every time you generate content or images, credits are
                      deducted from this balance.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-400">
                    Could not load your account data.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="text-sm font-semibold mb-1">
              Connect your own frontend
            </h2>
            <p className="text-slate-400">
              You can use the same user ID and credits in any other frontend
              you build. Just store{" "}
              <code className="font-mono text-[10px]">
                bhaavai_userId
              </code>{" "}
              in <code className="font-mono text-[10px]">localStorage</code>{" "}
              and call the customer API with it.
            </p>
          </div>
        </div>

        {/* Right: history */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm">
          <h2 className="text-sm font-semibold mb-2">Recent activity</h2>

          {!userId && (
            <p className="text-xs text-slate-400">
              Log in to see your recent generations.
            </p>
          )}

          {userId && (
            <>
              {loadingOrders ? (
                <p className="text-xs text-slate-400">
                  Loading your orders…
                </p>
              ) : orders.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No orders yet. Go to{" "}
                  <a
                    href="/"
                    className="text-emerald-400 underline hover:text-emerald-300"
                  >
                    the home page
                  </a>{" "}
                  and generate your first content or image.
                </p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 text-xs">
                  {orders.slice(0, 15).map((o) => (
                    <div
                      key={o._id}
                      className="border border-slate-800 rounded-md p-2 bg-slate-950/70"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="uppercase tracking-[0.15em] text-slate-500 text-[10px]">
                          {o.service}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(o.date).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        <span className="font-semibold">Prompt: </span>
                        {o.prompt.length > 100
                          ? o.prompt.slice(0, 100) + "…"
                          : o.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
