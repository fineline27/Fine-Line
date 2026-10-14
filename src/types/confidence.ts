export type ConfidencePoints = 1 | 2 | 3;

export function clampConfidence(value: number): ConfidencePoints {
  if (value <= 1) {
    return 1;
  }
  if (value >= 3) {
    return 3;
  }
  return value as ConfidencePoints;
}
