// src/components/insight/tokens.ts
//
// One palette for every chart and data surface in the app — analytics and the
// projects dashboard both read from here. Consumers read these tokens by
// ROLE (series identity, magnitude, status) instead of hard-coding hex, so the
// whole page stays one visual system and a colour change happens in one place.
//
// The categorical order is deliberate, not decorative: it was validated for
// colour-vision-deficiency separation (worst adjacent pair ΔE 9.1, normal-vision
// floor 19.6 on a white surface). Assign slots in order and never cycle past the
// end — a 9th series folds into "Other" instead.
//
// Three of the light slots (aqua, yellow, magenta) sit below 3:1 contrast against
// white, so any chart using them must also carry visible labels or a table view.
// Every chart here does.

import type { CSSProperties } from 'react';

/** Categorical identity — use in fixed slot order. */
export const SERIES = [
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
] as const;

/** Sequential / ordinal blue ramp, light → dark. Nothing lighter than step 250 on white. */
export const BLUE_RAMP = [
  '#86b6ef',
  '#6da7ec',
  '#5598e7',
  '#3987e5',
  '#2a78d6',
  '#256abf',
  '#1c5cab',
  '#184f95',
] as const;

/** State, never series identity. Always paired with a label or icon — never colour alone. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

/** Text and chrome. Labels never wear a series colour — a swatch beside them carries identity. */
export const INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff',
  track: '#f1f0ec',
} as const;

/** Shared recharts <Tooltip> contentStyle so every hover card looks identical. */
export const TOOLTIP_STYLE: CSSProperties = {
  background: INK.surface,
  border: `1px solid ${INK.grid}`,
  borderRadius: '0.625rem',
  boxShadow: '0 10px 20px -8px rgb(11 11 11 / 0.18)',
  fontSize: '12px',
  padding: '8px 12px',
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: INK.primary,
  fontWeight: 600,
  marginBottom: 2,
};

/** Recessive axis defaults shared by every chart. */
export const AXIS = {
  stroke: INK.muted,
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

/** Pipeline order — the real sequence a video moves through, used for ordinal ramps. */
export const PIPELINE_STAGES = [
  'Requested',
  'Scheduled for Taping',
  'Audio Editing',
  'Video Editing',
  'Review',
  'Done',
] as const;

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** 1,284 → "1,284"; 12,900 → "12.9K". For standalone figures, not table columns. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toLocaleString('en-US');
}

/** 670.4 minutes → "11h 10m". */
export function formatMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatPercent(value: number | null, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

/** Truncate an axis category label without clipping the rendered text. */
export function truncate(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
