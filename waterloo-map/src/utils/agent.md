# Utils Guide

Purpose: Feature-agnostic utility functions used by app code. Keep functions pure where possible and avoid React or Mapbox-specific state here.

Files:
- `timeUtils.ts`: Exports `getTimeRemaining(hours)`. It parses simple open-hour strings such as `12pm - 11pm` and returns user-facing status text like how long remains before closing.

Coding preferences:
- Use TypeScript and precise input/output types for utilities.
- Keep utilities short, pure, and easy to test. Avoid hidden React, Mapbox, DOM, or network dependencies.
- Prefer simple readable logic over clever one-liners when parsing dates, times, or external data.

Update rule: When adding helpers or changing formatting/parsing behavior, document the expected input format, output format, and any edge cases here.
