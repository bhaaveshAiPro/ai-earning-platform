"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API;
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY;

type User = {
  _id: string;
  email: string;
  role?: string;
  credits: number;
  createdAt?: string;
};

type Order = {
  _id: string;
  userId?: string;
  service?: string;
  prompt?: string;
  result?: string;
  date?: string;
  createdAt?: string;
};

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "orders">("users");
  const [msg, setMsg] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [creditsUserId, setCreditsUserId] = useState("");
  const [creditsValue, setCreditsValue] = useState<number>(0);

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("bhaavai_admin_logged_in") === "true";
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      window.location.href = "/admin/login";
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!ADMIN_API) return setMsg("❌ NEXT_PUBLIC_ADMIN_API missing");
    if (!ADMIN_KEY) return setMsg("❌ NEXT_PUBLIC_ADMIN_KEY missing");

    setMsg(null);
    setLoading(true);

    try {
      const [uRes, oRes] = await Promise.all([
        fetch(`${ADMIN_API}/admin/users`, {
          headers: { "X-ADMIN-KEY": ADMIN_KEY },
        }),
        fetch(`${ADMIN_API}/admin/orders`, {
          headers: { "X-ADMIN-KEY": ADMIN_KEY },
        }),
      ]);

      const uData = await uRes.json().catch(() => ({}));
      const oData = await oRes.json().catch(() => ({}));

      if (uRes.ok && uData.status === "ok") setUsers(uData.users || []);
      else setMsg("❌ Users: " + (uData.message || "failed"));

      if (oRes.ok && oData.status === "ok") setOrders(oData.orders || []);
      else setMsg((prev) => (prev ? prev + " | " : "") + "❌ Orders: " + (oData.message || "failed"));
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Request failed"));
    } finally {
      setLoading(false);
    }
  }

  async function setCredits(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!ADMIN_API) return setMsg("❌ NEXT_PUBLIC_ADMIN_API missing");
    if (!ADMIN_KEY) return setMsg("❌ NEXT_PUBLIC_ADMIN_KEY missing");
    if (!creditsUserId.trim()) return setMsg("❌ userId required");

    try {
      setLoading(true);

      const res = await fetch(`${ADMIN_API}/admin/users/set-credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": ADMIN_KEY,
        },
        body: JSON.stringify({ userId: creditsUserId.trim(), credits: Number(creditsValue) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== "ok") {
        return setMsg("❌ " + (data.message || "Failed to set credits"));
      }

      setMsg("✅ Credits updated");
      await refresh();
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Request failed"));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("bhaavai_admin_logged_in");
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              A
            </div>
            <span className="font-semibold text-sm">Admin Dashboard</span>
            <a href="/" className="ml-3 text-[11px] text-slate-400 hover:text-emerald-300">
              Back to site
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={refresh}
              className="border border-slate-700 rounded-full px-3 py-1 hover:bg-slate-900"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={logout}
              className="border border-slate-700 rounded-full px-3 py-1 hover:bg-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {msg && (
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-3 text-xs text-slate-200">
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-full border ${
              tab === "users" ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-2 rounded-full border ${
              tab === "orders" ? "border-emerald-500 text-emerald-300" : "border-slate-700 text-slate-300"
            }`}
          >
            Orders
          </button>
        </div>

        {/* Set credits */}
        <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-3">Set customer credits</h2>
          <form onSubmit={setCredits} className="grid md:grid-cols-3 gap-3 text-xs">
            <input
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2"
              placeholder="User ID (Mongo _id)"
              value={creditsUserId}
              onChange={(e) => setCreditsUserId(e.target.value)}
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2"
              type="number"
              placeholder="Credits"
              value={creditsValue}
              onChange={(e) => setCreditsValue(Number(e.target.value))}
            />
            <button
              className="bg-emerald-500 text-slate-950 rounded-md py-2 font-semibold hover:bg-emerald-400 disabled:opacity-60"
              disabled={loading}
            >
              Update
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-2">
            Tip: you can copy the userId from the Users table below.
          </p>
        </div>

        {/* Users table */}
        {tab === "users" && (
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Users</h2>

            {users.length === 0 ? (
              <p className="text-xs text-slate-400">No users yet.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-3">Email</th>
                      <th className="text-left py-2 pr-3">User ID</th>
                      <th className="text-left py-2 pr-3">Credits</th>
                      <th className="text-left py-2 pr-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-slate-800/60">
                        <td className="py-2 pr-3 text-slate-200">{u.email}</td>
                        <td className="py-2 pr-3 font-mono text-[11px] text-slate-300">{u._id}</td>
                        <td className="py-2 pr-3 text-emerald-300">{u.credits}</td>
                        <td className="py-2 pr-3 text-slate-300">{u.role || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders table */}
        {tab === "orders" && (
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Recent Orders</h2>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400">No orders yet.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-400">
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-3">Service</th>
                      <th className="text-left py-2 pr-3">User ID</th>
                      <th className="text-left py-2 pr-3">Prompt</th>
                      <th className="text-left py-2 pr-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id} className="border-b border-slate-800/60">
                        <td className="py-2 pr-3 text-slate-200">{o.service || "-"}</td>
                        <td className="py-2 pr-3 font-mono text-[11px] text-slate-300">{o.userId || "-"}</td>
                        <td className="py-2 pr-3 text-slate-300">
                          {(o.prompt || "").slice(0, 80)}
                          {(o.prompt || "").length > 80 ? "…" : ""}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">
                          {o.date ? new Date(o.date).toLocaleString() : o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
