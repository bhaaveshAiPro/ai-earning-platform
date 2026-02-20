"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  userId: string;
  email: string;
  credits: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Try both keys, depending on what you used earlier
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("ai-saas-user") ||
            localStorage.getItem("user")
          : null;

      if (!raw) {
        // Not logged in → go to login
        router.replace("/login");
        return;
      }

      const parsed = JSON.parse(raw) as StoredUser;

      if (!parsed?.userId || !parsed?.email) {
        router.replace("/login");
        return;
      }

      setUser(parsed);
    } catch (err) {
      console.error("Failed to read stored user:", err);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("ai-saas-user");
      localStorage.removeItem("user");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  const goToGenerateText = () => {
    router.push("/generate-text");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!user) {
    return null; // redirect already triggered
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#020617] border border-slate-800 shadow-xl p-8 md:p-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-300 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* User info */}
        <div className="space-y-2 mb-8">
          <p className="text-sm text-slate-400">Email</p>
          <p className="font-mono text-sm md:text-base break-all">
            {user.email}
          </p>

          <p className="text-sm text-slate-400 mt-4">Credits</p>
          <p className="text-lg font-semibold">{user.credits}</p>
        </div>

        {/* Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={goToGenerateText}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-medium py-3 px-4 transition-colors"
          >
            ✨ Generate AI Text
          </button>

          <button
           type="button"
           onClick={() => router.push("/add-credits")}
           className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 text-sm font-medium py-3 px-4 text-slate-200 hover:bg-slate-900 transition-colors"
>
           <span role="img" aria-label="card">
           💳
          </span>
           Add More Credits
          </button>
        </div>

        {/* Info block */}
        <div className="mt-8 text-xs md:text-sm text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">
            Here you will later see:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Buttons to generate images & chatbots</li>
            <li>Your recent AI orders</li>
            <li>Link to add more credits via payment request</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
