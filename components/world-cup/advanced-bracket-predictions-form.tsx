"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import {
  ADVANCED_BRACKET_PICKS,
  reconcileCascadingPicks,
  type AdvancedBracketPicks,
} from "@/lib/domain/world-cup/advanced-bracket";
import {
  visibleFinalistTeams,
  visibleSemiFinalistTeams,
  type ForecastEligibility,
} from "@/lib/domain/world-cup/forecast-eligibility";
import { saveAdvancedBracketPicks } from "@/app/(authenticated)/contests/[contestId]/advanced-predictions/actions";
import { cn } from "@/lib/utils";

function TeamCheckboxGrid({
  teams,
  selected,
  max,
  locked,
  name,
  onChange,
}: {
  teams: string[];
  selected: string[];
  max: number;
  locked: boolean;
  name: string;
  onChange: (next: string[]) => void;
}) {
  function toggle(team: string) {
    if (locked) return;
    if (selected.includes(team)) {
      onChange(selected.filter((t) => t !== team));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, team]);
  }

  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {teams.map((team) => {
        const checked = selected.includes(team);
        const disabled = locked || (!checked && selected.length >= max);
        return (
          <label
            key={team}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2.5 transition-colors touch-manipulation",
              checked ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5",
              disabled && !checked && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="checkbox"
              name={name}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(team)}
              className="h-4 w-4 shrink-0"
            />
            <span className="text-sm font-medium">{team}</span>
          </label>
        );
      })}
    </div>
  );
}

function WinnerRadioList({
  teams,
  selected,
  locked,
  onChange,
}: {
  teams: string[];
  selected: string | null;
  locked: boolean;
  onChange: (team: string) => void;
}) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {teams.map((team) => (
        <label
          key={team}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2.5 transition-colors touch-manipulation",
            selected === team ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5",
            locked && "cursor-not-allowed opacity-70",
          )}
        >
          <input
            type="radio"
            name="winner"
            checked={selected === team}
            disabled={locked}
            onChange={() => onChange(team)}
            className="h-4 w-4 shrink-0"
          />
          <span className="text-sm font-medium">{team}</span>
        </label>
      ))}
    </div>
  );
}

export function AdvancedBracketPredictionsForm({
  contestId,
  eligibility,
  initialPicks,
  locked,
}: {
  contestId: string;
  eligibility: ForecastEligibility;
  initialPicks: AdvancedBracketPicks | null;
  locked: boolean;
}) {
  const router = useRouter();
  const [semiFinalists, setSemiFinalists] = useState<string[]>(
    initialPicks?.semiFinalistTeams ?? [],
  );
  const [finalists, setFinalists] = useState<string[]>(initialPicks?.finalistTeams ?? []);
  const [winner, setWinner] = useState<string | null>(initialPicks?.winnerTeam ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSemiFinalists(initialPicks?.semiFinalistTeams ?? []);
    setFinalists(initialPicks?.finalistTeams ?? []);
    setWinner(initialPicks?.winnerTeam ?? null);
  }, [initialPicks]);

  const semiComplete = semiFinalists.length === ADVANCED_BRACKET_PICKS.semiFinalists;
  const finalistsComplete = finalists.length === ADVANCED_BRACKET_PICKS.finalists;

  const semiFinalistPool = useMemo(
    () => visibleSemiFinalistTeams(eligibility, semiFinalists),
    [eligibility, semiFinalists],
  );
  const finalistPool = useMemo(
    () => visibleFinalistTeams(eligibility, semiFinalists, finalists),
    [eligibility, semiFinalists, finalists],
  );
  const winnerPool = useMemo(() => [...finalists].sort((a, b) => a.localeCompare(b)), [finalists]);

  function handleSemiChange(next: string[]) {
    setSemiFinalists(next);
    const reconciled = reconcileCascadingPicks(next, finalists, winner);
    setFinalists(reconciled.finalistTeams);
    setWinner(reconciled.winnerTeam);
  }

  function handleFinalistsChange(next: string[]) {
    setFinalists(next);
    const reconciled = reconcileCascadingPicks(semiFinalists, next, winner);
    setWinner(reconciled.winnerTeam);
  }

  const hasSaved = Boolean(initialPicks);
  const canSave = useMemo(
    () => semiComplete && finalistsComplete && Boolean(winner),
    [semiComplete, finalistsComplete, winner],
  );

  async function save() {
    if (locked || !winner) return;
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveAdvancedBracketPicks(contestId, {
      semiFinalistTeams: semiFinalists,
      finalistTeams: finalists,
      winnerTeam: winner,
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage(worldCupCopy.advancedBracket.saved);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className="space-y-8">
      <section className="neon-glass-card space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold">{worldCupCopy.advancedBracket.semiFinalists}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {worldCupCopy.advancedBracket.semiFinalistsHint}
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {worldCupCopy.advancedBracket.teamsSelected(
              semiFinalists.length,
              ADVANCED_BRACKET_PICKS.semiFinalists,
            )}
          </p>
        </div>
        <TeamCheckboxGrid
          teams={semiFinalistPool}
          selected={semiFinalists}
          max={ADVANCED_BRACKET_PICKS.semiFinalists}
          locked={locked}
          name="semi"
          onChange={handleSemiChange}
        />
      </section>

      <section
        className={cn(
          "neon-glass-card space-y-4 p-5 transition-opacity",
          !semiComplete && "opacity-60",
        )}
      >
        <div>
          <h2 className="text-base font-semibold">{worldCupCopy.advancedBracket.finalists}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {worldCupCopy.advancedBracket.finalistsHint}
          </p>
          {!semiComplete ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {worldCupCopy.advancedBracket.pickSemiFirst}
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {worldCupCopy.advancedBracket.teamsSelected(
                finalists.length,
                ADVANCED_BRACKET_PICKS.finalists,
              )}
            </p>
          )}
        </div>
        {semiComplete ? (
          <TeamCheckboxGrid
            teams={finalistPool}
            selected={finalists}
            max={ADVANCED_BRACKET_PICKS.finalists}
            locked={locked}
            name="final"
            onChange={handleFinalistsChange}
          />
        ) : null}
      </section>

      <section
        className={cn(
          "neon-glass-card space-y-4 p-5 transition-opacity",
          !finalistsComplete && "opacity-60",
        )}
      >
        <div>
          <h2 className="text-base font-semibold">{worldCupCopy.advancedBracket.winner}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {worldCupCopy.advancedBracket.winnerHint}
          </p>
          {!finalistsComplete ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {worldCupCopy.advancedBracket.pickFinalistsFirst}
            </p>
          ) : null}
        </div>
        {finalistsComplete ? (
          <WinnerRadioList
            teams={winnerPool}
            selected={winner}
            locked={locked}
            onChange={setWinner}
          />
        ) : null}
      </section>

      {!locked ? (
        <Button
          type="button"
          className="w-full touch-manipulation"
          size="cta-compact"
          disabled={pending || !canSave}
          onClick={save}
        >
          {hasSaved ? worldCupCopy.advancedBracket.update : worldCupCopy.advancedBracket.save}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">{worldCupCopy.advancedBracket.locked}</p>
      )}

      {message ? <p className="text-sm font-medium text-status-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
