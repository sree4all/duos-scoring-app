import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseUser, groupErrorResponse } from "@/lib/server/groups/api-auth";
import { requireWorldCupOwner, assertWorldCupImportEnabled } from "@/lib/server/world-cup/guards";
import {
  runWorldCupImport,
  type WorldCupCsvUpload,
} from "@/lib/server/world-cup/import-service";
import { isWorldCupImportEnabled } from "@/lib/server/world-cup/flags";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ groupId: string }> };

async function readCsvUpload(request: Request): Promise<{
  contestId: string;
  csvUpload?: WorldCupCsvUpload;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const contestId = String(form.get("contestId") ?? "").trim();
    const teams = form.get("teams");
    const cities = form.get("cities");
    const stages = form.get("stages");
    const matches = form.get("matches");

    if (
      !(teams instanceof File) ||
      !(cities instanceof File) ||
      !(stages instanceof File) ||
      !(matches instanceof File)
    ) {
      throw new Error(
        "Upload teams.csv, host_cities.csv, tournament_stages.csv, and matches.csv.",
      );
    }

    const csvUpload: WorldCupCsvUpload = {
      teams: await teams.text(),
      cities: await cities.text(),
      stages: await stages.text(),
      matches: await matches.text(),
    };

    return { contestId, csvUpload };
  }

  const body = (await request.json()) as { contestId?: string };
  return { contestId: String(body.contestId ?? "").trim() };
}

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
    const { contestId, csvUpload } = await readCsvUpload(request);
    if (!contestId) {
      return NextResponse.json({ error: "contestId is required" }, { status: 400 });
    }

    assertWorldCupImportEnabled();
    await requireWorldCupOwner(auth.supabase, groupId, auth.user.id);

    const summary = await runWorldCupImport(auth.supabase, groupId, contestId, { csvUpload });
    if (summary.errors.length) {
      return NextResponse.json({ error: summary.errors.join(" ") }, { status: 400 });
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
