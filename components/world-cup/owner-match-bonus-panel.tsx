"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50";

function parseChoices(choices: string[]): { label: string; value: string }[] {
  return choices
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, value: label }));
}

function ChoiceRadioGroup({
  name,
  options,
  value,
  disabled,
  onChange,
}: {
  name: string;
  options: { label: string; value: string }[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <label
          key={`${name}-${opt.value}`}
          className={cn(
            "flex min-h-10 min-w-0 flex-1 basis-[calc(50%-0.25rem)] cursor-pointer items-center gap-2 rounded-lg border-2 px-2 py-2 touch-manipulation sm:basis-[calc(33.333%-0.5rem)]",
            value === opt.value
              ? "border-primary bg-primary/10"
              : "border-white/15 bg-white/5 hover:bg-white/10",
            disabled && "cursor-not-allowed opacity-70",
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 shrink-0"
          />
          <span className="truncate text-sm font-medium text-white">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

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
  const [choices, setChoices] = useState(["Yes", "No"]);
  const [correctPoints, setCorrectPoints] = useState(2);
  const [incorrectPenalty, setIncorrectPenalty] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const base = `/api/groups/${groupId}/contests/${contestId}/matches/${matchId}/bonus-prompts`;
  const parsedNewChoices = parseChoices(choices);

  const load = useCallback(async () => {
    const res = await fetch(base);
    const data = (await res.json()) as { prompts?: MatchBonusPrompt[]; error?: string };
    if (res.ok) setPrompts(data.prompts ?? []);
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateChoice(index: number, value: string) {
    setChoices((prev) => prev.map((choice, i) => (i === index ? value : choice)));
  }

  function addChoice() {
    setChoices((prev) => [...prev, ""]);
  }

  function removeChoice(index: number) {
    setChoices((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function addPrompt() {
    setPending(true);
    setError(null);
    setMessage(null);
    const options = parseChoices(choices);

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
      setChoices(["Yes", "No"]);
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
    <section className="rounded-lg border border-white/10 bg-muted/20 p-4 text-sm">
      <h3 className="font-medium text-white">{worldCupCopy.bonus.organizerTitle}</h3>
      <p className="mt-1 text-muted-foreground">{worldCupCopy.bonus.organizerHint}</p>

      {prompts.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {prompts.map((p) => (
            <li key={p.id} className="neon-glass-card p-3">
              <p className="font-medium text-white">{p.promptText}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                +{p.correctPoints} / {p.incorrectPenalty} wrong
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-score-positive">
                  {worldCupCopy.bonus.setOfficial}
                </p>
                <div className="mt-2">
                  <ChoiceRadioGroup
                    name={`official-${p.id}`}
                    options={p.options.map((o) => ({ label: o.label, value: o.value }))}
                    value={p.correctAnswer ?? ""}
                    disabled={pending}
                    onChange={(value) => void setOfficial(p.id, value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                disabled={pending}
                onClick={() => void removePrompt(p.id)}
              >
                {worldCupCopy.bonus.removeQuestion}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        <label className="block">
          <span className="font-medium text-white">{worldCupCopy.bonus.questionLabel}</span>
          <input
            className={FIELD_CLASS}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Will there be a penalty shootout?"
          />
        </label>

        <div>
          <span className="font-medium text-white">{worldCupCopy.bonus.choicesLabel}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{worldCupCopy.bonus.choicesHint}</p>
          <ul className="mt-2 space-y-2">
            {choices.map((choice, index) => (
              <li key={index} className="flex items-center gap-2">
                <input
                  className={cn(FIELD_CLASS, "mt-0")}
                  value={choice}
                  onChange={(e) => updateChoice(index, e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  aria-label={`Choice ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-white"
                  disabled={choices.length <= 2}
                  onClick={() => removeChoice(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addChoice}>
            Add choice
          </Button>
          {parsedNewChoices.length >= 2 ? (
            <div className="mt-3 rounded-lg border border-dashed border-white/15 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-score-positive">
                Preview
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Members will pick one of these options:
              </p>
              <div className="mt-2 pointer-events-none opacity-90">
                <ChoiceRadioGroup
                  name="preview-choices"
                  options={parsedNewChoices}
                  value={parsedNewChoices[0]?.value ?? ""}
                  onChange={() => {}}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-medium text-white">{worldCupCopy.bonus.correctPoints}</span>
            <input
              type="number"
              className={FIELD_CLASS}
              value={correctPoints}
              onChange={(e) => setCorrectPoints(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="font-medium text-white">{worldCupCopy.bonus.wrongPoints}</span>
            <input
              type="number"
              className={FIELD_CLASS}
              value={incorrectPenalty}
              onChange={(e) => setIncorrectPenalty(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{worldCupCopy.bonus.pointsHint}</p>
        <Button
          type="button"
          disabled={pending || !question.trim() || parsedNewChoices.length < 2}
          onClick={() => void addPrompt()}
        >
          {worldCupCopy.bonus.addQuestion}
        </Button>
      </div>

      {message ? <p className="mt-2 text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-destructive">{error}</p> : null}
    </section>
  );
}
