# Types Guide

Purpose: Shared TypeScript types for API responses and cross-component props. Keep response-shape definitions here so API hooks and components do not duplicate type declarations.

Files:
- `events.ts`: Types for Wat2Do event data. Includes raw event/occurrence response shapes and the normalized `WaterlooEvent` type with fields such as `title`, `startDate`, `location`, `mapURL`, and nullable `coordinates`.
- `food.ts`: Types for campus food data, including `CampusFoodInfo`.
- `gym.ts`: Types for gym occupancy/details, including `GymOccupy` and `GymFullInfo`.
- `library.ts`: Types for library opening-hour data, including `TimeSlot`.
- `map.ts`: Shared map component props, currently `MapControlsProps`.
- `transit.ts`: Normalized GRT stops, departures, live vehicles, trip details, marker selections, arrivals, alerts, and list/item response types shared by hooks and map UI.

Coding preferences:
- Use TypeScript types/interfaces instead of `any`. Model nullable backend values explicitly with `null` or optional fields.
- Keep raw backend response types separate from normalized frontend types when the app transforms the data.
- Reuse shared prop and API types across components and hooks instead of redefining shapes inline.
- Keep type files short and grouped by feature.

Update rule: When backend response fields, normalized frontend models, or shared prop contracts change, update the matching type file and this guide together.
