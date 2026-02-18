"use client";

import PaymentInfo from "../components/PaymentInfo";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_CUSTOMER_API;
const ORDER_ENDPOINT = `${API_BASE}/order`;

type ServiceType = "content" | "image";

type HistoryItem = {
  _id: string;
  service: string;
  prompt: string;
  result: string;
  date: string;
};

export default function Home() {
  const [service, setService] = useState<ServiceType>("content");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load user info
  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = localStorage.getItem("bhaavai_userId");
    const email = localStorage.getItem("bhaavai_email");
    const creditsStr = localStorage.getItem("bhaavai_credits");

    if (id) {
      setUserId(id);
      refreshHistory(id);
      refreshUser(id);
    }

    if (email) setUserEmail(email);
    if (creditsStr) setCredits(Number(creditsStr));
  }, []);

  // -------------------------------
  // Helpers to talk to backend
  // -------------------------------
  async function refreshUser(id: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/user/${id}`);
      const data = await res.json();
      if (data?.status === "ok" && data.user) {
        setCredits(data.user.credits);
        localStorage.setItem("bhaavai_credits", String(data.user.credits));
      }
    } catch {}
  }

  async function refreshHistory(id: string) {
    try {
      const res = await fetch(`${API_BASE}/orders/user/${id}`);
      const data = await res.json();
      if (data?.status === "ok") setHistory(data.orders);
    } catch {}
  }

  // -------------------------------
  // Generate handler
  // -------------------------------
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setResult("❌ Please enter a prompt.");
      return;
    }

    if (!userId) {
      setResult("❌ Please log in first at /login.");
      return;
    }

    try {
      setLoading(true);
      setResult("Generating...");

      const res = await fetch(`${API_BASE}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, prompt, userId }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "completed") {
        setResult("❌ Error: " + (data.message || "Request failed"));
        return;
      }

      // Show AI result
      setResult(data.result);
      refreshUser(userId);
      refreshHistory(userId);
    } catch (err: any) {
      setResult("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    setUserId(null);
    setUserEmail(null);
    setCredits(null);
    setHistory([]);
    setResult(null);
  };

  // Detect if result is an image (URL or base64)
  const isImageResult =
    service === "image" &&
    result &&
    (result.startsWith("http") || result.startsWith("data:image"));

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HEADER */}
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

          <div className="flex items-center gap-3 text-[11px]">
            {userId ? (
              <>
                <span className="text-emerald-300">
                  {userEmail} • Credits: {credits ?? "…"}
                </span>
                <button
                  onClick={handleLogout}
                  className="border border-slate-700 rounded-full px-3 py-1 hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium hover:bg-emerald-400"
              >
                Log in / Register
              </a>
            )}
          </div>
        </div>
      </header>

      {/* MAIN SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
        {/* LEFT SIDE */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            AI AUTOMATION STUDIO
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Launch your AI SaaS in hours, <br />
            not months.
          </h1>

          <p className="text-sm text-slate-400 max-w-lg">
            BhaavAI gives you a ready-made credit-based backend with text and image AI generation.
          </p>

          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Per-user credits stored in MongoDB</li>
            <li>• Text & image generation</li>
            <li>• Admin dashboard to manage users</li>
          </ul>

          <div className="flex gap-3 pt-2 text-xs">
            <a
              href="/login"
              className="bg-emerald-500 text-slate-950 rounded-full px-4 py-2 font-medium hover:bg-emerald-400"
            >
              Get started free
            </a>
            <a
              href="#live-demo"
              className="border border-slate-700 rounded-full px-4 py-2 text-slate-200 hover:bg-slate-900"
            >
              Try live demo
            </a>
          </div>
        </div>

        {/* RIGHT SIDE (DEMO) */}
        <div
          id="live-demo"
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs"
        >
          <h2 className="text-sm font-semibold mb-1">Try BhaavAI live</h2>
          <p className="text-[10px] text-slate-500">
            Backend: <br />
            <code className="font-mono text-[10px] break-all">{ORDER_ENDPOINT}</code>
          </p>

          {/* SERVICE SELECTOR */}
          <div className="mb-3">
            <label className="block mb-1 text-slate-300">Service</label>
           <select
  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
  value={service}
  onChange={(e) => setService(e.target.value as ServiceType)}
>
  <option value="content">Content (text)</option>
  <option value="image">Image</option>
</select>

          </div>

          {/* PROMPT INPUT */}
          <div className="mb-3">
            <label className="block mb-1 text-slate-300">Prompt</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs min-h-[90px]"
              placeholder={
                service === "content"
                  ? "Write a welcome message..."
                  : "A futuristic Evo X in blue..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* GENERATE BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-emerald-500 text-slate-950 rounded-md py-2 text-xs font-semibold"
          >
            {loading ? "Generating..." : "Generate with BhaavAI"}
          </button>

          {/* RESULT */}
          <div className="mt-4">
            <div className="text-slate-300 mb-1">Result</div>

            <div className="bg-slate-900 border border-slate-800 rounded-md p-3 min-h-[80px] overflow-auto">
              {!result && (
                <span className="text-slate-500 text-[11px]">
                  Results will appear here…
                </span>
              )}

              {result && isImageResult && (
                <img
                  src={String(result)}
                  alt="Generated"
                  className="w-full max-h-72 object-contain rounded-md"
                />
              )}

              {result && !isImageResult && (
                <p className="whitespace-pre-wrap text-[11px]">{result}</p>
              )}
            </div>
          </div>

          {/* HISTORY */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Recent history</span>
              <span className="text-slate-500 text-[11px]">
                Showing {Math.min(history.length, 5)} of {history.length}
              </span>
            </div>

            {history.length === 0 ? (
              <p className="text-slate-500 text-[11px]">No previous generations.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {history.slice(0, 5).map((h) => (
                  <div
                    key={h._id}
                    className="border border-slate-800 rounded-md p-2 bg-slate-950"
                  >
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 uppercase tracking-[0.15em]">
                        {h.service}
                      </span>
                      <span className="text-slate-500">
                        {new Date(h.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      <span className="font-semibold">Prompt: </span>
                      {h.prompt.length > 80 ? h.prompt.slice(0, 80) + "…" : h.prompt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-3 text-[11px] text-slate-500 flex justify-between">
            <span>
              {userId ? (
                <>
                  Logged in as{" "}
                  <span className="text-slate-300">{userEmail}</span>
                </>
              ) : (
                <>
                  Not logged in.{" "}
                  <a
                    href="/login"
                    className="text-emerald-400 underline"
                  >
                    Log in
                  </a>
                  .
                </>
              )}
            </span>

            <span>
              Credits:{" "}
              <span className="text-emerald-300">
                {credits !== null ? credits : userId ? "…" : "-"}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* PAYMENT INFO SECTION */}
      <PaymentInfo />
    </main>
  );
}
