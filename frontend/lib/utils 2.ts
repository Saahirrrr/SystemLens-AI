// lib/utils.ts — Utility helpers

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CriticalityLevel, EffortEstimate, SystemCategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORY_COLORS: Record<SystemCategory, string> = {
  CRM: "#6366f1",
  ERP: "#8b5cf6",
  HRIS: "#ec4899",
  IdP: "#f59e0b",
  ITSM: "#10b981",
  Finance: "#3b82f6",
  Communication: "#14b8a6",
  Storage: "#64748b",
  Custom: "#a78bfa",
};

export const CRITICALITY_CONFIG: Record<
  CriticalityLevel,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "Critical", color: "#ef4444", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
  high:     { label: "High",     color: "#f97316", bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium:   { label: "Medium",   color: "#eab308", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  low:      { label: "Low",      color: "#22c55e", bg: "bg-green-500/10 text-green-400 border-green-500/20" },
};

export const EFFORT_CONFIG: Record<
  EffortEstimate,
  { label: string; color: string; weeks: string }
> = {
  low:    { label: "Low",    color: "#22c55e", weeks: "< 1 week" },
  medium: { label: "Medium", color: "#eab308", weeks: "1–4 weeks" },
  high:   { label: "High",   color: "#ef4444", weeks: "> 4 weeks" },
};

export const PRIORITY_TIER_CONFIG: Record<string, { color: string; bg: string }> = {
  "P1 — Critical": { color: "#ef4444", bg: "bg-red-500/10 border-red-500/30" },
  "P2 — High":     { color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30" },
  "P3 — Medium":   { color: "#eab308", bg: "bg-yellow-500/10 border-yellow-500/30" },
  "P4 — Low":      { color: "#22c55e", bg: "bg-green-500/10 border-green-500/30" },
};

export function confidenceColor(score: number): string {
  if (score >= 0.95) return "#22c55e";
  if (score >= 0.70) return "#eab308";
  return "#ef4444";
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}
