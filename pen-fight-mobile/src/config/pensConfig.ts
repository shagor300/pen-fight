/**
 * pensConfig.ts
 * 8-Pen Roster with exact specs, dimensions, colors, and 1-5 star ratings
 * from "Desk Wars: Pen Fight" blueprint.
 */
export interface PenSpec {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stats: {
    weight: number; // 1 to 5 stars
    speed: number;  // 1 to 5 stars
    spin: number;   // 1 to 5 stars
    grip: number;   // 1 to 5 stars
    reach: number;  // 1 to 5 stars
  };
  lengthPx: number;
  widthPx: number;
  dimensions: {
    widthMeters: number;
    lengthMeters: number;
  };
  colors: {
    barrel: string;
    cap: string;
    grip: string;
    tip: string;
    clip: string;
    ink: string;
    primary: string;
    secondary: string;
  };
  transparent: boolean;
  transparentBarrel: boolean;
  styleType: 'ballpoint' | 'clicker' | '4colour' | 'gel' | 'metal' | 'highlighter' | 'marker' | 'spinner';
  barrelText: string;
  shapeParts: string[];
}

export type PenConfig = PenSpec;

export const PENS_ROSTER: PenSpec[] = [
  {
    id: 'cheap-ballpoint',
    name: 'Cheap Ballpoint',
    tagline: 'Long barrel. Smooth side flicks.',
    description: 'Long barrel. Smooth side flicks.',
    stats: { weight: 2, speed: 4, spin: 3, grip: 3, reach: 4 },
    lengthPx: 164,
    widthPx: 13,
    dimensions: { widthMeters: 0.15, lengthMeters: 1.62 },
    colors: {
      barrel: '#e2e8f0',
      cap: '#ea580c',
      grip: '#cbd5e1',
      tip: '#d97706',
      clip: '#ea580c',
      ink: '#1e3a8a',
      primary: '#e2e8f0',
      secondary: '#ea580c'
    },
    transparent: true,
    transparentBarrel: true,
    barrelText: 'BALL 0.7',
    styleType: 'ballpoint',
    shapeParts: ['clear_hex_barrel', 'inner_ink_tube', 'vented_blue_cap', 'brass_cone_tip']
  },
  {
    id: 'click-pen',
    name: 'Click Pen',
    tagline: 'Quick mid-weight. Easy to steer.',
    description: 'Quick mid-weight. Easy to steer.',
    stats: { weight: 3, speed: 4, spin: 3, grip: 4, reach: 3 },
    lengthPx: 152,
    widthPx: 14,
    dimensions: { widthMeters: 0.16, lengthMeters: 1.52 },
    colors: {
      barrel: '#4d7c0f',
      cap: '#365314',
      grip: '#1a2e05',
      tip: '#cbd5e1',
      clip: '#94a3b8',
      ink: '#15803d',
      primary: '#4d7c0f',
      secondary: '#365314'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'CLICK 1.0',
    styleType: 'clicker',
    shapeParts: ['plastic_grooved_body', 'plunger_button', 'steel_pocket_clip']
  },
  {
    id: '4-colour-pen',
    name: '4-Colour Pen',
    tagline: 'A chunky classic for steady, straight pushes.',
    description: 'A chunky classic for steady, straight pushes.',
    stats: { weight: 4, speed: 3, spin: 2, grip: 4, reach: 3 },
    lengthPx: 150,
    widthPx: 18,
    dimensions: { widthMeters: 0.20, lengthMeters: 1.50 },
    colors: {
      barrel: '#f8fafc',
      cap: '#2563eb',
      grip: '#f97316',
      tip: '#cbd5e1',
      clip: '#3b82f6',
      ink: '#2563eb',
      primary: '#f8fafc',
      secondary: '#2563eb'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: '4-COLOR',
    styleType: '4colour',
    shapeParts: ['chunky_two_tone_casing', 'four_color_selector_sliders']
  },
  {
    id: 'gel-pen',
    name: 'Gel Pen',
    tagline: 'Gentle shots, easy to place.',
    description: 'Gentle shots, easy to place.',
    stats: { weight: 2, speed: 5, spin: 4, grip: 3, reach: 3 },
    lengthPx: 156,
    widthPx: 14,
    dimensions: { widthMeters: 0.15, lengthMeters: 1.56 },
    colors: {
      barrel: '#93c5fd',
      cap: '#1d4ed8',
      grip: '#1e40af',
      tip: '#e2e8f0',
      clip: '#3b82f6',
      ink: '#1d4ed8',
      primary: '#93c5fd',
      secondary: '#1d4ed8'
    },
    transparent: true,
    transparentBarrel: true,
    barrelText: 'GEL 0.5',
    styleType: 'gel',
    shapeParts: ['ribbed_rubber_finger_grip', 'fine_needle_tip']
  },
  {
    id: 'metal-pen',
    name: 'Metal Pen',
    tagline: 'Steel barrel. Lively rebounds.',
    description: 'Steel barrel. Lively rebounds.',
    stats: { weight: 5, speed: 3, spin: 3, grip: 5, reach: 3 },
    lengthPx: 154,
    widthPx: 16,
    dimensions: { widthMeters: 0.18, lengthMeters: 1.54 },
    colors: {
      barrel: '#94a3b8',
      cap: '#64748b',
      grip: '#475569',
      tip: '#e2e8f0',
      clip: '#cbd5e1',
      ink: '#334155',
      primary: '#94a3b8',
      secondary: '#64748b'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'STEEL',
    styleType: 'metal',
    shapeParts: ['brushed_stainless_steel_body', 'nickel_clip']
  },
  {
    id: 'yellow-highlighter',
    name: 'Yellow Highlighter',
    tagline: 'Wide flat body with strong desk grip.',
    description: 'Wide flat body with strong desk grip.',
    stats: { weight: 4, speed: 3, spin: 2, grip: 5, reach: 2 },
    lengthPx: 142,
    widthPx: 22,
    dimensions: { widthMeters: 0.24, lengthMeters: 1.42 },
    colors: {
      barrel: '#facc15',
      cap: '#ca8a04',
      grip: '#eab308',
      tip: '#fef08a',
      clip: '#ca8a04',
      ink: '#eab308',
      primary: '#facc15',
      secondary: '#ca8a04'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'HIGHLIGHT',
    styleType: 'highlighter',
    shapeParts: ['wide_oval_barrel', 'chunky_faceted_cap', 'chisel_fluorescent_tip']
  },
  {
    id: 'dual-tip-marker',
    name: 'Dual-Tip Marker',
    tagline: 'Twin-capped marker built for helicopter spin.',
    description: 'Twin-capped marker built for helicopter spin.',
    stats: { weight: 3, speed: 3, spin: 5, grip: 2, reach: 4 },
    lengthPx: 166,
    widthPx: 16,
    dimensions: { widthMeters: 0.17, lengthMeters: 1.66 },
    colors: {
      barrel: '#8b5cf6',
      cap: '#5b21b6',
      grip: '#4c1d95',
      tip: '#ddd6fe',
      clip: '#6d28d9',
      ink: '#7c3aed',
      primary: '#8b5cf6',
      secondary: '#5b21b6'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'DUAL 2.0',
    styleType: 'marker',
    shapeParts: ['symmetrical_chubby_body', 'silicone_stylus_disc_tip']
  },
  {
    id: 'long-mod-spinner',
    name: 'Long Mod Spinner',
    tagline: 'Balanced pen-mod with weighted silicone tips.',
    description: 'Balanced pen-mod with weighted silicone tips.',
    stats: { weight: 4, speed: 4, spin: 5, grip: 3, reach: 5 },
    lengthPx: 182,
    widthPx: 15,
    dimensions: { widthMeters: 0.16, lengthMeters: 1.82 },
    colors: {
      barrel: '#f97316',
      cap: '#1e293b',
      grip: '#ea580c',
      tip: '#fdba74',
      clip: '#334155',
      ink: '#f97316',
      primary: '#f97316',
      secondary: '#1e293b'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'SPIN PRO',
    styleType: 'spinner',
    shapeParts: ['extra_long_balanced_shaft', 'dual_weighted_rubber_collars']
  }
];

export const PENS_CONFIG = PENS_ROSTER;
export const ALL_PENS = PENS_ROSTER;

export function deriveMass(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.weight || 3);
  return 0.85 + val * 0.24;
}

export function deriveSpeedMultiplier(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.speed || 3);
  return 0.88 + val * 0.08;
}

export function deriveTorqueMultiplier(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.spin || 3);
  return 0.85 + val * 0.14;
}

export function deriveDampingFactor(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.grip || 3);
  return 0.92 + val * 0.07;
}

export function deriveLengthPx(configOrVal: PenSpec | number): number {
  if (typeof configOrVal === 'number') return configOrVal;
  return configOrVal.lengthPx || 150;
}

