export interface DualWriteAttempt<T> {
  label: string;
  run: () => Promise<T>;
}

export async function dualWriteWithRetries<T>(
  primary: DualWriteAttempt<T>,
  secondary: DualWriteAttempt<T>,
  maxRetries = 2
): Promise<{ primary: T | null; secondary: T | null; errors: string[] }> {
  const errors: string[] = [];
  let primaryResult: T | null = null;
  let secondaryResult: T | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      primaryResult = await primary.run();
      break;
    } catch (e) {
      errors.push(`${primary.label}:${String(e)}`);
    }
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      secondaryResult = await secondary.run();
      break;
    } catch (e) {
      errors.push(`${secondary.label}:${String(e)}`);
    }
  }

  return { primary: primaryResult, secondary: secondaryResult, errors };
}
