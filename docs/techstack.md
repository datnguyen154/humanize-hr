# Technical Stack

## 1. Mục Tiêu Chọn Công Nghệ

Dự án HR Management System được xây dựng với mục tiêu:

- Học quy trình phát triển Fullstack.
- Thực hành các kỹ năng Frontend thực tế.
- Hiểu cách Frontend và Backend giao tiếp với nhau.
- Xây dựng Portfolio phục vụ ứng tuyển Frontend Developer Intern.

Nguyên tắc lựa chọn:

- Công nghệ phổ biến.
- Dễ học.
- Có nhiều tài liệu.
- Phù hợp với người mới Backend.

---

# 2. Frontend Stack

## React

Vai trò:

- Xây dựng giao diện người dùng.

Lý do chọn:

- Công nghệ Frontend phổ biến nhất hiện nay.
- Nhu cầu tuyển dụng cao.
- Phù hợp với định hướng Frontend Developer.

---

## TypeScript

Vai trò:

- Bổ sung kiểu dữ liệu cho JavaScript.

Lý do chọn:

- Giảm lỗi khi phát triển.
- Dễ bảo trì dự án lớn.
- Được yêu cầu ở đa số dự án thực tế.

---

## Vite

Vai trò:

- Công cụ tạo và build dự án React.

Lý do chọn:

- Khởi tạo nhanh.
- Build nhanh.
- Được sử dụng rộng rãi.

---

## React Router

Vai trò:

- Điều hướng giữa các trang.

Ví dụ:

- Login
- Dashboard
- Employees
- Attendance
- Leave Requests

---

## Shadcn UI

Vai trò:

- Xây dựng giao diện.

Lý do chọn:

- Hiện đại.
- Dễ tùy chỉnh.
- Được sử dụng nhiều trong các dự án React.

---

## Tailwind CSS

Vai trò:

- Styling giao diện.

Lý do chọn:

- Viết CSS nhanh.
- Dễ responsive.
- Kết hợp tốt với Shadcn UI.

---

## React Hook Form

Vai trò:

- Quản lý form.

Ví dụ:

- Login Form
- Employee Form
- Leave Request Form

---

## Zod

Vai trò:

- Validate dữ liệu.

Ví dụ:

- Email hợp lệ.
- Password tối thiểu 8 ký tự.

---

## Axios

Vai trò:

- Gọi API.

Ví dụ:

- Login API.
- Employee API.
- Attendance API.

---

## TanStack Query

Vai trò:

- Quản lý dữ liệu từ API.

Lý do chọn:

- Tự động cache.
- Refetch dữ liệu.
- Quản lý loading và error tốt.

---

## Zustand

Vai trò:

- Global State Management.

Dùng cho:

- User Info.
- Access Token.
- Theme.

---

# 3. Backend Stack

## Node.js

Vai trò:

- Runtime chạy JavaScript phía server.

---

## Express.js

Vai trò:

- Xây dựng REST API.

Lý do chọn:

- Dễ học.
- Nhiều tài liệu.
- Phù hợp với người mới.

---

## JWT

Vai trò:

- Xác thực người dùng.

Dùng cho:

- Access Token.
- Refresh Token.

---

## Bcrypt

Vai trò:

- Mã hóa mật khẩu.

---

## Prisma ORM

Vai trò:

- Kết nối Database.

Lý do chọn:

- Dễ dùng hơn SQL thuần.
- Hỗ trợ TypeScript rất tốt.

---

# 4. Database

## PostgreSQL

Vai trò:

- Lưu trữ dữ liệu hệ thống.

Lý do chọn:

- Miễn phí.
- Phổ biến.
- Được sử dụng nhiều trong doanh nghiệp.

---

# 5. Authentication Strategy

Sử dụng:

- JWT Access Token
- JWT Refresh Token

Luồng:

1. User Login
2. Server tạo Access Token
3. Server tạo Refresh Token
4. Frontend lưu trạng thái đăng nhập
5. Hết hạn Access Token sẽ dùng Refresh Token để lấy token mới

---

# 6. Project Architecture

Frontend:

Feature-Sliced Design (FSD)

Backend:

Layered Architecture

- Controllers
- Services
- Repositories
- Database

---

# 7. Deployment

Frontend:

- Vercel

Backend:

- Render

Database:

- PostgreSQL

---

# 8. Development Tools

## Git

Quản lý source code.

## GitHub

Lưu trữ source code.

## VS Code

Môi trường phát triển.

## Postman

Kiểm thử API.

---

# 9. Version 1 Scope

Các module sẽ được triển khai:

- Authentication
- Employee Management
- Department Management
- Attendance Management
- Leave Request Management
- Dashboard

Các tính năng nâng cao sẽ được phát triển ở phiên bản tiếp theo.
