---
name: frontend
description: Frontend implementation standards (UI, components, styling, accessibility, state, API calls). Use whenever creating or editing any UI/frontend code, pages, components, or styles — including during speckit-implement tasks.
---

# Frontend Skill

Follow these rules for every frontend task. If the project already has conventions (check `package.json`, existing components, `plan.md`), **match them first**.

## 1. Before Coding
- Read the feature's `spec.md` / `plan.md` for UI requirements and the chosen stack.
- Reuse existing components, hooks, utils, and design tokens before creating new ones.
- Do not add new libraries unless `plan.md` allows it.

## 2. Structure
- One component per file; name files and components in `PascalCase`.
- Keep components small (< ~200 lines). Split UI (presentational) from logic (hooks/services).
- Put API calls in a dedicated service/api layer, never directly scattered in components.
- Shared types/interfaces live in a `types` folder or next to the feature.

## 3. Design & Styling
- Use the project's design system/tokens (colors, spacing, fonts) — no hard-coded random values.
- Modern, clean look: consistent spacing, clear hierarchy, rounded corners, subtle shadows, smooth hover/focus transitions.
- Fully responsive (mobile-first). Test at ~375px, 768px, 1280px.
- Support dark mode if the project does.

## 3b. Avoid the "Generic AI" Look
- NO default purple/blue gradients, glowing blobs, emoji icons, or centered hero + 3 cards layouts.
- Pick ONE brand color + neutrals; define a palette once and stick to it.
- Use a real font pair (e.g. Inter/Geist for UI, one display font for headings) with a clear type scale.
- Use a consistent spacing scale (4/8px) and generous whitespace; align everything to a grid.
- Use one icon set (e.g. Lucide) — never mix styles or use emojis as icons.
- Real-looking content: realistic names, numbers, dates — no "Lorem ipsum" or "Feature 1".
- Restraint: few shadows, subtle borders, max 1–2 accent effects per page.
- Take inspiration from polished products (Linear, Stripe, Vercel, Notion) for density and hierarchy.

## 4. UX States (required for every data view)
- **Loading** (skeleton/spinner), **Empty**, **Error** (with retry), **Success**.
- Disable buttons while submitting; show feedback (toast/inline message).
- Forms: client-side validation, clear inline error messages, labels on all inputs.

## 5. Accessibility
- Semantic HTML (`button`, `nav`, `main`, `label`…), not clickable `div`s.
- Every image has `alt`; icon-only buttons have `aria-label`.
- Keyboard navigable, visible focus states, color contrast ≥ WCAG AA.

## 6. State & Data
- Keep state as local as possible; lift only when needed.
- Never store secrets/tokens in code; use env variables.
- Handle API errors gracefully; never let the UI crash on bad data.

## 7. Code Quality
- TypeScript strict types (no `any`) if the project uses TS.
- No unused code, no `console.log` left behind.
- Run the project's lint/format/typecheck/build after changes and fix errors.
- Add/update tests for components with logic when the project has a test setup.

## 8. Done Checklist
- [ ] Matches spec & existing conventions
- [ ] Responsive + accessible
- [ ] Loading / empty / error states handled
- [ ] Lint, typecheck, build pass
- [ ] Task marked `[X]` in `tasks.md`
