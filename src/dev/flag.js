/**
 * Whether the development-only views (/dev/data, /dev/planner) are enabled — R6.
 *
 * True in `npm run dev` (Vite sets import.meta.env.DEV) or when a production-style build
 * explicitly opts in via VITE_ENABLE_DEV_VIEWS=true. False in a normal production build, which
 * is what lets src/dev/index.jsx build an empty DEV_ROUTES array and let Vite's dead-code
 * elimination drop the views (and their whole chunks) from dist/ entirely.
 */
export const DEV_VIEWS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_VIEWS === 'true';
