interface LeaderboardPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { contestId } = await params;
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <p className="text-sm text-muted-foreground">
        Tie-break order: exact hits, then earliest submission.
      </p>
      <p className="text-xs text-muted-foreground">Contest: {contestId}</p>
    </main>
  );
}
