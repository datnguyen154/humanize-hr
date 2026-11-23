# Humanize HR — CV entry (to paste into the CV slide)

Same structure as the project entries in the CV template: title line with the stack, links, then 5–6 bullets.
Only use the "after QA" bullets once P1–P3 are QA'd on localhost **and** the Render backend serves them in production.

---

**Humanize HR — HR Management System** | React 19, TypeScript, TanStack Query, React Hook Form + Zod, Tailwind CSS, shadcn/ui · Node.js, Express, Prisma, PostgreSQL

humanize-hr.vercel.app · github.com/datnguyen154/humanize-hr

### Ready now (features already live)

- Built a **full-stack HR system** with Admin/Employee portals, **JWT access + refresh tokens**, role-based protected routes and a **feature-sliced frontend** (`/features/{api,hooks,lib,types}`, `/pages`, `/shared`)
- Kept list filters, sort and pagination **in the URL** with **debounced search**: shareable links, Back/Forward safe, no layout jump while refetching (`keepPreviousData`)
- Built **Excel import with a preview step and partial success** (drag & drop, row-level errors) and **Excel export** that follows the active filters
- Built a **work calendar editor**: holidays, compensatory days off, day swaps, batch holiday setup and a monthly preview, with **optimistic concurrency** (revision + HTTP 409 → locked form and confirmed reload) and **unsaved-change guards** on every dialog
- Added an **attendance adjustment workflow** (request → review → approve/reject), a **notification center** and **PDF payslips**
- Wrote **120+ Vitest/React Testing Library tests** and **130+ backend tests**, including **integration tests on a real PostgreSQL database**. Deployed on **Vercel + Render + Neon** (all free tiers)

### Add after P1–P3 QA + backend deploy

- Delivered a **calendar → timesheet → payroll flow**. Check-in is marked late against the ACTIVE calendar. The **monthly timesheet is computed on demand** (payable days / standard days). Payroll is generated from it after the month closes and **locked on publish**
- Designed **cold-start UX for a free-tier backend**: the login page warms up the server, shows elapsed time, confirms when ready and offers a retry without blocking the form
- Built **Playwright screenshot evidence** with API mocks backed by the backend's own pure calculation engines

### One-line version (for a short CV)

Full-stack HR system (React 19 + TypeScript + TanStack Query / Express + Prisma + PostgreSQL) with URL-synced lists, Excel import preview, a concurrency-safe work calendar, and an attendance → timesheet → payroll flow; 250+ automated tests, deployed on free-tier Vercel/Render/Neon.

---

Note: the current CV file (`[FRONTEND INTERSHIP CV] Nguyen Xuan Dat.pptx`) still contains the template owner's content (name, contact, projects). Replace all of it with your own details. Do not just add this entry next to theirs.
