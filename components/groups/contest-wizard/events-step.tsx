"use client";

export type EventDraft = {
  title: string;
  openAt: string;
  lockAt: string;
  sourceMatchId: string;
};

export function EventsStep({
  events,
  onChange,
  worldCupMode = false,
}: {
  events: EventDraft[];
  onChange: (events: EventDraft[]) => void;
  worldCupMode?: boolean;
}) {
  function updateRow(index: number, patch: Partial<EventDraft>) {
    const next = [...events];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="font-medium">Step 2: Events and lock schedule</h2>
      {worldCupMode ? (
        <p className="text-sm text-muted-foreground">
          Skip manual events for World Cup. After you publish, use{" "}
          <strong>Import schedule</strong> to load all 104 matches from the CSV files.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Link each event to a match id so owner scoring can run after results are entered.
        </p>
      )}
      {!worldCupMode
        ? events.map((ev, index) => (
        <div key={index} className="space-y-2 rounded border p-3">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Event title"
            value={ev.title}
            onChange={(e) => updateRow(index, { title: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm font-mono"
            placeholder="Match UUID (source_match_id)"
            value={ev.sourceMatchId}
            onChange={(e) => updateRow(index, { sourceMatchId: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="datetime-local"
              className="rounded-md border px-3 py-2 text-sm"
              value={ev.openAt}
              onChange={(e) => updateRow(index, { openAt: e.target.value })}
            />
            <input
              type="datetime-local"
              className="rounded-md border px-3 py-2 text-sm"
              value={ev.lockAt}
              onChange={(e) => updateRow(index, { lockAt: e.target.value })}
            />
          </div>
        </div>
          ))
        : null}
      {!worldCupMode ? (
        <button
          type="button"
          className="text-sm underline"
          onClick={() =>
            onChange([
              ...events,
              { title: "", openAt: "", lockAt: "", sourceMatchId: "" },
            ])
          }
        >
          Add event
        </button>
      ) : null}
    </section>
  );
}
