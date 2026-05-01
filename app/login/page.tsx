import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/contests");
  }

  const params = await searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Kin Score App</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to participate in contests and view leaderboard updates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error === "auth" ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              Sign-in failed. Try again.
            </p>
          ) : null}
          <LoginForm />
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="underline">
              Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
