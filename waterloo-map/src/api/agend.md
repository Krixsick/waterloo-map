# API Guide

Purpose: Frontend data-fetching hooks and request helpers. These files use `axios`, React Query, and `VITE_API_URL` to call the backend.

Local development uses `VITE_API_URL=http://localhost:3001` from `.env.development`. Restart Vite after changing environment files.

Files:
- `events.ts`: Fetches Waterloo event data from `${VITE_API_URL}/events` and exposes `getWaterlooEvents()` as a React Query hook with the `["waterloo-events"]` query key.
- `buildingsApi.ts`: Currently also fetches `${VITE_API_URL}/events` and exposes `getWaterlooEvents()`. The filename is misleading right now, so update or remove this file if event fetching is consolidated.
- `libraryApi.ts`: Fetches library hours from `${VITE_API_URL}/library/hours` and exposes `useLibraryHours()` with the `["library-hours"]` query key.
- `foodApi.ts`: Fetches campus food data from `${VITE_API_URL}/food/campus` and exposes `useCampusFood()` with the `["campus-food"]` query key.
- `gymApi.ts`: Fetches gym occupancy/details from `${VITE_API_URL}/gym` and exposes `useGymInfo()` with the `["gym"]` query key.
- `transitApi.ts`: Reuses one typed request helper for live vehicles, stop arrivals, and alerts. TanStack Query polls vehicles/arrivals every 15 seconds while enabled.

Coding preferences:
- Use TypeScript for request helpers, hook return values, and API response shapes. Prefer shared types from `../types` over inline `any`.
- Use TanStack Query for backend/server state. Keep query keys stable, descriptive, and colocated with the hook.
- Keep API files short: one fetch helper plus one exported hook is the preferred shape unless there is a clear reason to add more.
- Prefer clean, direct code over long abstractions. Add error/loading behavior in the consuming component only when the UI needs it.

Update rule: When adding endpoints, changing response shapes, changing query keys, or moving fetch logic, update this guide so future AI work can find the correct hook and backend route.
