const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * INVITE_ALPHABET.length);
    code += INVITE_ALPHABET[idx];
  }
  return code;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}
