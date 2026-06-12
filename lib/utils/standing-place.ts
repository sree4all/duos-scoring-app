const KEYCAP_DIGITS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

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
