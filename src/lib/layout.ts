// Desktop web layout: from DESKTOP_MIN wide the app drops the phone pager for
// a sidebar + page + BETina rail (AppShell), and pages outside the shell sit
// in a centred column. Everything that sizes itself by the screen width asks
// useContentWidth() instead, so it fits the column it is drawn in.
import { createContext, useContext } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export const DESKTOP_MIN = 1024;
/** Left navigation. */
export const SIDEBAR_W = 248;
/** Right BETina rail, shown from RAIL_MIN wide. */
export const RAIL_W = 340;
export const RAIL_MIN = 1360;
/** Widest a shell page grows before it centres. */
export const PAGE_MAX = 1120;
/** Column for screens outside the shell (article, match, settings …). */
export const COLUMN_MAX = 760;

export function isDesktopWidth(width: number) {
  return Platform.OS === 'web' && width >= DESKTOP_MIN;
}

export function useDesktop() {
  const { width } = useWindowDimensions();
  return isDesktopWidth(width);
}

/** Set by the shell for its page area; null = decide from the window. */
export const ContentWidthContext = createContext<number | null>(null);

/** Width the current screen is drawn in. */
export function useContentWidth() {
  const given = useContext(ContentWidthContext);
  const { width } = useWindowDimensions();
  if (given != null) return given;
  return isDesktopWidth(width) ? Math.min(width, COLUMN_MAX) : width;
}
