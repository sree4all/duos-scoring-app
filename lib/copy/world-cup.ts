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
    bonusNotPredicted: "Bonus not predicted",
    duePrediction: "Due prediction",
    save: "Save prediction",
    update: "Update prediction",
    saved: "Prediction saved!",
    whoWillWin: "Who will win?",
    howWillItEnd: "How will the match end?",
    draw: "Draw",
    groupStageDrawHint:
      "Group stage matches can end in a tie. Knockout matches always have a winner after extra time or penalties.",
    makePrediction: "Make your prediction",
    viewOrUpdate: "View or update",
    bonusWatchHint:
      "Watch for bonus prompts—organizers may post questions on this match before kickoff.",
    yourPick: "Your pick",
    startLabel: "Start",
  },
  organizer: {
    officialResult: "Official result (90 minutes)",
    officialResultKnockout:
      "Enter the team that won the match (including extra time or penalties if needed).",
    officialResultGroup:
      "Enter the result after 90 minutes — home win, away win, or draw.",
    saveResult: "Save official result",
    resultSaved: "Official result saved.",
  },
  bonus: {
    sectionTitle: "Bonus question",
    optional: "Optional — only on matches your organizer adds one.",
    save: "Save bonus answer",
    update: "Update bonus answer",
    saved: "Bonus answer saved!",
    organizerTitle: "Bonus question (optional)",
    organizerHint: "Add a fun extra question for this match. Members pick one answer before lock.",
    questionLabel: "Question",
    choicesLabel: "Answer choices (one per line)",
    correctPoints: "Points if correct",
    wrongPoints: "Points if wrong",
    officialAnswer: "Official correct answer",
    addQuestion: "Add bonus question",
    removeQuestion: "Remove",
    setOfficial: "Set official answer for scoring",
    pointsHint: "Use 0 for wrong if you only want to reward correct answers.",
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
