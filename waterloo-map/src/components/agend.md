# Components Guide

Purpose: React UI for the map experience. Keep visual controls and screen state here, and keep lower-level Mapbox layer/source logic in `../map`.

Files:
- `Map.tsx`: Main map screen. Creates the Mapbox map, owns refs/state for the map instance, loading, 2D/3D mode, selected building, and active marker categories. It merges backend library hours into the static building GeoJSON and wires the map helpers, search, filters, controls, and details card together.
- `BuildingSearch.tsx`: Expanding search button and input. Searches the local building GeoJSON by name, abbreviation, and category, then flies the map to the selected building and reports the selection back to `Map.tsx`.
- `BuildingDetailsCard.tsx`: Floating details card for the selected building. Shows name, abbreviation, live hours, time remaining, and close action.
- `MapControls.tsx`: Bottom-right map controls. Uses a DaisyUI flower FAB for reset view, 2D/3D toggle, and fly-to-me actions.
- `MapFilters.tsx`: Filter menu for marker categories. Lets the user toggle categories and reset the active category list.

Coding preferences:
- Use TypeScript props and shared types from `../types`. Avoid `any` unless the external library type is genuinely unavailable.
- Use TanStack Query hooks from `../api` for backend data. Do not fetch directly inside UI components.
- Keep components focused and short. Move repeated UI into small components and non-UI calculations into `../utils` or `../map`.
- Prefer readable, direct JSX and Tailwind classes over long conditional blocks. Use clear names and remove dead/commented code when replacing an approach.

Update rule: When adding, removing, renaming, or changing how a component owns state or talks to map/API code, update this guide in the same change.
