"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StoredUser = {
  userId: string;
  email: string;
  credits: number;
};

const STORAGE_KEY = "ai_user";

export default function DashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredUser;
        if (parsed.userId && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to read user from localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <p>Loading dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="bg-slate-900/70 border border-slate-700 rounded-xl px-8 py-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-4">Not logged in</h1>
          <p className="text-slate-300 mb-6">
            We couldn&apos;t find your session in this browser. Please login again.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-sm font-medium"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
      <div className="bg-slate-900/70 border border-slate-700 rounded-xl px-8 py-6 max-w-xl w-full">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="text-slate-300 mb-2">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p className="text-slate-300 mb-6">
          <span className="font-medium">Credits:</span> {user.credits}
        </p>

        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Here you will later see:
          </p>
          <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
            <li>Buttons to generate text / images / chatbots</li>
            <li>Your recent AI orders</li>
            <li>Link to add more credits via payment request</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
