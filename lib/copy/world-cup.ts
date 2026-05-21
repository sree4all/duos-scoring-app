export const worldCupCopy = {
  nav: {
    worldCupPicks: "World Cup Picks",
    rummyScores: "Rummy Scores",
    standings: "Standings",
    myPoints: "My Points",
    groups: "Home",
  },
  matchStatus: {
    open: "Open",
    locked: "Locked",
    done: "Done",
    scheduled: "Coming soon",
  },
  errors: {
    notOpenYet: "This round is not open yet. Check back when your group owner opens it.",
    picksClosed: "Picks are closed for this match.",
    pickRejectedAtLock: "The lock time passed. Your pick was not saved.",
    importFailed: "We could not load the schedule. Check the CSV files and try again.",
    ownerOnly: "Only the group owner can do that.",
    voidReasonRequired: "Please say why this match is being voided.",
  },
  placeholderTeam: (name: string) =>
    name.includes("Playoff") || name.includes("TBD") || name.includes("Winner")
      ? "TBD (playoff winner)"
      : name,
} as const;
