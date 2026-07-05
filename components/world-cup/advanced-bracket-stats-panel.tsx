"use client";

import { useState } from "react";
import { MOBILE_LIST_INITIAL, MOBILE_LIST_STEP } from "@/lib/world-cup/mobile-list";
import { SeeMoreFooter } from "@/components/ui/see-more-footer";
import { AdvancedBracketStatsVisibilityToggle } from "@/components/world-cup/advanced-bracket-stats-visibility-toggle";

export type MemberAdvancedBracketRow = {
  displayName: string;
  semiFinalistTeams: string[];
  finalistTeams: string[];
  winnerTeam: string | null;
};

function formatTeamList(teams: string[]): string {
  if (teams.length === 0) return "— Not yet";
  return teams.join(", ");
}

export function AdvancedBracketStatsPanel({
  rows,
  groupId,
  contestId,
  canToggleVisibility,
  visibleToMembers,
}: {
  rows: MemberAdvancedBracketRow[];
  groupId: string;
  contestId: string;
  canToggleVisibility: boolean;
  visibleToMembers: boolean;
}) {
  const [visibleRows, setVisibleRows] = useState(MOBILE_LIST_INITIAL);
  const shownRows = rows.slice(0, visibleRows);
  const remainingRows = rows.length - shownRows.length;

  return (
    <div className="space-y-4">
      {canToggleVisibility ? (
        <AdvancedBracketStatsVisibilityToggle
          groupId={groupId}
          contestId={contestId}
          initialVisible={visibleToMembers}
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20 text-left">
              <th className="px-4 py-2 font-medium">Player</th>
              <th className="px-4 py-2 font-medium">Semi-finalists</th>
              <th className="px-4 py-2 font-medium">Finalists</th>
              <th className="px-4 py-2 font-medium">Champion</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shownRows.map((row) => (
              <tr key={row.displayName}>
                <td className="px-4 py-3 font-medium">{row.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatTeamList(row.semiFinalistTeams)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatTeamList(row.finalistTeams)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.winnerTeam?.trim() || "— Not yet"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-muted-foreground">
                  No members in this group yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <SeeMoreFooter
        remaining={remainingRows}
        onShowMore={() =>
          setVisibleRows((n) => Math.min(n + MOBILE_LIST_STEP, rows.length))
        }
      />
    </div>
  );
}
