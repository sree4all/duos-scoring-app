export function GroupDualFormatPanel({ isOwner }: { isOwner: boolean }) {
  return (
    <section className="rounded-lg border border-dashed p-4">
      <h2 className="text-sm font-semibold">Two contest formats in one group</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">Prediction</strong> — match winner picks, per-event
          bonuses, and season bonuses. Each contest has its own leaderboard.
        </li>
        <li>
          <strong className="text-foreground">Points rummy</strong> — owners or designated scorers
          record hands; totals stay inside that contest only (lower cumulative score wins).
        </li>
      </ul>
      {isOwner ? (
        <p className="mt-3 text-sm">
          Create either format from{" "}
          <span className="font-medium text-foreground">Manage contests</span> on this group&apos;s
          settings page.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Ask a group owner to publish contests. You can submit picks or record rummy hands if you
          are a designated scorer.
        </p>
      )}
    </section>
  );
}
