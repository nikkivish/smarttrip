export const palette = {
  // --- Sky blue: the primary brand surface ---
  sky50: '#F0F7FF',
  sky100: '#E0EFFF',
  sky200: '#C2DFFF',
  sky300: '#92C6FF',
  sky400: '#5BA6FB',
  sky500: '#2E86F0',
  sky600: '#1C6CD2',
  sky700: '#1656A8',
  sky800: '#124A89',

  // --- Warm accent: prices, highlights, imagery over dark scrims ---
  accent100: '#FFF1E2',
  accent200: '#FFDDB8',
  accent300: '#FFB65C',
  accent400: '#FF9A3C',
  accent500: '#F07E22',
  accent600: '#D9660F',

  // --- Safety semantics (unchanged) ---
  safetySafe: '#16A34A',
  safetySafeBg: '#DCFCE7',
  safetyCaution: '#D97706',
  safetyCautionBg: '#FEF3C7',
  safetyRisk: '#DC2626',
  safetyRiskBg: '#FEE2E2',

  neutral0: '#FFFFFF',
  neutral50: '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',
} as const;

export const colors = {
  // Primary moved from violet to sky blue.
  primary: palette.sky500,
  primaryDark: palette.sky700,
  primaryLight: palette.sky100,
  primaryBorder: palette.sky200,
  onPrimary: palette.neutral0,

  // Soft sky-blue page background instead of flat slate.
  background: palette.sky50,
  backgroundDeep: palette.sky100,
  surface: palette.neutral0,
  surfaceAlt: '#EAF3FF',
  border: '#DCE9F7',
  borderStrong: palette.sky200,

  text: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral500,
  textInverse: palette.neutral0,
  // For copy sitting on photography.
  onImage: palette.neutral0,
  onImageMuted: 'rgba(255, 255, 255, 0.84)',

  danger: palette.safetyRisk,
  dangerBg: palette.safetyRiskBg,
  warning: palette.safetyCaution,
  warningBg: palette.safetyCautionBg,
  success: palette.safetySafe,
  successBg: palette.safetySafeBg,
  info: palette.sky600,

  // Gradient stops for imagery scrims, so overlay text stays legible.
  // Warm accent, exposed on the token object so components can reference it directly.
  accent100: palette.accent100,
  accent200: palette.accent200,
  accent300: palette.accent300,
  accent400: palette.accent400,
  accent500: palette.accent500,
  accent600: palette.accent600,

  scrimTop: 'rgba(15, 23, 42, 0)',
  scrimMid: 'rgba(15, 23, 42, 0.38)',
  scrimBottom: 'rgba(15, 23, 42, 0.72)',

  overlay: 'rgba(15, 23, 42, 0.55)',
  skeleton: palette.sky100,
} as const;

/**
 * Named gradients. Kept as token data rather than inline arrays so a rebrand is
 * a single edit here.
 */
export const gradients = {
  /**
   * Behind app headers and the top of scrollable content. Deliberately stops at
   * `sky200`: starting at `sky300` tinted the whole upper half of every screen
   * and fought the white cards sitting on top of it.
   */
  hero: [palette.sky200, palette.sky100, palette.sky50] as const,
  /** Subtle fill for white cards, keeps them from looking flat. */
  card: [palette.neutral0, '#F7FBFF'] as const,
  /** Safety surfaces: mint into sky. */
  safety: ['#E7F8F1', palette.sky100] as const,
  /** Fallback when a remote image fails to load. */
  imageFallback: [palette.sky400, palette.sky200] as const,
  /** Warm accent fills. */
  accent: [palette.accent300, palette.accent500] as const,
  /** Primary action fills. */
  primary: [palette.sky500, palette.sky600] as const,
  /** Text legibility over photography. */
  scrim: [colors.scrimTop, colors.scrimMid, colors.scrimBottom] as const,
} as const;

export type SafetyLevel = 'safe' | 'caution' | 'risk';

export const safetyColor: Record<SafetyLevel, { fg: string; bg: string; label: string }> = {
  safe: { fg: palette.safetySafe, bg: palette.safetySafeBg, label: 'Safe' },
  caution: { fg: palette.safetyCaution, bg: palette.safetyCautionBg, label: 'Caution' },
  risk: { fg: palette.safetyRisk, bg: palette.safetyRiskBg, label: 'High risk' },
};