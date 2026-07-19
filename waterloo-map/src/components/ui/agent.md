# UI Components Guide

Purpose: Shared reusable UI primitives. These should stay generic and should not contain Waterloo map, building, event, food, gym, or library-specific behavior.

Files:
- `button.tsx`: shadcn-style `Button` component built with `class-variance-authority`. It defines visual variants/sizes and uses `cn` from `@/lib/utils` to merge Tailwind classes.

Coding preferences:
- Use TypeScript and typed variants/props for shared UI primitives.
- Keep these components generic, small, and composable. Do not add feature-specific map logic here.
- Prefer existing helper patterns such as `cn` and variant utilities instead of custom class-merging code.

Update rule: When adding or changing shared UI primitives, document the component purpose, important variants, and any dependencies here.
