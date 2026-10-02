import { useWindowDimensions } from 'react-native';

import { breakpoints, layout, spacing, type BreakpointName } from '@/theme';

/**
 * Current layout tier for the window.
 *
 * `small` covers phones, `medium` and up are wide enough for the desktop top
 * navigation instead of the floating tab bar, `large` is a real desktop, and
 * `xlarge` is a big monitor where grids gain another column.
 */
export function useBreakpoint(): BreakpointName {
  const { width } = useWindowDimensions();
  return breakpointFor(width);
}

/** Pure tier lookup, for code that already knows the width. */
export function breakpointFor(width: number): BreakpointName {
  if (width >= breakpoints.xlarge) return 'xlarge';
  if (width >= breakpoints.large) return 'large';
  if (width >= breakpoints.medium) return 'medium';
  return 'small';
}

/** True when the window is at least the given tier wide. */
export function useIsAtLeast(tier: BreakpointName): boolean {
  const current = useBreakpoint();
  const order: BreakpointName[] = ['small', 'medium', 'large', 'xlarge'];
  return order.indexOf(current) >= order.indexOf(tier);
}

/** Tablet or wider. Used for the desktop navigation and two-column layouts. */
export function useIsWide(): boolean {
  return useIsAtLeast('medium');
}

/** True on a real desktop: side-by-side layouts and the widest grids. */
export function useIsDesktop(): boolean {
  return useIsAtLeast('large');
}

/**
 * Width of the usable content column for the current screen.
 *
 * The window is capped at `layout.contentMaxWidth` so a wide browser or tablet
 * gets a centred, comfortable column instead of full-bleed rows, then the
 * screen padding is taken off so callers can lay children out edge to edge
 * inside it.
 */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, layout.contentMaxWidth) - useHorizontalGutter() * 2;
}

/**
 * Horizontal page gutter for the current tier. Phones keep the original 20px;
 * wider screens get more breathing room so the content column is not crammed
 * against the window edge on a tablet, and still more on a desktop.
 */
export function useHorizontalGutter(): number {
  const tier = useBreakpoint();
  if (tier === 'xlarge') return layout.screenPadding + spacing.xl;
  if (tier === 'large') return layout.screenPadding + spacing.base;
  return layout.screenPadding;
}

/** Shared style that centres and caps a screen's content column. */
export const contentColumn = {
  alignSelf: 'center',
  maxWidth: layout.contentMaxWidth,
  width: '100%',
} as const;

/**
 * `contentColumn` plus the tier-aware page gutter. Screens that scroll should
 * apply this to their content container so one style handles both the cap and
 * the padding.
 */
export function useScreenContent() {
  return {
    alignSelf: 'center' as const,
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: useHorizontalGutter(),
    width: '100%' as const,
  };
}

/**
 * Caps a block of copy or a stacked form to a readable measure and centres it.
 * Without this a single column of text spans a whole monitor.
 */
export function useReadableColumn() {
  return { alignSelf: 'center' as const, maxWidth: layout.readableMaxWidth, width: '100%' as const };
}

/** Caps a form card and centres it, for standalone auth and form screens. */
export function useFormColumn() {
  return { alignSelf: 'center' as const, maxWidth: layout.formMaxWidth, width: '100%' as const };
}

/** Widest a centred chat transcript may get. */
export function useTranscriptColumn() {
  return { alignSelf: 'center' as const, maxWidth: layout.transcriptMaxWidth, width: '100%' as const };
}

/**
 * Column count for the destination grid: two on a phone, then three, then
 * four once there is genuinely room for them. `max` is honoured but never
 * exceeded, so callers can cap a short list at three on a wide screen.
 */
export function useGridColumns(max = 4): number {
  const { width } = useWindowDimensions();
  if (width >= breakpoints.xlarge) return max;
  if (width >= layout.breakpoints.fourUp) return Math.min(4, max);
  if (width >= layout.breakpoints.threeUp) return Math.min(3, max);
  return Math.min(2, max);
}

/**
 * Width of a single grid cell for `columns` columns, gaps included. Computed up
 * front from the window width rather than measured in `onLayout` so the first
 * paint already has the right size and cards never flash at zero width.
 */
export function useGridCellWidth(columns: number): number {
  const width = useContentWidth();
  return Math.max(0, (width - layout.gridGap * (columns - 1)) / columns);
}

/**
 * Splits a capped content column into a two-column row that stays stacked on a
 * phone. Handy for detail screens where a main panel and a side panel should
 * sit together on desktop instead of one below the other.
 */
export function useSideBySide(minColumnWidth = 320): { direction: 'row' | 'column'; gap: number } {
  const isWide = useIsWide();
  const width = useContentWidth();
  const fitsTwo = width >= minColumnWidth * 2 + layout.cardGap;
  return { direction: isWide && fitsTwo ? 'row' : 'column', gap: layout.cardGap };
}