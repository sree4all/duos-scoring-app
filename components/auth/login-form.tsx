"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm({ redirectPath = "/contests" }: { redirectPath?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const callbackNext = encodeURIComponent(redirectPath);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${callbackNext}`,
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${callbackNext}`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email for the magic link.");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <Button
        type="button"
        size="cta"
        className="w-full"
        disabled={loading}
        onClick={signInWithGoogle}
      >
        Continue with Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
        <label className="text-body-dense font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="neon-input"
          placeholder="you@example.com"
        />
        <Button type="submit" variant="secondary" size="cta-compact" disabled={loading}>
          Email me a magic link
        </Button>
      </form>
      {message ? (
        <p className="text-center text-caption">{message}</p>
      ) : null}
    </div>
  );
}
