# Humanize HR - HR Management System

Humanize HR is a full-stack HR Management System built to practice developing a real-world web application for managing employees and HR operations.

The system supports two main roles: **Admin** and **Employee**. Admin users can manage employees, departments, attendance records and leave requests. Employee users can use a self-service portal to check in/out, view attendance history, create leave requests, view their profile and change their password.

## Features

### Admin

- Login and logout
- Role-based access control
- Admin dashboard with KPI cards, chart and recent activities
- Employee management
  - View employee list
  - Search, filter, sort and paginate employees
  - View employee detail
  - Create employee
  - Edit employee
  - Update employee status
- Department management
  - View department list
  - Search, filter, sort and paginate departments
  - View department detail
  - Create department
  - Edit department
  - Update department status
- Attendance management
  - View employee attendance records
  - Search and filter attendance records
  - Pagination support
- Leave request management
  - View leave request list
  - View leave request detail
  - Approve leave request
  - Reject leave request
- Responsive admin layout for desktop, tablet and mobile

### Employee

- Login and logout
- Employee dashboard
  - Personalized welcome header
  - KPI cards
  - Attendance status widget
  - Recent activities
  - Quick actions
- Check in and check out directly from the dashboard
- View attendance history
- Leave request self-service
  - View leave request list
  - Create leave request
  - View leave request detail
- View personal profile
- Change password
- Responsive employee layout for desktop, tablet and mobile

## Tech Stack

### Frontend

- ReactJS
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios
- TailwindCSS
- shadcn/ui
- lucide-react
- Recharts

### Backend

- Node.js
- ExpressJS
- PostgreSQL
- Prisma ORM
- JWT Authentication

## Technical Highlights

- Built with ReactJS, TypeScript and Vite
- REST API integration with Axios
- Server state management with TanStack Query
- Form handling with React Hook Form
- Schema validation with Zod
- Role-based routing for Admin and Employee users
- Protected routes based on authentication state and user role
- Reusable layout structure for Admin and Employee portals
- Responsive UI for desktop, tablet and mobile
- Mobile-friendly card layouts for data-heavy pages
- Loading, error and empty states for better user experience
- Toast notifications for user actions
- Dashboard data visualization with charts
- Clean separation between API layer, hooks, types and page components

## Screenshots

> Add screenshots to the `docs/images` folder and update the image paths below.

### Login Page

![Login Page](docs/images/login.png)

### Admin Dashboard

![Admin Dashboard](docs/images/admin-dashboard.png)

### Employee Dashboard

![Employee Dashboard](docs/images/employee-dashboard.png)

### Employee Management

![Employee Management](docs/images/employee-management.png)

### Attendance Management

![Attendance Management](docs/images/attendance-management.png)

### Leave Request Management

![Leave Request Management](docs/images/leave-request-management.png)

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

### Clone the repository

```bash
git clone https://github.com/datnguyen154/humanize-hr.git
cd humanize-hr
```

### Install dependencies

If the project uses separate frontend and backend folders:

```bash
cd frontend
npm install
```

```bash
cd backend
npm install
```

### Run the frontend

```bash
cd frontend
npm run dev
```

### Run the backend

```bash
cd backend
npm run dev
```

### Build the frontend

```bash
cd frontend
npm run build
```

### Lint the frontend

```bash
cd frontend
npm run lint
```

## Environment Variables

Create a `.env` file in the backend folder.

Example:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/hrm_db"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

Create a `.env` file in the frontend folder if needed.

Example:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

> Update the variable names based on the actual configuration used in the project.

## API Overview

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `GET /api/auth/me`
- `PATCH /api/auth/change-password`

### Employees

- `GET /api/employees`
- `GET /api/employees/:id`
- `GET /api/employees/me`
- `POST /api/employees`
- `PATCH /api/employees/:id`
- `PATCH /api/employees/:id/status`

### Departments

- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PATCH /api/departments/:id`
- `PATCH /api/departments/:id/status`

### Attendance

- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/history`
- `GET /api/attendance`

### Leave Requests

- `GET /api/leave-requests`
- `GET /api/leave-requests/:id`
- `POST /api/leave-requests`
- `PATCH /api/leave-requests/:id/status`

### Dashboard

- `GET /api/dashboard/employee`

## Demo Accounts

> Add demo accounts here if you want recruiters to test the project.

```txt
Admin
Email: admin@example.com
Password: ********

Employee
Email: employee@example.com
Password: ********
```

If you do not want to publish demo credentials, you can use:

```txt
Demo accounts will be provided upon request.
```

## Project Status

The core features have been completed. The project is currently in the final QA, UI polish and portfolio preparation phase.

## Purpose

The goal of this project is to improve frontend development skills through a real-world HR management application, especially in:

- Building ReactJS and TypeScript applications
- Integrating REST APIs
- Managing server state with TanStack Query
- Handling forms and validation
- Organizing frontend architecture
- Building role-based dashboards
- Improving responsive UI and user experience

## Repository

Source code: https://github.com/datnguyen154/humanize-hr

## Author

Developed by Đạt.
