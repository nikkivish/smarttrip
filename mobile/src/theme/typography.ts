import { Platform } from 'react-native';

/**
 * A single font family for the whole app.
 *
 * Inter is the preferred UI face, but this project does not ship it: there is
 * no local `.ttf`/`.otf` and no `@expo-google-fonts/*` package, only `expo-font`
 * itself. Naming a family we cannot guarantee to load would render unpredictably,
 * so the family is declared once here as the platform's own UI font. Every text
 * style in `type` reads this token, so dropping in a real face later is a
 * one-line change plus a `useFonts` call.
 *
 * On web the CSS stack matters most: `system-ui` keeps the native feel while the
 * explicit fallbacks stop the text collapsing to Times on browsers that do not
 * know `-apple-system`.
 */
export const fontFamily = Platform.select({
  web: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

/**
 * The type scale. Every style carries size, weight, line height and tracking
 * together so text cannot drift: nothing in the app should set `fontSize`
 * without also setting `lineHeight`, which is what previously left most copy on
 * `line-height: normal` and broke vertical rhythm between screens.
 */
export const type = {
  /** Reserved for the largest moments. Deliberately rare. */
  display: { fontFamily, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, lineHeight: 40 },
  /** Screen titles: "Ready to Explore", "Explore", "Trips", "Safety". */
  title: { fontFamily, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 },
  /** Section headings, e.g. "Insights Today". */
  heading: { fontFamily, fontSize: 19, fontWeight: '700', letterSpacing: -0.4, lineHeight: 25 },
  /** Card and list titles. */
  subheading: { fontFamily, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 22 },
  /** Default body copy. */
  body: { fontFamily, fontSize: 15, fontWeight: '400', letterSpacing: 0, lineHeight: 22 },
  /** Body copy that needs emphasis. */
  bodyStrong: { fontFamily, fontSize: 15, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  /** Buttons, chips and list labels. */
  label: { fontFamily, fontSize: 13, fontWeight: '600', letterSpacing: 0.1, lineHeight: 18 },
  /** Supporting copy under a title. */
  caption: { fontFamily, fontSize: 12, fontWeight: '400', letterSpacing: 0.1, lineHeight: 17 },
  /** Eyebrows and badges. Pair with `textTransform: 'uppercase'`. */
  overline: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, lineHeight: 14 },
  /** Bottom navigation labels. */
  tabLabel: { fontFamily, fontSize: 11, fontWeight: '600', letterSpacing: 0.1, lineHeight: 14 },
} as const;

/** Raster icons that sit inside a text run. */
export const iconSize = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 20,
  xl: 24,
} as const;