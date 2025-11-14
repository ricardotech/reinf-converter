# Delivery Router

This router keeps the XLS/XLSX to XML importer aligned with the expectations we pulled from the Next.js 16, shadcn/ui, and R Jina AI workflow notes.

## Milestones and Agents

| # | Milestone | Outcome | Recommended Agent | Context Window |
| - | --------- | ------- | ----------------- | -------------- |
| 1 | Baseline | Next.js TypeScript workspace ready with Tailwind v4 tokens. | **Builder** (strong framework skills) | 2k instructions focused on scaffolding. |
| 2 | Interface | Minimal shadcn/ui surface for file intake and preview. | **UI Engineer** (design-minded builder) | 4k instructions centered on component composition. |
| 3 | API + Conversion | `/api/xls-to-xml` parses XLS/XLSX files and emits XML. | **Integration Specialist** (backend-heavy) | 6k instructions for Node runtime, file uploads, and format conversion. |
| 4 | Ops + Docs | Markdown guides, QA cues, and deployment readiness. | **Systems/QA Agent** | 3k instructions with documentation + verification focus. |

## Execution Flow

1. **Scaffold** the app with `create-next-app --ts --tailwind` to match the Next.js 16 starter that R Jina AI currently recommends for green-field widgets.
2. **Stabilize tokens** by running the new shadcn CLI (`npx shadcn init --base-color neutral`) so every agent inherits the same Tailwind v4 palette.
3. **Wire UI** using shadcn components (`button`, `input`, `textarea`, `card`, `label`) for an upload experience that needs zero authentication.
4. **Implement API** in `app/api/xls-to-xml/route.ts`, leaning on the XLSX library for parsing and `xmlbuilder2` for deterministic XML trees.
5. **Surface results** on `app/page.tsx` with optimistic status badges, XML preview panel, and download/copy actions.
6. **Document** supporting knowledge (`docs/agents.md`, `docs/references.md`) and outline QA rituals so future agents can load just the slice they need.

## Context Windows

- **Research Window (1k tokens):** Pulls from Next.js, shadcn/ui, XLSX, and xmlbuilder docs to justify the architectural choices.
- **Build Window (4k tokens):** Focuses on `app/page.tsx`, `app/api/xls-to-xml/route.ts`, and `lib/xls.ts` without the extra narrative noise.
- **QA Window (2k tokens):** Restricts context to lint/test output plus the docs folder so validation agents can issue fast go/no-go decisions.

Each window can be loaded independently depending on which agent is active, which keeps the effort aligned with multi-agent orchestration guidelines in the R Jina AI handbook.
