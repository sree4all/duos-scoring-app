export interface IdMapping {
  sourceId: string;
  generalizedId: string;
}

export function mapSourceToGeneralized(
  sourceId: string,
  mappings: IdMapping[]
): string | null {
  const match = mappings.find((item) => item.sourceId === sourceId);
  return match?.generalizedId ?? null;
}

export function mapGeneralizedToSource(
  generalizedId: string,
  mappings: IdMapping[]
): string | null {
  const match = mappings.find((item) => item.generalizedId === generalizedId);
  return match?.sourceId ?? null;
}