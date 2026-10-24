/**
 * src/config/designTokens.ts
 * Centralized Design Token System for "Premium School Desk Arcade" Art Direction.
 *
 * Defines unified palettes, typography, spacing, borders, radii, shadows,
 * animations, and interactive component metrics across the entire application.
 */

export const DESIGN_TOKENS = {
  // ─── 1. Colors ───────────────────────────────────────────────────
  colors: {
    // Signature Desk & Wood
    walnutBg: 0x2B160E,         // #2B160E - Signature deep walnut desk surface
    deepWood: 0x3A2117,         // #3A2117 - Rich wood grain shadow
    warmAmber: 0xD9822B,        // #D9822B - Subtle warm wood highlight
    deskBevel: 0x1A0D08,        // #1A0D08 - Edge vignette and rim

    // Surface & Card Panels
    creamSurface: 0xFFF8E9,     // #FFF8E9 - Clean primary card background
    creamSecondary: 0xF1E7D2,   // #F1E7D2 - Inset sections & secondary surfaces
    creamMuted: 0xE5DAC2,       // #E5DAC2 - Subtle disabled/slot background
    white: 0xFFFFFF,            // Pure white highlights
    darkNavyCard: 0x182A49,     // #182A49 - Deep navy container background
    deepNavy: 0x182A49,         // Alias for deep navy card/backdrop

    // Outlines & Borders
    navyOutline: 0x26354A,      // #26354A - Signature crisp game border
    navyBorderDark: 0x16202E,   // #16202E - Ultra-crisp stroke
    navyShadow: 0x121A26,       // #121A26 - Solid 3D tactile drop shadow

    // Primary Accents & Hero Actions
    premiumGold: 0xFFC94A,      // #FFC94A - Signature golden action button fill
    premiumGoldHover: 0xFFD56E, // Hover/pressed highlight
    orangeAction: 0xF47721,     // #F47721 - Vibrant secondary call-to-action
    orangeHover: 0xFB8C3C,

    // Feedback & Semantic Colors
    victoryGreen: 0x39B86B,     // #39B86B - Win, ready, positive states
    victoryGreenHover: 0x48CF7E,
    warningRed: 0xE34B52,       // #E34B52 - Defeat, surrender, risk
    skyBlue: 0x38BDF8,          // #38BDF8 - P1 player accent / info
    softBlue: 0x93C5FD,         // Selected button fill
    peachOrange: 0xFB923C,      // P2 player accent
    purpleSpin: 0x8B5CF6,       // Stat bar color
    emeraldGrip: 0x10B981,      // Stat bar color
    roseReach: 0xF43F5E,        // Stat bar color

    // Text Hierarchy
    textPrimary: 0x1E293B,      // Deep navy-slate for crisp readability
    textSecondary: 0x766B5E,    // #766B5E - Warm neutral supporting text
    secondaryText: 0x766B5E,    // Alias for secondary warm text
    textMuted: 0x948B7E,        // Subtle timestamps, labels
    textOnDark: 0xFFF8E9,       // Cream text on dark wood or navy
    textGold: 0xFBBF24,         // Golden highlighted text
  },

  // ─── 2. Typography ───────────────────────────────────────────────
  typography: {
    fontHeading: 'Fredoka, sans-serif',
    fontBody: 'Nunito, sans-serif',

    sizes: {
      hero: 34,
      titleLarge: 26,
      titleMedium: 20,
      titleSmall: 16,
      bodyLarge: 14,
      bodyMedium: 12,
      bodySmall: 10,
      micro: 8.5,
    },

    weights: {
      regular: '400',
      semiBold: '600',
      bold: '700',
      black: '900',
    },
  },

  // ─── 3. Spacing Scale ────────────────────────────────────────────
  spacing: {
    xxs: 3,
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },

  // ─── 4. Borders & Corner Radii ───────────────────────────────────
  borders: {
    thin: 1.6,
    regular: 2.0,
    normal: 2.4,
    thick: 3.2,
    chunky: 4.0,
  },

  radii: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 26,
    pill: 9999,
  },

  // ─── 5. Tactile 3D Shadows ───────────────────────────────────────
  shadows: {
    sm: 2.5,
    md: 4.0,
    lg: 6.0,
    buttonOffset: 4.0,
    cardOffset: 6.0,
  },

  // ─── 6. Standard Component Sizes ─────────────────────────────────
  sizes: {
    buttonHeightSm: 28,
    buttonHeightMd: 36,
    buttonHeightLg: 44,
    buttonHeightHero: 52,
    iconButtonSm: 30,
    iconButtonMd: 38,
    iconButtonLg: 46,
    modalMaxW: 396,
  },

  // ─── 7. Modal & Overlays ─────────────────────────────────────────
  overlay: {
    scrimColor: 0x0C121D,
    scrimAlpha: 0.72,
    backdropBlur: 4,
  },

  opacity: {
    scrim: 0.72,
    modalScrim: 0.72,
    disabled: 0.45,
    subtle: 0.25,
    overlay: 0.65,
  },

  // ─── 8. Animation & Motion ───────────────────────────────────────
  motion: {
    durationFast: 0.12,
    durationNormal: 0.22,
    durationCelebration: 0.45,
    pressScale: 0.965,
    hoverScale: 1.025,
    // Named durations in seconds. Everything is skipped when Reduce Motion is on.
    press: 0.08,
    screenTransition: 0.22,
    currencyCountUp: 0.6,
    xpProgress: 0.5,
    rewardCelebration: 0.6,
    levelUpCelebration: 0.9,
  },

  // ─── 9. Semantic additions (PEN economy UI) ──────────────────────
  semantic: {
    success: 0x39B86B,          // same as victoryGreen
    danger: 0xE34B52,           // same as warningRed
    info: 0x38BDF8,
    disabledSurface: 0xD6D0C5,
    disabledText: 0x827C73,
    textInverse: 0xFFFFFF,
    borderSubtle: 0xD5C09B,
    pen: 0xFFC94A,              // PEN currency accent (gold)
    penDeep: 0xD99A18,
  },

  // ─── 10. Approved 4px spacing steps (use these for new UI) ───────
  space: { s4: 4, s8: 8, s12: 12, s16: 16, s24: 24, s32: 32, s40: 40 },

  // ─── 11. Semantic type roles ─────────────────────────────────────
  type: {
    displayLarge: { family: 'Fredoka, sans-serif', size: 34 },
    displayMedium: { family: 'Fredoka, sans-serif', size: 26 },
    headline: { family: 'Fredoka, sans-serif', size: 20 },
    title: { family: 'Fredoka, sans-serif', size: 16 },
    body: { family: 'Nunito, sans-serif', size: 14 },
    bodySmall: { family: 'Nunito, sans-serif', size: 12 },
    label: { family: 'Nunito, sans-serif', size: 12 },
    currency: { family: 'Fredoka, sans-serif', size: 15 },
    score: { family: 'Fredoka, sans-serif', size: 28 },
  },

  // ─── 12. Minimum touch target ────────────────────────────────────
  touch: { min: 44, comfortable: 48 },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
