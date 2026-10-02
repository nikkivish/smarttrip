/**
 * Layout tiers, in window-width pixels. These drive every responsive decision
 * in the app through `hooks/useResponsive`, so the numbers live here rather
 * than being repeated per screen.
 */
export const breakpoints = {
  /** At or above this, the phone layout switches to tablet/desktop. */
  medium: 768,
  /** At or above this, screens unlock the desktop navigation and wide grids. */
  large: 1024,
  /** At or above this, extra-large desktop spacing and grid columns. */
  xlarge: 1440,
} as const;

export type BreakpointName = 'small' | 'medium' | 'large' | 'xlarge';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 44,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  /** Default card radius. */
  card: 24,
  /** Fully rounded, for pills, chips and the floating tab bar. */
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  /** Screen titles. */
  xxxl: 38,
  /** Marketing-scale, used sparingly. */
  display: 44,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

/** Consistent corner radius, expressed once so components cannot drift. */
export const radii = {
  card: radius.card,
  pill: radius.pill,
  field: radius.xl,
  image: radius.xl,
} as const;

export const shadow = {
  /** Resting card. */
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  /** Card sitting above imagery. */
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  /** Floating navigation and sheets. */
  float: {
    shadowColor: '#0B2B4D',
    shadowOpacity: 0.14,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  /** Pill buttons and chips. */
  pill: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const;

/**
 * Vertical rhythm for the main screen sections, so scrolling content lines up
 * across screens.
 */
export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.xxl,
  cardGap: spacing.md,
  gridGap: spacing.md,
  /**
   * Widest the content column is allowed to get. Web/desktop used to run the
   * column full-bleed, which stretched two destination cards to ~690px each;
   * capping it keeps line lengths comfortable and lets the grid add columns.
   */
  contentMaxWidth: 1160,
  /**
   * Widest a block of body copy or a stacked form is allowed to get. Keeps
   * sentences a readable length instead of letting one column span a monitor.
   */
  readableMaxWidth: 680,
  /** Widest a standalone form card is allowed to get. */
  formMaxWidth: 420,
  /** Widest the centered chat transcript is allowed to get. */
  transcriptMaxWidth: 760,
  /** Widest the floating tab bar gets, so it stays thumb-sized on desktop. */
  tabBarMaxWidth: 560,
  /** Height of the desktop/tablet top navigation, excluding the safe-area inset. */
  desktopNavHeight: 68,
  /** Shared height for standalone controls (search field, filter button). */
  controlHeight: 52,
  /** Height of the header avatar and weather chip, so they line up. */
  headerControlSize: 40,
  /** Height of the floating tab bar's pill, excluding the safe-area inset. */
  floatingNavHeight: 64,
  floatingNavBottomInset: spacing.base,
  /**
   * Column counts for the destination grid, by available width. Tied to the
   * shared `breakpoints` so grids and navigation change tiers together.
   */
  breakpoints: {
    /** At or above this, cards can go to four across. */
    fourUp: breakpoints.large,
    /** At or above this, three across. */
    threeUp: breakpoints.medium,
  },
} as const;