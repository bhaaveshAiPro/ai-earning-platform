"use client";

import { useEffect, useState } from "react";

const ADMIN_API =
  process.env.NEXT_PUBLIC_ADMIN_API || "http://localhost:3003";


type User = {
  _id: string;
  email: string;
  role: string;
  credits: number;
  createdAt: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("admin@bhaavai.com");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditsInput, setCreditsInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load users after login
  useEffect(() => {
    if (loggedIn) {
      fetchUsers();
    }
  }, [loggedIn]);

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${ADMIN_API}/admin/users`);
      const data = await res.json();
      if (data.status === "ok") {
        setUsers(data.users);
      } else {
        setMessage(data.message || "Failed to load users");
      }
    } catch (err: any) {
      setMessage(err.message || "Error loading users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch(`${ADMIN_API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setLoggedIn(true);
        setPassword("");
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    }
  }

  async function handleSetCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    const value = Number(creditsInput);
    if (Number.isNaN(value)) {
      setMessage("Credits must be a number.");
      return;
    }

    try {
      setLoadingAction(true);
      const res = await fetch(`${ADMIN_API}/admin/users/set-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser._id, credits: value }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMessage(
          `Updated credits for ${data.email} to ${data.credits}.`
        );
        setCreditsInput("");
        await fetchUsers();
      } else {
        setMessage(data.message || "Failed to update credits");
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to update credits");
    } finally {
      setLoadingAction(false);
    }
  }

  // ------------- UI --------------

  // Not logged in: show login form
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs">
          <h1 className="text-lg font-semibold mb-1 text-center">
            BhaavAI Admin
          </h1>
          <p className="text-[11px] text-slate-400 mb-4 text-center">
            Log in with your admin credentials.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block mb-1">Admin Email</label>
              <input
                type="email"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 text-slate-950 rounded-md py-2 font-semibold text-xs hover:bg-emerald-400"
            >
              Log in
            </button>
          </form>

          {message && (
            <div className="mt-3 text-[11px] text-red-400 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
              {message}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Logged-in view
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-4 text-xs">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="text-slate-400">
            DB:{" "}
            <span className="font-mono text-slate-300">
              mongodb://127.0.0.1:27017/bhaavai
            </span>
          </div>
        </header>

        {message && (
          <div className="mb-3 text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-700 rounded-md px-3 py-2">
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-[2fr,1.2fr] gap-4">
          {/* Users table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Users</h2>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="border border-slate-700 rounded-full px-3 py-1 text-[11px] hover:bg-slate-800"
              >
                {loadingUsers ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {users.length === 0 && (
              <p className="text-slate-500 text-[11px]">
                No users yet. Create one via /login in the main app.
              </p>
            )}

            {users.length > 0 && (
              <div className="max-h-[340px] overflow-y-auto border border-slate-800 rounded-md">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr className="text-slate-400">
                      <th className="text-left px-2 py-1">Email</th>
                      <th className="text-left px-2 py-1">Role</th>
                      <th className="text-right px-2 py-1">Credits</th>
                      <th className="text-right px-2 py-1">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const selected = selectedUser?._id === u._id;
                      return (
                        <tr
                          key={u._id}
                          className={
                            "cursor-pointer hover:bg-slate-900/80 " +
                            (selected ? "bg-slate-900" : "")
                          }
                          onClick={() => {
                            setSelectedUser(u);
                            setCreditsInput(String(u.credits));
                          }}
                        >
                          <td className="px-2 py-1">{u.email}</td>
                          <td className="px-2 py-1 capitalize">
                            {u.role || "customer"}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {u.credits}
                          </td>
                          <td className="px-2 py-1 text-right text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Credit editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
            <h2 className="font-semibold mb-2">Set user credits</h2>
            {selectedUser ? (
              <form onSubmit={handleSetCredits} className="space-y-3">
                <div>
                  <div className="text-slate-400 text-[11px] mb-1">
                    Selected user
                  </div>
                  <div className="text-slate-100">{selectedUser.email}</div>
                  <div className="text-slate-500 text-[11px]">
                    Current credits: {selectedUser.credits}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-300">
                    New credits value
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs"
                    value={creditsInput}
                    onChange={(e) => setCreditsInput(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full bg-emerald-500 text-slate-950 rounded-md py-2 font-semibold text-xs hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loadingAction ? "Updating…" : "Update credits"}
                </button>
              </form>
            ) : (
              <p className="text-slate-500 text-[11px]">
                Select a user from the table to edit their credits.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
