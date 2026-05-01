import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, scope: "admin-disputes-list" });
}

export async function POST() {
  return NextResponse.json({ ok: true, scope: "admin-disputes-resolve" });
}
