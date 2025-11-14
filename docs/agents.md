# Agents Cheat Sheet

This importer will usually be owned by a compact crew of agents. The list below captures who does what so you can swap in the right help quickly.

## Builder Agent
- **Focus:** Stand up the Next.js workspace, configure shadcn/ui, keep dependencies lean.
- **Inputs:** `router.md` milestones 1 and 2, Next.js docs, shadcn/ui CLI reference.
- **Outputs:** Stable scaffolding, Tailwind tokens, reusable UI surface.
- **Context Window Tip:** Load `/app`, `/components`, and `/docs/router.md` only to avoid noise from generated XML payloads.

## Integration Agent
- **Focus:** Owns the API route plus any shared libs (`lib/xls.ts`), handles Excel parsing and XML serialization.
- **Inputs:** XLSX documentation, xmlbuilder2 API cheat sheets, `docs/references.md`.
- **Outputs:** `app/api/xls-to-xml/route.ts`, conversion helpers, validation rules.
- **Context Window Tip:** Pull in `/lib`, `/app/api`, and lint output. Skip UI files unless debugging fetch calls.

## UI/Delivery Agent
- **Focus:** Tunes `app/page.tsx`, ensures the UX stays minimal, wires buttons, badges, and copy/download helpers.
- **Inputs:** shadcn/ui component docs, Tailwind tokens from `app/globals.css`.
- **Outputs:** Production-ready UI and accessible affordances for the importer.
- **Context Window Tip:** Combine `/app/page.tsx` with `docs/router.md` milestone 2 to keep reasoning within a 3-4k token slice.

## QA/Systems Agent
- **Focus:** Runs `npm run lint`, reviews docs, tracks vulnerabilities, confirms API behavior from a user perspective.
- **Inputs:** `docs/router.md` milestone 4, `docs/references.md`, terminal transcripts.
- **Outputs:** Verification notes, issues, deployment blockers.
- **Context Window Tip:** Load only lint/test logs plus `/docs` to make verdicts without re-reading implementation details.
