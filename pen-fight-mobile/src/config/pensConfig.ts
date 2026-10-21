/**
 * src/config/pensConfig.ts
 * Complete 8-Pen Roster with Authentic Stats, 3D Geometry Specs, and Signature Passive Skills.
 */
export interface PenSpec {
  id: string;
  name: string;
  tagline: string;
  description: string;
  skillName: string;
  skillDesc: string;
  stats: {
    weight: number; // 1 to 5
    speed: number;  // 1 to 5
    spin: number;   // 1 to 5
    grip: number;   // 1 to 5
    reach: number;  // 1 to 5
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
  styleType: 'ballpoint' | 'gel' | 'marker' | '4colour' | 'highlighter' | 'clicker' | 'fountain' | 'metal';
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
    skillName: ' Whip-Tip Sweep',
    skillDesc: '+12% tip-shot angular whip when grabbed near the cap or nib.',
    stats: { weight: 2, speed: 5, spin: 4, grip: 2, reach: 5 },
    lengthPx: 162,
    widthPx: 13,
    dimensions: { widthMeters: 0.13, lengthMeters: 1.62 },
    colors: {
      barrel: '#e2e8f0',
      cap: '#ea580c',
      grip: '#cbd5e1',
      tip: '#d97706',
      clip: '#ea580c',
      ink: '#1d4ed8',
      primary: '#e2e8f0',
      secondary: '#ea580c'
    },
    transparent: true,
    transparentBarrel: true,
    barrelText: 'BALL 0.7',
    styleType: 'ballpoint',
    shapeParts: ['clear_hex_barrel', 'inner_ink_tube', 'vented_cap', 'brass_cone_tip']
  },
  {
    id: 'gel-pen',
    name: 'Gel Pen',
    tagline: 'Gentle shots, easy to place.',
    description: 'Gentle shots, easy to place.',
    skillName: '🎯 Precision Brake',
    skillDesc: 'Silicone grip stabilizes the barrel so medium shots stop right on target.',
    stats: { weight: 2, speed: 4, spin: 3, grip: 3, reach: 3 },
    lengthPx: 150,
    widthPx: 14,
    dimensions: { widthMeters: 0.14, lengthMeters: 1.50 },
    colors: {
      barrel: '#bfdbfe',
      cap: '#2563eb',
      grip: '#1d4ed8',
      tip: '#e2e8f0',
      clip: '#3b82f6',
      ink: '#1e40af',
      primary: '#bfdbfe',
      secondary: '#2563eb'
    },
    transparent: true,
    transparentBarrel: true,
    barrelText: 'GEL 0.5',
    styleType: 'gel',
    shapeParts: ['ribbed_rubber_finger_grip', 'fine_needle_tip']
  },
  {
    id: 'marker',
    name: 'Marker',
    tagline: 'Broad hits with a steady stop.',
    description: 'Broad hits with a steady stop.',
    skillName: '🛡️ Heavy Anchor',
    skillDesc: 'Thick cylindrical body absorbs 15% more recoil on head-on collisions.',
    stats: { weight: 3, speed: 3, spin: 3, grip: 4, reach: 2 },
    lengthPx: 144,
    widthPx: 18,
    dimensions: { widthMeters: 0.18, lengthMeters: 1.44 },
    colors: {
      barrel: '#f1f5f9',
      cap: '#dc2626',
      grip: '#ef4444',
      tip: '#dc2626',
      clip: '#b91c1c',
      ink: '#dc2626',
      primary: '#f1f5f9',
      secondary: '#dc2626'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'MARKER',
    styleType: 'marker',
    shapeParts: ['broad_cylindrical_barrel', 'felt_chisel_tip']
  },
  {
    id: '4-colour-pen',
    name: '4-Colour Pen',
    tagline: 'A chunky classic for steady, straight pushes.',
    description: 'A chunky classic for steady, straight pushes.',
    skillName: '🚀 Straight Ram',
    skillDesc: 'Center-grab pushes transfer +14% forward knockback with minimal self-spin.',
    stats: { weight: 2, speed: 3, spin: 2, grip: 4, reach: 4 },
    lengthPx: 154,
    widthPx: 17,
    dimensions: { widthMeters: 0.17, lengthMeters: 1.54 },
    colors: {
      barrel: '#f8fafc',
      cap: '#2563eb',
      grip: '#cbd5e1',
      tip: '#e2e8f0',
      clip: '#3b82f6',
      ink: '#2563eb',
      primary: '#f8fafc',
      secondary: '#2563eb'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: '4-COLOUR',
    styleType: '4colour',
    shapeParts: ['chunky_two_tone_casing', 'four_color_selector_sliders']
  },
  {
    id: 'highlighter',
    name: 'Highlighter',
    tagline: 'Wide flat body with strong desk grip.',
    description: 'Wide flat body with strong desk grip.',
    skillName: '🧲 Edge Grip Lock',
    skillDesc: 'Flat wide body resists sliding off the desk border after defensive hits.',
    stats: { weight: 3, speed: 2, spin: 4, grip: 5, reach: 1 },
    lengthPx: 134,
    widthPx: 22,
    dimensions: { widthMeters: 0.22, lengthMeters: 1.34 },
    colors: {
      barrel: '#facc15',
      cap: '#eab308',
      grip: '#ca8a04',
      tip: '#fef08a',
      clip: '#ca8a04',
      ink: '#eab308',
      primary: '#facc15',
      secondary: '#eab308'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'NEON',
    styleType: 'highlighter',
    shapeParts: ['wide_flat_barrel', 'chisel_fluorescent_tip']
  },
  {
    id: 'click-pen',
    name: 'Click Pen',
    tagline: 'Quick mid-weight. Easy to steer.',
    description: 'Quick mid-weight. Easy to steer.',
    skillName: '⚡ Rapid Snap',
    skillDesc: 'Spring-loaded balance delivers fast acceleration even on medium pulls.',
    stats: { weight: 2, speed: 5, spin: 5, grip: 1, reach: 2 },
    lengthPx: 146,
    widthPx: 14,
    dimensions: { widthMeters: 0.14, lengthMeters: 1.46 },
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
    barrelText: 'CLICK',
    styleType: 'clicker',
    shapeParts: ['retractable_plunger', 'contoured_rubber_grip']
  },
  {
    id: 'fountain-pen',
    name: 'Fountain Pen',
    tagline: 'Classic nib with balanced spin.',
    description: 'Classic nib with balanced spin.',
    skillName: '🌀 Cyclone Nib',
    skillDesc: 'Weighted gold nib sustains high rotational torque through multi-hit combos.',
    stats: { weight: 2, speed: 4, spin: 5, grip: 2, reach: 4 },
    lengthPx: 158,
    widthPx: 15,
    dimensions: { widthMeters: 0.15, lengthMeters: 1.58 },
    colors: {
      barrel: '#1e293b',
      cap: '#0f172a',
      grip: '#334155',
      tip: '#f59e0b',
      clip: '#fbbf24',
      ink: '#1e3a8a',
      primary: '#1e293b',
      secondary: '#f59e0b'
    },
    transparent: false,
    transparentBarrel: false,
    barrelText: 'FOUNTAIN',
    styleType: 'fountain',
    shapeParts: ['lacquered_barrel', 'gold_iridium_nib', 'gold_clip']
  },
  {
    id: 'metal-pen',
    name: 'Metal Pen',
    tagline: 'Steel barrel. Lively rebounds.',
    description: 'Steel barrel. Lively rebounds.',
    skillName: '🔨 Titanium Impact',
    skillDesc: 'Heavy brushed-steel mass delivers maximum knockback while barely recoiling.',
    stats: { weight: 4, speed: 4, spin: 3, grip: 1, reach: 3 },
    lengthPx: 152,
    widthPx: 15,
    dimensions: { widthMeters: 0.15, lengthMeters: 1.52 },
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
    shapeParts: ['brushed_stainless_steel_body', 'chrome_trim']
  }
];

export const PENS_CONFIG = PENS_ROSTER;
export const ALL_PENS = PENS_ROSTER;

export function deriveMass(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.weight || 3);
  return 1.0 + val * 0.28;
}

export function deriveSpeedMultiplier(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.speed || 3);
  return 0.86 + val * 0.06;
}

export function deriveTorqueMultiplier(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.spin || 3);
  return 0.85 + val * 0.11;
}

export function deriveDampingFactor(configOrVal: PenSpec | number): number {
  const val = typeof configOrVal === 'number' ? configOrVal : (configOrVal.stats.grip || 3);
  return 0.96 + val * 0.08;
}

export function deriveLengthPx(configOrVal: PenSpec | number): number {
  if (typeof configOrVal === 'number') return configOrVal;
  return configOrVal.lengthPx || 152;
}
