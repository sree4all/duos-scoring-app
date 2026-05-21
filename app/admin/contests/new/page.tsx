import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
export default async function PlatformAdminNewContestPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Group owner setup</h1>
        <p className="text-sm text-muted-foreground">
          Contest configuration for informal teams is under your group, not this admin area.
        </p>
        <Link href="/groups" className="text-sm font-medium underline">
          Go to your groups
        </Link>
      </main>
    );
  }

  redirect("/admin");
}
