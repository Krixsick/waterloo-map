# Lib Guide

Purpose: Small shared helpers that are not tied to one feature folder. Keep this folder focused on generic utilities used across the frontend.

Files:
- `utils.ts`: Exports `cn(...inputs)`, a Tailwind class helper that combines `clsx` with `tailwind-merge`. Used by shared UI components such as `components/ui/button.tsx`.

Coding preferences:
- Use TypeScript for all shared helpers and avoid broad `any` types.
- Keep helpers small, pure, and reusable. If a helper only makes one component harder to read, keep it in that component instead.
- Prefer established libraries already in the project over custom utility code.

Update rule: When adding or changing shared helpers, document what the helper does, where it is used, and whether it has any framework or styling assumptions.
