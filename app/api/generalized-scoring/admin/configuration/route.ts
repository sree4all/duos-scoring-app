import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, scope: "admin-configuration" });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
