"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API || process.env.NEXT_PUBLIC_CUSTOMER_API;


type Order = {
  _id: string;
  service: string;
  prompt: string;
  result: string;
  date: string;
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = localStorage.getItem("bhaavai_userId");
    const mail = localStorage.getItem("bhaavai_email");
    const creditsStr = localStorage.getItem("bhaavai_credits");

    if (!id) {
      setMessage("You are not logged in. Go to /login.");
      setLoading(false);
      return;
    }

    setUserId(id);
    setEmail(mail);
    if (creditsStr) setCredits(Number(creditsStr));

    async function fetchData() {
      try {
        // Refresh user info (credits)
        const userRes = await fetch(`${API_BASE}/auth/user/${id}`);
        const userData = await userRes.json();
        if (userData?.user) {
          setCredits(userData.user.credits);
          localStorage.setItem(
            "bhaavai_credits",
            String(userData.user.credits)
          );
        }

        // Fetch orders
        const ordersRes = await fetch(`${API_BASE}/orders/user/${id}`);
        const ordersData = await ordersRes.json();
        if (ordersData?.orders) {
          setOrders(ordersData.orders);
        }
      } catch (err: any) {
        setMessage(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-2">My Profile</h1>
        <p className="text-xs text-slate-400 mb-4">
          View your account details and recent generations.
        </p>

        {message && (
          <div className="mb-4 text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
            {message}
          </div>
        )}

        {loading && <p className="text-xs text-slate-400">Loading…</p>}

        {!loading && !message && (
          <>
            {/* Account card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-xs flex justify-between items-center">
              <div>
                <div className="text-slate-400">Email</div>
                <div className="text-slate-100 text-sm">
                  {email || "Unknown"}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Credits</div>
                <div className="text-emerald-300 text-lg font-semibold text-right">
                  {credits ?? "—"}
                </div>
              </div>
            </div>

            {/* History card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-sm">Recent generations</h2>
                <span className="text-slate-500 text-[11px]">
                  Showing {orders.length} latest
                </span>
              </div>

              {orders.length === 0 && (
                <p className="text-slate-500 text-[11px]">
                  No generations yet. Try creating some on the homepage.
                </p>
              )}

              {orders.length > 0 && (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {orders.map((o) => (
                    <div
                      key={o._id}
                      className="border border-slate-800 rounded-md p-3 bg-slate-950/50"
                    >
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="uppercase tracking-[0.15em] text-slate-500">
                          {o.service}
                        </span>
                        <span className="text-slate-500">
                          {new Date(o.date).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] mb-1">
                        <span className="font-semibold">Prompt: </span>
                        {o.prompt.length > 120
                          ? o.prompt.slice(0, 120) + "…"
                          : o.prompt}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        <span className="font-semibold">Result: </span>
                        {o.result
                          ? o.result.slice(0, 160) +
                            (o.result.length > 160 ? "…" : "")
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
