interface EventSubmissionPageProps {
  params: Promise<{ contestId: string; eventId: string }>;
}

export default async function EventSubmissionPage({ params }: EventSubmissionPageProps) {
  const { contestId, eventId } = await params;
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Event Submission</h1>
      <p className="text-sm text-muted-foreground">
        Contest: {contestId} | Event: {eventId}
      </p>
    </main>
  );
}
