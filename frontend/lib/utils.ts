import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a confidence value to an integer percentage (0–100).
 *
 * The backend returns `analysis_confidence` in mixed formats:
 *   - 0.0–1.0 floats (e.g. 0.95 → 95%)
 *   - Already-integer values (e.g. 1 = 100%, but also 85 = 85%)
 *
 * Rule: values ≤ 1 are treated as fractional and multiplied by 100.
 *       values > 1 are treated as already-percentage and rounded.
 */
export function formatConfidence(value: number | undefined | null): number {
  if (value == null) return 0;
  if (value <= 1) {
    return Math.round(value * 100);
  }
  return Math.round(value);
}
