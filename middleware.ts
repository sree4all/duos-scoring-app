import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACTIVE_GROUP_COOKIE,
  applyActiveGroupIdCookie,
} from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import {
  isGroupCreationDisabled,
  isWorldCupPrivateMode,
  getDefaultGroupId,
} from "@/lib/server/world-cup/flags";

const GROUP_ID_PATH =
  /^\/groups\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i;
const CONTEST_ID_PATH =
  /^\/contests\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i;

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  if (isGroupCreationDisabled() && request.nextUrl.pathname === "/groups/new") {
    const url = request.nextUrl.clone();
    url.pathname = "/groups/join";
    return NextResponse.redirect(url);
  }

  if (isGroupScopingEnabled()) {
    const groupMatch = request.nextUrl.pathname.match(GROUP_ID_PATH);
    if (groupMatch) {
      const groupId = groupMatch[1]!;
      if (request.cookies.get(ACTIVE_GROUP_COOKIE)?.value !== groupId) {
        applyActiveGroupIdCookie(supabaseResponse, groupId);
      }
    } else if (isWorldCupPrivateMode()) {
      const contestMatch = request.nextUrl.pathname.match(CONTEST_ID_PATH);
      const defaultGroupId = getDefaultGroupId();
      if (
        contestMatch &&
        defaultGroupId &&
        request.cookies.get(ACTIVE_GROUP_COOKIE)?.value !== defaultGroupId
      ) {
        applyActiveGroupIdCookie(supabaseResponse, defaultGroupId);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
