export function assertConsistency(genericTotal: number, baselineTotal: number, epsilon = 0) {
  return Math.abs(genericTotal - baselineTotal) <= epsilon;
}