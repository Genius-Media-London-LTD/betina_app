// Shared header metrics of the swipe pager (AppShell) — pages pad their
// content by `top` so it starts below the floating header.
import { createContext, useContext } from 'react';

export type Chrome = { top: number; bottom: number };

export const ChromeContext = createContext<Chrome>({ top: 0, bottom: 0 });

/** Space the shared header takes at the top (pad page content by this). */
export const useChrome = () => useContext(ChromeContext);
