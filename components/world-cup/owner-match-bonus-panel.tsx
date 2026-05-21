"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";

export function OwnerMatchBonusPanel({
  groupId,
  contestId,
  matchId,
}: {
  groupId: string;
  contestId: string;
  matchId: string;
}) {
  const [prompts, setPrompts] = useState<MatchBonusPrompt[]>([]);
  const [question, setQuestion] = useState("");
  const [choicesText, setChoicesText] = useState("Yes\nNo");
  const [correctPoints, setCorrectPoints] = useState(2);
  const [incorrectPenalty, setIncorrectPenalty] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const base = `/api/groups/${groupId}/contests/${contestId}/matches/${matchId}/bonus-prompts`;

  const load = useCallback(async () => {
    const res = await fetch(base);
    const data = (await res.json()) as { prompts?: MatchBonusPrompt[]; error?: string };
    if (res.ok) setPrompts(data.prompts ?? []);
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPrompt() {
    setPending(true);
    setError(null);
    setMessage(null);
    const lines = choicesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const options = lines.map((label) => ({ label, value: label }));

    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promptText: question,
        options,
        correctPoints,
        incorrectPenalty,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not add bonus question");
    } else {
      setMessage("Bonus question added.");
      setQuestion("");
      await load();
    }
    setPending(false);
  }

  async function setOfficial(promptId: string, correctAnswer: string) {
    setPending(true);
    setError(null);
    const res = await fetch(`${base}/${promptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctAnswer }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) setError(data.error ?? "Update failed");
    else {
      setMessage("Official answer saved.");
      await load();
    }
    setPending(false);
  }

  async function removePrompt(promptId: string) {
    if (!window.confirm("Remove this bonus question for everyone?")) return;
    setPending(true);
    const res = await fetch(`${base}/${promptId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Remove failed");
    } else {
      await load();
    }
    setPending(false);
  }

  return (
    <section className="rounded-lg border bg-muted/20 p-4 text-sm">
      <h3 className="font-medium">{worldCupCopy.bonus.organizerTitle}</h3>
      <p className="mt-1 text-muted-foreground">{worldCupCopy.bonus.organizerHint}</p>

      {prompts.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {prompts.map((p) => (
            <li key={p.id} className="neon-glass-card p-3">
              <p className="font-medium">{p.promptText}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                +{p.correctPoints} / {p.incorrectPenalty} wrong · Choices:{" "}
                {p.options.map((o) => o.label).join(", ")}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex-1 text-xs">
                  {worldCupCopy.bonus.setOfficial}
                  <select
                    className="mt-1 h-10 w-full rounded-md border px-2"
                    value={p.correctAnswer ?? ""}
                    disabled={pending}
                    onChange={(e) => void setOfficial(p.id, e.target.value)}
                  >
                    <option value="">— Pick after match —</option>
                    {p.options.map((o) => (
                      <option key={o.id} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => void removePrompt(p.id)}
                >
                  {worldCupCopy.bonus.removeQuestion}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-3 border-t pt-4">
        <label className="block">
          <span className="font-medium">{worldCupCopy.bonus.questionLabel}</span>
          <input
            className="mt-1 h-11 w-full rounded-md border px-3"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Will there be a penalty shootout?"
          />
        </label>
        <label className="block">
          <span className="font-medium">{worldCupCopy.bonus.choicesLabel}</span>
          <textarea
            className="mt-1 min-h-[80px] w-full rounded-md border px-3 py-2"
            value={choicesText}
            onChange={(e) => setChoicesText(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-medium">{worldCupCopy.bonus.correctPoints}</span>
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-md border px-3"
              value={correctPoints}
              onChange={(e) => setCorrectPoints(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="font-medium">{worldCupCopy.bonus.wrongPoints}</span>
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-md border px-3"
              value={incorrectPenalty}
              onChange={(e) => setIncorrectPenalty(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{worldCupCopy.bonus.pointsHint}</p>
        <Button type="button" disabled={pending || !question.trim()} onClick={() => void addPrompt()}>
          {worldCupCopy.bonus.addQuestion}
        </Button>
      </div>

      {message ? <p className="mt-2 text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-destructive">{error}</p> : null}
    </section>
  );
}
