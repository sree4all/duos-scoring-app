export interface RepositoryContext {
  requestId?: string;
}

export class GeneralizedScoringRepositories {
  constructor(private readonly context: RepositoryContext = {}) {}

  getContext() {
    return this.context;
  }

  // Placeholder methods for upcoming implementation phases.
  async getContestById(contestId: string) {
    return { contestId };
  }

  async getEventById(eventId: string) {
    return { eventId };
  }
}

export function createGeneralizedScoringRepositories(context?: RepositoryContext) {
  return new GeneralizedScoringRepositories(context);
}
