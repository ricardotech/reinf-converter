# Reference Notes

Quick recap of the documentation that informed this boilerplate so future contributors can reload the same context without re-reading everything.

## Next.js 16 (App Router)
- Source: https://nextjs.org/docs/app
- Takeaways:
  - API routes inside `app/api/*/route.ts` default to the Node runtime unless explicitly set, which keeps the XLSX package happy.
  - FormData parsing is supported natively and surfaces `File` instances that can be converted to `ArrayBuffer` objects.

## shadcn/ui CLI
- Source: https://ui.shadcn.com/docs/cli
- Takeaways:
  - `npx shadcn@latest init --base-color neutral` updates `app/globals.css` for Tailwind v4 and creates `components.json`.
  - Components are imported individually (`npx shadcn add button input textarea label card`) which keeps the bundle tight and auditable.

## XLSX Parser
- Source: https://docs.sheetjs.com
- Takeaways:
  - `XLSX.read(new Uint8Array(buffer), { type: "array" })` handles both .xls and .xlsx files in the Node runtime.
  - `XLSX.utils.sheet_to_json` with `defval: ""` avoids `undefined` cells, making XML serialization easier.

## xmlbuilder2
- Source: https://oozcitak.github.io/xmlbuilder2
- Takeaways:
  - `create({ version: "1.0", encoding: "UTF-8" })` returns a builder whose `.end({ prettyPrint: true })` output stays deterministic.
  - Creating row and field nodes inside the builder keeps the XML document streaming-friendly without manual string concatenation.

## R Jina AI Hand-off
- Source: R Jina AI workflow briefs (internal)
- Takeaways:
  - Favor non-login utilities for importer experiences so agents can run them locally without provisioning auth.
  - Keep a router file plus agent notes to support multi-context sessions and prevent knowledge drift between builders.
