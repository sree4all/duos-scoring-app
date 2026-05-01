export interface ExternalReadContext {
  sourceMatchId: string;
}

export function toGeneralizedEventRef(ctx: ExternalReadContext) {
  return { externalRef: ctx.sourceMatchId };
}