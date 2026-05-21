"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContestDetailsStep,
  type ContestDetailsValues,
} from "@/components/groups/contest-wizard/contest-details-step";
import { EventsStep, type EventDraft } from "@/components/groups/contest-wizard/events-step";
import { PromptsStep } from "@/components/groups/contest-wizard/prompts-step";
import { ScoringStep } from "@/components/groups/contest-wizard/scoring-step";
import { PublishStep } from "@/components/groups/contest-wizard/publish-step";

const STEPS = ["details", "events", "prompts", "scoring", "publish"] as const;

export function GroupContestWizard({ groupId }: { groupId: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [details, setDetails] = useState<ContestDetailsValues>({
    name: "World Cup 2026",
    formatLabel: "world_cup_prediction",
  });
  const [events, setEvents] = useState<EventDraft[]>([
    { title: "", openAt: "", lockAt: "", sourceMatchId: "" },
  ]);
  const [contestId, setContestId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveConfiguration(body: Record<string, unknown>) {
    const res = await fetch(`/api/groups/${groupId}/contests/configuration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      error?: string;
      contestId?: string;
      errors?: string[];
    };
    if (!res.ok) throw new Error(data.error ?? "Save failed");
    if (data.contestId) setContestId(data.contestId);
    if (data.errors) setErrors(data.errors);
    return data;
  }

  async function onNext() {
    setPending(true);
    setMessage(null);
    try {
      const step = STEPS[stepIndex];
      if (step === "details") {
        const formatLabel =
          details.formatLabel === "world_cup_prediction" ? "prediction" : details.formatLabel;
        const name =
          details.formatLabel === "world_cup_prediction" && !details.name.trim()
            ? "World Cup 2026"
            : details.name;
        await saveConfiguration({
          action: "create_draft",
          name,
          formatLabel,
        });
      } else if (step === "events" && contestId) {
        await saveConfiguration({
          action: "save_events",
          contestId,
          events,
        });
      } else if (step === "publish" && contestId) {
        const isWorldCup = details.formatLabel === "world_cup_prediction";
        const data = await saveConfiguration({
          action: "publish",
          contestId,
          hasEvents:
            isWorldCup || events.some((e) => e.title.trim() && e.sourceMatchId.trim()),
          hasScoringPreset: true,
          hasValidLockPolicy:
            isWorldCup ||
            events.every((e) => !e.lockAt || !e.openAt || e.openAt <= e.lockAt),
        });
        if (data.errors?.length) {
          setErrors(data.errors);
          return;
        }
        setMessage("Contest published.");
      }
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Request failed"]);
    } finally {
      setPending(false);
    }
  }

  const step = STEPS[stepIndex];

  return (
    <div className="space-y-4">
      {step === "details" ? (
        <ContestDetailsStep values={details} onChange={setDetails} />
      ) : null}
      {step === "events" ? (
        <EventsStep
          events={events}
          onChange={setEvents}
          worldCupMode={details.formatLabel === "world_cup_prediction"}
        />
      ) : null}
      {step === "prompts" ? <PromptsStep /> : null}
      {step === "scoring" ? <ScoringStep formatLabel={details.formatLabel} /> : null}
      {step === "publish" ? (
        <PublishStep
          validationErrors={errors}
          worldCupMode={details.formatLabel === "world_cup_prediction"}
        />
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0 || pending}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </Button>
        <Button type="button" disabled={pending} onClick={onNext}>
          {step === "publish" ? "Publish" : "Next"}
        </Button>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}
