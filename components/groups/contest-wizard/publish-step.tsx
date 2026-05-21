"use client";

export function PublishStep({
  validationErrors,
}: {
  validationErrors: string[];
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Step 5: Review and publish</h2>
      <p className="text-sm text-muted-foreground">
        Only group owners can publish. Members will see the contest after publish.
      </p>
      {validationErrors.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-destructive">
          {validationErrors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-green-700">Ready to publish.</p>
      )}
    </section>
  );
}
