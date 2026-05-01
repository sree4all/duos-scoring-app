import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, scope: "admin-scoring" });
}

export async function GET() {
  return NextResponse.json({ ok: true, scope: "admin-scoring-status" });
}
