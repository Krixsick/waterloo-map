# Map Guide

Purpose: Mapbox-specific setup, styling, layers, filters, and pointer interactions. Keep raw Mapbox source/layer/event code here so React components can stay focused on UI and state.

Files:
- `createMap.ts`: Creates the Mapbox map instance with the Waterloo campus center, default zoom, min/max zoom, pitch, bearing, and Mapbox Streets style.
- `mapStyle.ts`: Contains map style helpers. `hideDefaultLabels()` hides most default symbol labels while keeping road labels visible.
- `buildingLayers.ts`: Adds the 3D building extrusion layer, the `important-buildings` GeoJSON source, green circle/glow marker layers, hover marker layer, and square residence marker images/layers.
- `buildingFilters.ts`: Applies category filters to building marker layers. Handles residence markers separately because residences use square symbol layers while most categories use circle layers.
- `buildingHover.ts`: Adds popup CSS and Mapbox mouse/click handlers for building markers. Updates hover layers, shows the popup HTML, changes cursor state, and calls the selected-building callback.
- `transitLayers.ts`: Owns separate scheduled-stop and live-vehicle GeoJSON sources. Bus stops are small blue markers, ION stations are larger pink markers with labels, and live vehicles are larger labeled markers. Click handlers send normalized selections back to React and never fetch data directly.

Coding preferences:
- Use TypeScript and Mapbox types where practical. Keep layer/source IDs stable and easy to search.
- Keep Mapbox helpers focused: setup in `createMap`, styling/layers in layer files, filters in filter files, and interactions in hover/click files.
- Prefer short named helpers and constants over long inline layer/filter expressions when it improves readability.
- Do not fetch backend data here. Map data should be passed in from components or prepared before calling these helpers.

Update rule: When changing Mapbox sources, layer IDs, filters, marker styling, popups, or map event handlers, update this guide and check all files that reference the affected layer/source IDs.
