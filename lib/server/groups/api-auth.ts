import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapGroupError } from "@/lib/server/groups/error-messages";
import { GroupAccessError } from "@/lib/server/groups/guards";

export async function getAuthenticatedSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}

export function groupErrorResponse(error: unknown) {
  if (error instanceof GroupAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: mapGroupError(error) }, { status: 400 });
}
