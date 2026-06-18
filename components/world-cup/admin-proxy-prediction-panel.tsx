"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { MATCH_DRAW_PICK } from "@/lib/domain/world-cup/match-outcome";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import {
  adminSaveMatchBonusAnswerForUser,
  adminSaveMatchPickForUser,
  loadMemberPredictionsForMatch,
} from "@/app/(authenticated)/contests/[contestId]/events/[eventId]/admin-actions";
import { cn } from "@/lib/utils";

export type AdminGroupMemberOption = {
  userId: string;
  displayName: string;
};

export function AdminProxyPredictionPanel({
  contestId,
  eventId,
  matchId,
  homeTeam,
  awayTeam,
  allowDraw,
  locked,
  members,
  bonusPrompts,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  allowDraw: boolean;
  locked: boolean;
  members: AdminGroupMemberOption[];
  bonusPrompts: MatchBonusPrompt[];
}) {
  const router = useRouter();
  const [targetUserId, setTargetUserId] = useState("");
  const [pick, setPick] = useState("");
  const [savedPick, setSavedPick] = useState<string | null>(null);
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string>>({});
  const [loadingMember, setLoadingMember] = useState(false);
  const [pickPending, setPickPending] = useState(false);
  const [pickMessage, setPickMessage] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [bonusPendingByPrompt, setBonusPendingByPrompt] = useState<Record<string, boolean>>({});
  const [bonusMessageByPrompt, setBonusMessageByPrompt] = useState<Record<string, string>>({});
  const [bonusErrorByPrompt, setBonusErrorByPrompt] = useState<Record<string, string>>({});

  const options = allowDraw ? [homeTeam, MATCH_DRAW_PICK, awayTeam] : [homeTeam, awayTeam];

  useEffect(() => {
    if (!targetUserId) {
      setPick("");
      setSavedPick(null);
      setBonusAnswers({});
      return;
    }

    let cancelled = false;
    setLoadingMember(true);
    setPickError(null);
    setPickMessage(null);

    void loadMemberPredictionsForMatch(contestId, matchId, targetUserId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setPickError(result.error);
        setPick("");
        setSavedPick(null);
        setBonusAnswers({});
      } else {
        setPick(result.predictedWinner ?? "");
        setSavedPick(result.predictedWinner);
        setBonusAnswers(result.bonusAnswers);
      }
      setLoadingMember(false);
    });

    return () => {
      cancelled = true;
    };
  }, [contestId, matchId, targetUserId]);

  async function savePick() {
    if (locked || !targetUserId || !pick) return;
    setPickPending(true);
    setPickError(null);
    setPickMessage(null);
    const result = await adminSaveMatchPickForUser(
      contestId,
      eventId,
      matchId,
      targetUserId,
      pick,
    );
    if (!result.ok) {
      setPickError(result.error);
    } else {
      setSavedPick(pick);
      setPickMessage(worldCupCopy.admin.predictionSaved);
      router.refresh();
    }
    setPickPending(false);
  }

  async function saveBonus(promptId: string, answer: string) {
    if (locked || !targetUserId || !answer) return;
    setBonusPendingByPrompt((prev) => ({ ...prev, [promptId]: true }));
    setBonusErrorByPrompt((prev) => ({ ...prev, [promptId]: "" }));
    setBonusMessageByPrompt((prev) => ({ ...prev, [promptId]: "" }));

    const result = await adminSaveMatchBonusAnswerForUser(
      contestId,
      eventId,
      matchId,
      targetUserId,
      promptId,
      answer,
    );

    if (!result.ok) {
      setBonusErrorByPrompt((prev) => ({ ...prev, [promptId]: result.error }));
    } else {
      setBonusMessageByPrompt((prev) => ({
        ...prev,
        [promptId]: worldCupCopy.bonus.saved,
      }));
      router.refresh();
    }
    setBonusPendingByPrompt((prev) => ({ ...prev, [promptId]: false }));
  }

  if (members.length === 0) return null;

  return (
    <details className="rounded-lg border border-amber-400/30 bg-amber-400/5 text-sm">
      <summary className="cursor-pointer px-3 py-2 font-medium touch-manipulation">
        {worldCupCopy.admin.panelTitle}
      </summary>
      <div className="space-y-4 border-t border-amber-400/20 p-3">
        <p className="text-xs text-muted-foreground">{worldCupCopy.admin.panelHint}</p>

        <label className="block space-y-1">
          <span className="text-xs font-medium">{worldCupCopy.admin.memberLabel}</span>
          <select
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            className="neon-input h-10 w-full rounded-md px-3 text-sm"
          >
            <option value="">{worldCupCopy.admin.chooseMember}</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>

        {targetUserId ? (
          loadingMember ? (
            <p className="text-xs text-muted-foreground">{worldCupCopy.admin.loadingMember}</p>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                  {worldCupCopy.admin.winnerPickLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((team) => (
                    <label
                      key={team}
                      className={cn(
                        "flex min-h-10 min-w-0 flex-1 basis-[calc(33.333%-0.5rem)] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm touch-manipulation",
                        pick === team && !locked
                          ? "border-primary bg-primary/5"
                          : "border-white/10 hover:bg-white/10",
                        locked && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <input
                        type="radio"
                        name={`admin-winner-${eventId}`}
                        value={team}
                        checked={pick === team}
                        disabled={locked}
                        onChange={() => setPick(team)}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate font-medium">{team}</span>
                    </label>
                  ))}
                </div>
                {!locked ? (
                  <Button
                    type="button"
                    className="h-10 w-full touch-manipulation sm:w-auto"
                    size="cta-compact"
                    disabled={pickPending || !pick}
                    onClick={savePick}
                  >
                    {savedPick
                      ? worldCupCopy.admin.updatePrediction
                      : worldCupCopy.admin.savePrediction}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {worldCupCopy.matchStatus.locked}
                  </p>
                )}
                {pickMessage ? (
                  <p className="text-xs font-medium text-status-success">{pickMessage}</p>
                ) : null}
                {pickError ? <p className="text-xs text-destructive">{pickError}</p> : null}
              </div>

              {bonusPrompts.map((prompt) => {
                const answer = bonusAnswers[prompt.id] ?? "";
                const pending = bonusPendingByPrompt[prompt.id] ?? false;
                return (
                  <div
                    key={prompt.id}
                    className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-card/50 p-3"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      {worldCupCopy.bonus.sectionTitle}
                    </p>
                    <p className="text-sm font-medium text-white">{prompt.promptText}</p>
                    <div className="flex flex-wrap gap-2">
                      {prompt.options.map((opt) => (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex min-h-9 min-w-0 flex-1 basis-[calc(50%-0.25rem)] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-2 py-1.5 touch-manipulation",
                            answer === opt.value && !locked
                              ? "border-primary bg-primary/5"
                              : "border-border",
                            locked && "cursor-not-allowed opacity-70",
                          )}
                        >
                          <input
                            type="radio"
                            name={`admin-bonus-${prompt.id}`}
                            value={opt.value}
                            checked={answer === opt.value}
                            disabled={locked}
                            onChange={() =>
                              setBonusAnswers((prev) => ({
                                ...prev,
                                [prompt.id]: opt.value,
                              }))
                            }
                            className="h-4 w-4 shrink-0"
                          />
                          <span className="truncate text-xs font-medium text-white">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {!locked ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 w-full text-xs touch-manipulation sm:w-auto"
                        disabled={pending || !answer}
                        onClick={() => saveBonus(prompt.id, answer)}
                      >
                        {bonusAnswers[prompt.id]
                          ? worldCupCopy.admin.updateBonus
                          : worldCupCopy.admin.saveBonus}
                      </Button>
                    ) : null}
                    {bonusMessageByPrompt[prompt.id] ? (
                      <p className="text-xs text-status-success">
                        {bonusMessageByPrompt[prompt.id]}
                      </p>
                    ) : null}
                    {bonusErrorByPrompt[prompt.id] ? (
                      <p className="text-xs text-destructive">
                        {bonusErrorByPrompt[prompt.id]}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </>
          )
        ) : null}
      </div>
    </details>
  );
}
