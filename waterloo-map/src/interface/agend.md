# Components Guide

Purpose: React UI for the map experience. Keep visual controls and screen state here, and keep lower-level Mapbox layer/source logic in `../map`.

Files:
- `Map.tsx`: Main map screen. Owns Mapbox, building categories, transit visibility, and the selected stop/vehicle. It passes marker selections into `TransitDetailsCard` and keeps selected live vehicle data current without duplicating it in an effect.
- `searchbar/SearchBar.tsx`: Google Maps-style campus search surface. It filters local building GeoJSON by name, abbreviation, or category, supports mouse and keyboard selection, and flies Mapbox to the selected result.
- `BuildingDetailsCard.tsx`: Floating details card for the selected building. Shows name, abbreviation, live hours, time remaining, and close action.
- `MapControls.tsx`: Bottom-right map controls. Uses a DaisyUI flower FAB for reset view, 2D/3D toggle, and fly-to-me actions.
- `MapFilters.tsx`: Click/hover filter menu for building categories and transit. It displays scheduled-stop and live-vehicle counts plus loading, partial, live, scheduled-only, and unavailable states.
- `TransitDetailsCard.tsx`: Responsive stop/vehicle panel. Stop selections show merged upcoming departures; vehicle selections show destination, status, and the next three stops. It labels every time as live or scheduled and owns loading/error/empty states.
- `loading/LoadingScreen.tsx`: Full-viewport initial splash screen. It stays visible for at least one second, waits for the interactive Mapbox surface, then fades out while auxiliary query data continues loading.

Coding preferences:
- Use TypeScript props and shared types from `../types`. Avoid `any` unless the external library type is genuinely unavailable.
- Use TanStack Query hooks from `../api` for backend data. Do not fetch directly inside UI components.
- Keep components focused and short. Move repeated UI into small components and non-UI calculations into `../utils` or `../map`.
- Prefer readable, direct JSX and Tailwind classes over long conditional blocks. Use clear names and remove dead/commented code when replacing an approach.

Update rule: When adding, removing, renaming, or changing how a component owns state or talks to map/API code, update this guide in the same change.
