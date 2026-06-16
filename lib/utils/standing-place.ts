const KEYCAP_DIGITS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

/**
 * Competition-style places for a list already sorted by score.
 * Tied scores share the same place; the next distinct score skips ranks (1, 1, 3, …).
 */
export function computeStandingPlaces(points: number[]): number[] {
  const places: number[] = [];
  let place = 0;
  let prev: number | null = null;

  for (let i = 0; i < points.length; i++) {
    const score = points[i];
    if (prev === null || score !== prev) {
      place = i + 1;
      prev = score;
    }
    places.push(place);
  }

  return places;
}

/** Emoji label for a standings place (1 = gold, 2 = silver, 3 = bronze, 4+ = keycap digits). */
export function standingPlaceEmoji(place: number): string {
  switch (place) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return String(place)
        .split("")
        .map((digit) => KEYCAP_DIGITS[Number(digit)])
        .join("");
  }
}
