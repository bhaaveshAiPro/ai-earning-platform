// frontend/app/api/admin/payment-requests/route.ts
import { NextResponse } from "next/server";

const ADMIN_API_URL = process.env.ADMIN_API_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function GET() {
  if (!ADMIN_API_URL || !ADMIN_API_KEY) {
    return NextResponse.json(
      { status: "error", message: "Admin API env vars missing" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `${ADMIN_API_URL}/admin/payment-requests?status=pending`,
      {
        headers: {
          "X-ADMIN-KEY": ADMIN_API_KEY,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error in frontend GET /api/admin/payment-requests:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to reach admin API" },
      { status: 500 }
    );
  }
}