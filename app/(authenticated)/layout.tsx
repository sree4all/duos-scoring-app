import { AppNav } from "@/components/layout/app-nav";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
