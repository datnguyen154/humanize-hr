# Humanize HR - HR Management System

Humanize HR is a full-stack HR management system for a small company. It covers people data, attendance, leave and a complete **work calendar → monthly timesheet → payroll** flow, with separate portals for **Admin** and **Employee**.

It is a portfolio project focused on frontend engineering: real user flows, type-safe and testable code, responsive layouts and careful loading, error and concurrency states.

## 🚀 Live Demo

- **Frontend:** https://humanize-hr.vercel.app
- **Backend API:** https://humanize-hr-api.onrender.com
- **Health Check:** https://humanize-hr-api.onrender.com/health

> The backend runs on Render Free and sleeps when idle. The first request can take **30–60 seconds**; the login page detects this and shows a "server is waking up" notice with elapsed time instead of a silent spinner.

## Demo Accounts

The login page has one-click buttons that fill these in.

```txt
Admin
Email: admin@example.com
Password: 12345678

Employee
Email: employee@example.com
Password: Employee@123
```

## Features

### Admin

- Dashboard with KPI cards, attendance trend chart, recent activity and manual refresh
- Employees: search, filters and sort kept in the URL (debounced search, Back/Forward safe), detail, create/edit, status, department assignment
- Excel import with a preview step, partial success and drag & drop; Excel export that follows the active filters
- Departments: list, detail with members, create/edit, status
- Attendance list, monthly attendance report with Excel export
- Attendance adjustment requests: review, approve or reject with history
- **Work calendar**
  - Draft schedules (working days, hours, lunch break) with optimistic concurrency (`revision`, 409 handling, reload prompt)
  - Calendar exceptions: holidays, compensatory days off, day swaps, monthly preview
  - Batch holiday setup from a verified Vietnamese holiday catalogue, with preview before saving
  - **Activation**: a draft becomes the ACTIVE calendar from a future date; ACTIVE versions are immutable
- **Monthly timesheet** computed on demand from the ACTIVE calendar, punches and approved leave; drill-down calendar per employee
- **Payroll from the timesheet**: base salary = monthly salary × payable days / standard days, preview in the form, publish (locks the payroll) and PDF payslip
- Leave requests with assigned approvers, notification center, HR assistant chatbot

### Employee

- Dashboard with check-in / check-out, KPI cards and recent activity
- Attendance history; a "Ngoài lịch" (out of schedule) badge for punches on days off
- **My timesheet**: month calendar, payable days, and a list of days to reconcile that links to a prefilled adjustment request
- Attendance adjustment requests, leave requests
- Published payslips with PDF download
- Profile, change password, notifications, HR assistant

### Attendance → payroll flow

1. Admin activates a work calendar (from tomorrow onwards, never retroactive).
2. Check-in is marked late against that day's shift start. Punches on weekends or holidays are kept for review, flagged out of schedule, and never counted as payable or overtime.
3. The monthly timesheet counts required, present, late, paid and unpaid leave, absent and missing check-out days. Standard days come from the calendar instead of a fixed 22 or 26.
4. After the month ends, Admin creates the payroll from the timesheet. The payable and standard day counts are stored on the payroll, so later punches or calendar changes do not rewrite history.

Demo conventions, not legal advice: annual and "other" approved leave is paid; sick and unpaid leave is not. Being late is only counted, never turned into a salary deduction.

## Tech Stack

### Frontend

React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Axios, Zustand, Tailwind CSS, shadcn/ui (Radix), lucide-react, Recharts

### Backend

Node.js, Express, PostgreSQL, Prisma ORM, JWT access + refresh tokens, ExcelJS, PDFKit

### Testing and tooling

Vitest + React Testing Library, `node:test` (unit and real-PostgreSQL integration tests), Playwright (screenshot evidence with API mocks), ESLint

### Deployment

Vercel (frontend), Render Free (API), Neon PostgreSQL (free tier)

## Technical Highlights

- **Feature-sliced frontend**: `features/<name>/{api,hooks,lib,types}` behind a typed Axios client, with pages composing them. Query keys are factories, and mutations invalidate exactly what they change.
- **URL as state** for list filters and timesheet periods: pages can be shared, survive reloads and work with Back/Forward.
- **Concurrency-aware forms**: calendar edits send `expectedRevision`. A 409 conflict locks the form and offers a confirmed reload instead of overwriting newer data.
- **Pure calculation engines** for the calendar preview, timesheet and payroll proration. They contain no I/O, are unit-tested, and are reused by the API and by the screenshot harness.
- **Free-tier aware**: everything is computed on request (no cron or workers), migrations are additive, and the login page handles cold starts.
- **Accessibility and responsiveness**: dialogs with focus return and dirty-state guards, screen-reader labels for calendar cells, and mobile layouts that switch tables to cards or rows instead of scrolling sideways.

## Screenshots

### Login Page

![Login Page](./docs/images/login.jpg)

### Admin Dashboard

![Admin Dashboard](./docs/images/admin-dashboard-1.jpg)
![Admin Dashboard](./docs/images/admin-dashboard-2.jpg)

### Employee Dashboard

![Employee Dashboard](./docs/images/employee-dashboard.jpg)

### Employee Management

![Employee Management](./docs/images/employee-management.jpg)

### Attendance Management

![Attendance Management](./docs/images/attendance-management.jpg)

### Leave Request Management

![Leave Request Management](./docs/images/leave-request-management.jpg)

### Work Calendar Activation

![Active calendar and drafts](./docs/evidence/p1/p1-04-settings-after-activate-1440.png)

### Monthly Timesheet

![Company timesheet](./docs/evidence/p2/p2-01-company-timesheet-1440.png)
![Employee timesheet calendar](./docs/evidence/p2/p2-04-admin-employee-detail-1440.png)

### Payroll from the Timesheet

![Create payroll from timesheet](./docs/evidence/p3/p3-01-create-from-timesheet-1440.png)

### Cold-start Notice

![Server waking up](./docs/evidence/cold-start/cold-start-01-waking-390.png)

## Getting Started

### Prerequisites

Node.js 22, npm, PostgreSQL, Git

### Install and run

```bash
git clone https://github.com/datnguyen154/humanize-hr.git
cd humanize-hr

cd backend
npm install
npm run prisma:migrate:deploy   # apply migrations
npm run seed                    # demo users, departments, employees, calendar, punches
npm run dev                     # http://localhost:3000

cd ../frontend
npm install
npm run dev                     # http://localhost:5173
```

### Environment variables

`backend/.env`

```env
DATABASE_URL="postgresql://username:password@localhost:5432/hrm_db"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
# optional
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=3000
```

`frontend/.env`

```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

## Testing

```bash
# frontend: type-check tests, Vitest + RTL, URL helper tests
cd frontend && npm test && npm run lint && npm run build

# backend: tests run against the compiled output
cd backend && npm run build && node --test tests/*.test.cjs

# backend integration tests on a real local PostgreSQL (each uses its own temporary schema)
HRM_S1_DB_TEST=1 HRM_S2A_DB_TEST=1 HRM_P3_DB_TEST=1 node --test tests/*.integration.test.cjs
```

Screenshot evidence for the attendance and payroll flow can be regenerated with Playwright against the Vite dev server. The scripts are in `scripts/evidence/`, for example `EVIDENCE_DIR=docs/evidence/p2 node scripts/evidence/p2-timesheet.cjs`.

## API Overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh-token`, `GET /api/auth/me`, `PATCH /api/auth/change-password` |
| Employees | `GET/POST /api/employees`, `GET/PATCH /api/employees/:id`, `PATCH /api/employees/:id/status`, `GET /api/employees/me`, Excel import/export |
| Departments | `GET/POST /api/departments`, `GET/PATCH /api/departments/:id`, `PATCH /api/departments/:id/status` |
| Attendance | `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `GET /api/attendance/history`, `GET /api/attendance`, `GET /api/attendance/monthly-report` (+ `/export`) |
| Adjustments | `GET/POST /api/attendance/adjustment-requests`, `GET /api/attendance/adjustment-requests/:id`, `PATCH /api/attendance/adjustment-requests/:id/review` |
| Timesheet | `GET /api/attendance/timesheet`, `GET /api/attendance/timesheet/employees/:employeeId`, `GET /api/attendance/timesheet/me` |
| Work calendar | `GET/POST /api/work-calendar/versions` (`?status=DRAFT\|ACTIVE`), `GET/PATCH /api/work-calendar/versions/:id`, `POST /api/work-calendar/versions/:id/activate`, exceptions CRUD, `GET /api/work-calendar/preview`, holiday presets and batch |
| Payroll | `GET/POST /api/payrolls`, `POST /api/payrolls/from-timesheet`, `PATCH /api/payrolls/:id`, `PATCH /api/payrolls/:id/publish`, `GET /api/employees/me/payrolls` (+ PDF) |
| Leave | `GET/POST /api/leave-requests`, `GET /api/leave-requests/:id`, `PATCH /api/leave-requests/:id/status` |
| Other | dashboards, notifications, HR assistant |

## Roadmap

Deliberately out of scope for this MVP: salary templates and rule engines, insurance and tax, hourly/daily pay, night or rotating shifts, overtime, and a separate correction process after payroll is published.

## Repository

Source code: https://github.com/datnguyen154/humanize-hr

## Author

Developed by Đạt.
