import { ROUND_OF_32_FIXTURES } from "@/lib/domain/world-cup/round-of-32-fixtures";

export {
  ROUND_OF_32_FIXTURES,
  roundOf32KickoffUtc,
  type RoundOf32Fixture,
} from "@/lib/domain/world-cup/round-of-32-fixtures";

/** @deprecated Use ROUND_OF_32_FIXTURES */
export const ROUND_OF_32_KICKOFFS_ET = ROUND_OF_32_FIXTURES.map((f) => ({
  matchNumber: f.matchNumber,
  date: f.kickoffDate,
  time: f.kickoffTimeEt,
}));
