import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner, assertWorldCupImportEnabled } from "@/lib/server/world-cup/guards";
import { runWorldCupImport } from "@/lib/server/world-cup/import-service";
import { isWorldCupImportEnabled } from "@/lib/server/world-cup/flags";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isWorldCupImportEnabled()) {
      return NextResponse.json({ error: "Import is disabled." }, { status: 403 });
    }

    const auth = await getAuthenticatedSupabaseUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    const body = (await request.json()) as { contestId?: string };
    if (!body.contestId) {
      return NextResponse.json({ error: "contestId is required" }, { status: 400 });
    }

    assertWorldCupImportEnabled();
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const summary = await runWorldCupImport(auth.supabase, groupId, body.contestId);
    if (summary.errors.length) {
      return NextResponse.json({ error: summary.errors.join(" ") }, { status: 400 });
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
