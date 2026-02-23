// frontend/app/api/admin/payment-requests/[id]/approve/route.ts
import { NextResponse } from "next/server";

const ADMIN_API_URL = process.env.ADMIN_API_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!ADMIN_API_URL || !ADMIN_API_KEY) {
    return NextResponse.json(
      { status: "error", message: "Admin API env vars missing" },
      { status: 500 }
    );
  }

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { creditsToAdd, adminNote } = body || {};

  try {
    const res = await fetch(
      `${ADMIN_API_URL}/admin/payment-requests/${id}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": ADMIN_API_KEY,
        },
        body: JSON.stringify({ creditsToAdd, adminNote }),
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(
      "Error in frontend POST /api/admin/payment-requests/[id]/approve:",
      err
    );
    return NextResponse.json(
      { status: "error", message: "Failed to reach admin API" },
      { status: 500 }
    );
  }
}