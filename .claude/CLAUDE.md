# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project rules live in AGENTS.md

`AGENTS.md` and `.agents/rules/` (`project-core.md`, `frontend.md`) are the source of truth for behavior. Read them before non-trivial work. Key points:

- Reply to the user in Vietnamese (technical terms may stay English). All UI text is Vietnamese.
- Backend API is the contract source of truth: never guess endpoints, rename fields, or add frontend workarounds for contract gaps — stop and report.
- Reuse existing feature patterns (Employee, Department, Leave Request, Attendance, Payroll) and shadcn/ui; no new deps, redesigns, or out-of-scope refactors.
- Never commit, push, reset, or checkout unless explicitly asked; the user commits after their own localhost QA.
- Project skills are in `.agents/skills/<name>/SKILL.md`; AGENTS.md has a table mapping task type → skill (UI work goes through `design-taste-frontend`, code review through `code-review`).
- Attendance → Payroll MVP work follows a gated vertical-slice workflow: read `docs/plans/attendance-calculation-payroll-mvp.md`, `docs/plans/attendance-payroll-mvp-slices.md` and the slice contract (e.g. `docs/modules/work-calendar-s2a.md`) first. Do not cross slice gates or decide OPEN policies; never mark a slice QA'd/done yourself.
- Don't run lint/build after every small change — only at milestones.

## Commands

Backend (`backend/`, Express + Prisma + PostgreSQL, CommonJS TS):

```bash
npm run dev                 # ts-node-dev on src/server.ts
npm run build               # prisma generate && tsc -> dist/
npm run prisma:migrate      # prisma migrate dev
npm run seed
```

Backend tests use `node:test` and import from **`dist/`**, so build first. There is no `test` script:

```bash
npm run build && node --test tests/*.test.cjs            # all (Node 22 needs the glob, not a dir)
npm run build && node --test tests/calendar-exception.test.cjs   # single file
node --test --test-name-pattern="SWAP" tests/calendar-exception.test.cjs
```

`*.integration.test.cjs` are skipped unless `HRM_S1_DB_TEST=1`; they require `DATABASE_URL` pointing at **localhost** and create/drop a uniquely named temporary schema.

Frontend (`frontend/`, Vite + React 19 + TS):

```bash
npm run dev            # http://localhost:5173 (only allowed CORS origin locally)
npm run build          # tsc -b && vite build
npm run lint
npm test               # tsc on tests + vitest run + node --test tests/employee-list.params.test.mjs
npx vitest run tests/work-calendar-s2a.test.tsx   # single file
```

## Architecture

**Backend** — `src/app.ts` mounts each module under `/api/<name>`. Each module in `src/modules/<name>/` is layered `*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.repository.ts` (Prisma via `src/config/prisma.ts`). Services throw a module-specific `<Name>ServiceError` carrying `statusCode`; controllers catch it and map to the HTTP response, falling back to 500. Auth is JWT access + refresh tokens (`auth.middleware.ts`, `role.middleware.ts`); validation is hand-written (`*.validation.ts`), not a schema library. Excel/PDF exports use exceljs/pdfkit generators inside the module.

`work-calendar` is the active area: work schedule versions (DRAFT with `revision` for optimistic concurrency), calendar exceptions (HOLIDAY / COMPENSATORY_OFF / SWAP), holiday batch presets, and a pure `calendar-preview.engine.ts` that projects a month (date-only arithmetic in `calendar-date.ts`, no timezone Date math). It must not compute salary/OT.

**Frontend** — feature-sliced: `src/features/<name>/{api,hooks,lib,types,index.ts}` hold API calls and TanStack Query hooks, exported through the feature `index.ts`; `src/pages/` composes them into routes (admin vs employee areas); `src/widgets/` holds layouts; `src/shared/` holds the Axios client (`shared/api/axios.ts`, `httpClient.ts`), shared components and types. Routing/guards are in `src/app/router.tsx` and `src/app/router/` (`ProtectedRoute`, `PublicRoute`, `RoleGuard`). Forms use React Hook Form + Zod; client state uses Zustand.

`docs/` holds plans, module contracts, agent handoff briefs and `codex-reports/` (review reports from other agents) — useful context for in-flight slices.

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
