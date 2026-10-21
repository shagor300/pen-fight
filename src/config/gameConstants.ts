/**
 * gameConstants.ts
 * All shared numeric constants for physics, timing, desk rules and UI.
 */

// ─── Physics ─────────────────────────────────────────────────────
/** 100 pixels = 1 meter in Planck.js */
export const SCALE = 100;
/** Fixed physics timestep (60 Hz) */
export const TIME_STEP = 1 / 60;
/** Planck velocity solver iterations */
export const VELOCITY_ITERATIONS = 8;
/** Planck position solver iterations */
export const POSITION_ITERATIONS = 3;

// ─── Pull-back / Shot ────────────────────────────────────────────
/** Minimum drag distance (px) to register a valid shot */
export const MIN_PULL_PX = 15;
/** Maximum drag distance (px) — pull is clamped here */
export const MAX_PULL_PX = 180;
/** Base impulse magnitude (Planck units) */
export const BASE_IMPULSE = 3.5;

// ─── Anisotropic Friction ────────────────────────────────────────
/** Forward (lengthwise) drag per frame — high friction stops quickly */
export const FORWARD_DRAG = 0.90;
/** Lateral (sideways) drag per frame — low friction lets it roll */
export const LATERAL_DRAG = 0.965;
/** Angular damping multiplier per frame */
export const ANGULAR_DRAG = 0.92;
/** Velocity threshold below which pen stops (m/s) */
export const LINEAR_STOP_THRESHOLD = 0.03;
/** Angular velocity threshold below which pen stops (rad/s) */
export const ANGULAR_STOP_THRESHOLD = 0.05;

// ─── Turn & Timer ────────────────────────────────────────────────
/** Seconds of inactivity before countdown bar appears */
export const INACTIVITY_SECONDS = 10;
/** Seconds the countdown bar runs before a forced miss */
export const COUNTDOWN_SECONDS = 20;
/** Total turns before forced draw if neither pen falls */
export const MAX_TURNS_PER_ROUND = 30;

// ─── Desk Shrinking ──────────────────────────────────────────────
/** Turns AFTER which the desk shrinks (0-indexed internal turn count) */
export const SHRINK_TURNS = [15, 19, 23, 27] as const;
/** Percentage the desk shrinks each time (from all sides) */
export const SHRINK_PERCENT = 0.07;
/** Turns when a warning dashed line appears (1 turn before shrink) */
export const SHRINK_WARNING_TURNS = [14, 18, 22, 26] as const;

// ─── Desk Dimensions (initial, in pixels — portrait mobile) ─────
export const DESK_WIDTH = 700;
export const DESK_HEIGHT = 500;

// ─── Fall Animation ──────────────────────────────────────────────
/** Duration of fall animation in ms */
export const FALL_DURATION_MS = 350;
/** Scale the pen sprite shrinks to when falling */
export const FALL_SCALE = 0.4;

// ─── Match Formats ───────────────────────────────────────────────
export type MatchFormat = 'first_to_3' | 'first_to_5' | 'endless';
export const DEFAULT_MATCH_FORMAT: MatchFormat = 'first_to_3';

// ─── Pen Placement (initial spawn Y offset from desk center) ─────
export const PEN_SPAWN_OFFSET_Y = 120; // px from center

// ─── Colors ──────────────────────────────────────────────────────
export const COLORS = {
  woodLight: 0xD7995B,
  woodMid: 0xB87A3D,
  woodDark: 0x8B5A2B,
  cream: 0xF6EFE6,
  textDark: 0x2C3539,
  accent: 0xFF7A00,
  danger: 0xE63946,
  victory: 0x2A9D8F,
  white: 0xFFFFFF,
  black: 0x000000,
  deskEdge: 0x6B4226,
} as const;
