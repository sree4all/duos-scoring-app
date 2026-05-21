export const worldCupCopy = {
  nav: {
    worldCupPredictions: "Predictions",
    predictionStats: "Prediction stats",
    rummyScores: "Rummy Scores",
    standings: "Standings",
    myPoints: "My Points",
    groups: "Home",
  },
  prediction: {
    alreadyPredicted: "Already predicted",
    duePrediction: "Due prediction",
    save: "Save prediction",
    update: "Update prediction",
    saved: "Prediction saved!",
    whoWillWin: "Who will win?",
    makePrediction: "Make your prediction",
    viewOrUpdate: "View or update",
  },
  matchStatus: {
    open: "Open",
    locked: "Locked",
    done: "Done",
    scheduled: "Coming soon",
  },
  errors: {
    notOpenYet: "This round is not open yet. Check back when your group owner opens it.",
    predictionsClosed: "Predictions are closed for this match.",
    predictionRejectedAtLock: "The lock time passed. Your prediction was not saved.",
    importFailed: "We could not load the schedule. Check the CSV files and try again.",
    ownerOnly: "Only the group owner can do that.",
    voidReasonRequired: "Please say why this match is being voided.",
  },
  placeholderTeam: (name: string) =>
    name.includes("Playoff") || name.includes("TBD") || name.includes("Winner")
      ? "TBD (playoff winner)"
      : name,
} as const;
