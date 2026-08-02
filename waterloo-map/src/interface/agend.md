# Components Guide

Purpose: React UI for the map experience. Keep visual controls and screen state here, and keep lower-level Mapbox layer/source logic in `../map`.

Files:
- `Map.tsx`: Main map screen. Owns Mapbox, building categories, transit visibility/modes, and the selected stop/vehicle. It filters Bus and ION source data before updating Mapbox, composes the map inside `sidebar/Sidebar.tsx`, and passes controlled filters into the menu panel.
- `searchbar/SearchBar.tsx`: Google Maps-style campus search surface. It filters local building GeoJSON by name, abbreviation, or category, supports mouse and keyboard selection, and flies Mapbox to the selected result.
- `BuildingDetailsCard.tsx`: Floating details card for the selected building. Shows name, abbreviation, live hours, time remaining, and close action.
- `MapControls.tsx`: Bottom-right map controls. Uses a DaisyUI flower FAB for reset view, 2D/3D toggle, and fly-to-me actions.
- `MapFilters.tsx`: Left-sidebar filter content for building categories and transit. It uses controlled checkboxes from `Map.tsx`, includes separate Bus and ION mode filters, and displays scheduled-stop/live-vehicle counts plus feed states.
- `sidebar/Sidebar.tsx`: Responsive map shell. It owns only the menu panel's open state. The 320px drawer animates from the viewport edge, covers the icon rail, and overlays the map above a dismissible backdrop.
- `../components/app-sidebar.tsx`: Static 64px icon rail. Its three-line menu button opens the animated overlay drawer without nesting a second drawer component.
- `TransitDetailsCard.tsx`: Responsive stop/vehicle panel. Stop selections show upcoming Bus and ION departures. Vehicle selections show destination, travel direction, status, and exactly the next three stops with predicted or scheduled arrival times.
- `loading/LoadingScreen.tsx`: Full-viewport initial splash screen. It stays visible for at least one second, waits for the interactive Mapbox surface, then fades out while auxiliary query data continues loading.

Coding preferences:
- Use TypeScript props and shared types from `../types`. Avoid `any` unless the external library type is genuinely unavailable.
- Use TanStack Query hooks from `../api` for backend data. Do not fetch directly inside UI components.
- Keep components focused and short. Move repeated UI into small components and non-UI calculations into `../utils` or `../map`.
- Prefer readable, direct JSX and Tailwind classes over long conditional blocks. Use clear names and remove dead/commented code when replacing an approach.

Update rule: When adding, removing, renaming, or changing how a component owns state or talks to map/API code, update this guide in the same change.
