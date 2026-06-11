# Authentication Implementation Plan

## 1. Mục tiêu module Auth

Module Authentication giúp hệ thống HRM xác định người dùng là ai, đã đăng nhập hay chưa, và có quyền truy cập chức năng nào.

Trong MVP, module Auth cần hoàn thành các mục tiêu sau:

- Người dùng có thể đăng nhập bằng email và password.
- Backend kiểm tra email, password và trạng thái tài khoản.
- Backend tạo `accessToken` và `refreshToken` sau khi đăng nhập thành công.
- Frontend lưu trạng thái đăng nhập và thông tin user.
- Người dùng có thể gọi các API cần đăng nhập bằng `accessToken`.
- Khi `accessToken` hết hạn, frontend có thể dùng `refreshToken` để lấy token mới.
- Người dùng có thể đăng xuất.
- Hệ thống phân quyền theo 2 role: `ADMIN` và `EMPLOYEE`.

Phạm vi chưa làm trong MVP:

- Không làm đăng ký tài khoản.
- Không làm quên mật khẩu.
- Không làm đăng nhập Google.
- Không làm xác thực 2 bước.
- Không làm email verification.

## 2. Các bước setup backend

Backend dùng Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT và Bcrypt.

Các bước setup đề xuất:

1. Khởi tạo project backend với TypeScript.
2. Cài các thư viện chính:
   - `express` để tạo REST API.
   - `cors` để frontend gọi được API.
   - `dotenv` để đọc biến môi trường.
   - `jsonwebtoken` để tạo và kiểm tra JWT.
   - `bcrypt` để hash và so sánh password.
   - `prisma` và `@prisma/client` để làm việc với PostgreSQL.
3. Cài các thư viện dev:
   - `typescript`
   - `ts-node-dev` hoặc công cụ tương đương để chạy dev server.
   - type definitions cho Node, Express, JWT nếu cần.
4. Tạo cấu trúc backend theo Layered Architecture:
   - `routes`: khai báo endpoint.
   - `controllers`: nhận request, trả response.
   - `services`: xử lý nghiệp vụ.
   - `repositories`: truy vấn database qua Prisma.
   - `middlewares`: xác thực token, phân quyền, xử lý lỗi.
   - `utils`: helper tạo token, hash password.
5. Tạo file `.env` cho backend với các biến:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ACCESS_TOKEN_EXPIRES_IN`
   - `REFRESH_TOKEN_EXPIRES_IN`
   - `PORT`
6. Kết nối Prisma với PostgreSQL.
7. Tạo Prisma schema cho bảng `User` và `RefreshToken`.
8. Chạy migration để tạo database tables.
9. Tạo seed data ban đầu:
   - 1 tài khoản Admin.
   - 1 tài khoản Employee mẫu.
10. Test API bằng Postman trước khi nối frontend.

## 3. Các bước setup frontend

Frontend dùng React, TypeScript, Vite, React Router, Shadcn UI, Tailwind CSS, React Hook Form, Zod, Axios, TanStack Query và Zustand.

Các bước setup đề xuất:

1. Khởi tạo project frontend bằng Vite React TypeScript.
2. Cài React Router để quản lý route.
3. Cài Tailwind CSS và Shadcn UI để xây UI.
4. Cài React Hook Form và Zod để validate form login.
5. Cài Axios để gọi API.
6. Cài TanStack Query để quản lý request, loading và error.
7. Cài Zustand để lưu trạng thái auth:
   - `user`
   - `accessToken`
   - trạng thái `isAuthenticated`
8. Tạo Axios instance dùng chung:
   - Cấu hình `baseURL`.
   - Tự động gắn `Authorization: Bearer accessToken`.
   - Xử lý lỗi `401` để gọi refresh token nếu cần.
9. Tạo routing cơ bản:
   - `/login`
   - `/dashboard`
   - các route cần bảo vệ sau này như `/employees`, `/departments`, `/attendance`, `/leave-requests`.
10. Tạo `ProtectedRoute` để chặn người chưa đăng nhập.
11. Tạo `RoleRoute` hoặc logic tương đương để chặn user không đủ quyền.

## 4. Database tables cần tạo

### User

Bảng `User` lưu thông tin tài khoản đăng nhập.

| Field | Type | Ghi chú |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `email` | String | Email đăng nhập, cần unique |
| `passwordHash` | String | Mật khẩu đã hash bằng bcrypt |
| `fullName` | String | Họ tên người dùng |
| `role` | Enum | `ADMIN` hoặc `EMPLOYEE` |
| `status` | Enum | `ACTIVE` hoặc `INACTIVE` |
| `createdAt` | DateTime | Ngày tạo |
| `updatedAt` | DateTime | Ngày cập nhật |

Gợi ý enum:

- `Role`: `ADMIN`, `EMPLOYEE`
- `UserStatus`: `ACTIVE`, `INACTIVE`

### RefreshToken

Bảng `RefreshToken` lưu refresh token còn hiệu lực.

| Field | Type | Ghi chú |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `userId` | UUID | Liên kết với bảng `User` |
| `token` | String | Refresh token |
| `expiresAt` | DateTime | Thời gian hết hạn |
| `createdAt` | DateTime | Ngày tạo |

Quan hệ:

- Một `User` có thể có nhiều `RefreshToken`.
- Mỗi `RefreshToken` thuộc về một `User`.

Ghi chú cho người mới backend:

- Không lưu password thật trong database.
- Chỉ lưu `passwordHash`.
- Khi user nhập password, dùng bcrypt để so sánh password nhập vào với `passwordHash`.
- Có thể xóa refresh token khi logout để token đó không dùng lại được nữa.

## 5. API cần implement

### POST `/api/auth/login`

Dùng để đăng nhập.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "12345678"
}
```

Backend xử lý:

1. Kiểm tra email và password có được gửi lên không.
2. Tìm user theo email.
3. Nếu không tìm thấy user, trả `401`.
4. Nếu user có `status` là `INACTIVE`, trả `403`.
5. So sánh password bằng bcrypt.
6. Nếu password sai, trả `401`.
7. Tạo `accessToken`.
8. Tạo `refreshToken`.
9. Lưu refresh token vào database.
10. Trả về token và thông tin user.

Response thành công:

```json
{
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

### GET `/api/auth/me`

Dùng để lấy thông tin user hiện tại.

Header:

```http
Authorization: Bearer access_token
```

Backend xử lý:

1. Đọc access token từ header.
2. Verify token.
3. Lấy `userId` từ payload token.
4. Tìm user trong database.
5. Nếu user không tồn tại hoặc inactive, trả lỗi.
6. Trả thông tin user.

### POST `/api/auth/refresh-token`

Dùng để lấy access token mới khi access token cũ hết hạn.

Request body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Backend xử lý:

1. Kiểm tra refresh token có được gửi lên không.
2. Verify refresh token bằng `JWT_REFRESH_SECRET`.
3. Kiểm tra token có tồn tại trong bảng `RefreshToken` không.
4. Kiểm tra token đã hết hạn chưa.
5. Kiểm tra user còn active không.
6. Tạo access token mới.
7. Trả access token mới cho frontend.

### POST `/api/auth/logout`

Dùng để đăng xuất.

Request body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Backend xử lý:

1. Nhận refresh token từ frontend.
2. Xóa refresh token khỏi database.
3. Trả message logout thành công.

### Middleware cần có

`authenticate`:

- Kiểm tra request có access token không.
- Verify access token.
- Gắn thông tin user vào request để controller sau đó dùng.
- Nếu token sai hoặc hết hạn, trả `401`.

`authorizeRoles`:

- Nhận danh sách role được phép truy cập.
- Kiểm tra role của user hiện tại.
- Nếu không đủ quyền, trả `403`.

Ví dụ sử dụng sau này:

- Dashboard admin: chỉ `ADMIN`.
- Hồ sơ cá nhân: `ADMIN` và `EMPLOYEE`.
- Quản lý nhân viên: chỉ `ADMIN`.

## 6. Frontend pages/components cần làm

### Pages

`LoginPage`

- Route: `/login`
- Có form nhập email và password.
- Validate email đúng định dạng.
- Validate password không được để trống.
- Hiển thị loading khi đang đăng nhập.
- Hiển thị lỗi khi email/password sai.
- Redirect sang `/dashboard` khi đăng nhập thành công.

`DashboardPage`

- Route: `/dashboard`
- Chưa cần làm dashboard đầy đủ trong bước Auth.
- Chỉ cần là trang sau đăng nhập để kiểm tra flow.

### Components

`LoginForm`

- Dùng React Hook Form.
- Dùng Zod để validate.
- Gọi mutation login.

`ProtectedRoute`

- Nếu chưa đăng nhập, chuyển về `/login`.
- Nếu đã đăng nhập, cho vào route con.

`RoleRoute`

- Nếu user không có role phù hợp, hiển thị trang forbidden hoặc chuyển hướng.

`LogoutButton`

- Gọi API logout.
- Xóa auth state ở frontend.
- Chuyển user về `/login`.

### State và API layer

`authStore`

- Lưu `user`.
- Lưu `accessToken`.
- Có action `setAuth`.
- Có action `clearAuth`.

`authApi`

- `login`
- `logout`
- `getCurrentUser`
- `refreshToken`

`axiosInstance`

- Gắn access token vào request.
- Có thể xử lý refresh token khi gặp lỗi `401`.

## 7. Thứ tự code từng bước

Nên làm theo thứ tự dưới đây để tránh bị rối.

### Giai đoạn 1: Backend nền tảng

1. Setup project backend TypeScript + Express.
2. Setup Prisma + PostgreSQL.
3. Tạo model `User`, `RefreshToken`, enum `Role`, enum `UserStatus`.
4. Chạy migration.
5. Tạo seed user Admin và Employee.
6. Tạo cấu trúc folder backend theo `routes`, `controllers`, `services`, `repositories`, `middlewares`, `utils`.

### Giai đoạn 2: Backend Auth API

1. Viết helper hash password bằng bcrypt.
2. Viết helper tạo access token và refresh token.
3. Viết repository tìm user theo email.
4. Viết repository lưu refresh token.
5. Implement API login.
6. Test login bằng Postman.
7. Viết middleware `authenticate`.
8. Implement API `/api/auth/me`.
9. Test `/me` bằng Postman với access token.
10. Implement API refresh token.
11. Test refresh token bằng Postman.
12. Implement API logout.
13. Test logout bằng Postman.
14. Viết middleware phân quyền role.
15. Test route mẫu chỉ cho `ADMIN` truy cập.

### Giai đoạn 3: Frontend Auth cơ bản

1. Setup frontend React + Vite + TypeScript.
2. Setup Tailwind CSS và Shadcn UI.
3. Setup React Router.
4. Tạo route `/login` và `/dashboard`.
5. Tạo Login Page.
6. Tạo Login Form với React Hook Form và Zod.
7. Tạo Axios instance.
8. Tạo `authApi.login`.
9. Tạo Zustand auth store.
10. Khi login thành công, lưu user và access token.
11. Redirect sang `/dashboard`.

### Giai đoạn 4: Bảo vệ route và logout

1. Tạo `ProtectedRoute`.
2. Bọc `/dashboard` bằng `ProtectedRoute`.
3. Nếu chưa login mà vào `/dashboard`, redirect về `/login`.
4. Tạo `LogoutButton`.
5. Gọi API logout khi bấm logout.
6. Xóa auth state.
7. Redirect về `/login`.

### Giai đoạn 5: Refresh token

1. Quyết định nơi lưu refresh token trong MVP.
2. Với bản học tập, có thể lưu tạm trong localStorage hoặc Zustand persist.
3. Với bản nâng cao, chuyển sang HTTP-only cookie.
4. Thêm logic gọi `/api/auth/refresh-token` khi access token hết hạn.
5. Nếu refresh thành công, cập nhật access token mới.
6. Nếu refresh thất bại, logout user.

### Giai đoạn 6: Role-based authorization

1. Backend tạo middleware `authorizeRoles`.
2. Frontend tạo logic kiểm tra role.
3. Route quản trị như `/employees`, `/departments` chỉ cho `ADMIN`.
4. Route cá nhân như `/attendance` cho cả `ADMIN` và `EMPLOYEE` tùy nghiệp vụ.
5. Test bằng cả tài khoản Admin và Employee.

## 8. Checklist hoàn thành

### Backend

- [ ] Có bảng `User`.
- [ ] Có bảng `RefreshToken`.
- [ ] Có enum `Role`.
- [ ] Có enum `UserStatus`.
- [ ] Password được hash bằng bcrypt.
- [ ] Có seed tài khoản Admin.
- [ ] Có seed tài khoản Employee.
- [ ] API login hoạt động.
- [ ] API `/api/auth/me` hoạt động.
- [ ] API refresh token hoạt động.
- [ ] API logout hoạt động.
- [ ] Middleware authenticate hoạt động.
- [ ] Middleware authorize role hoạt động.
- [ ] Token sai trả `401`.
- [ ] User không đủ quyền trả `403`.
- [ ] Tài khoản inactive không đăng nhập được.

### Frontend

- [ ] Có trang `/login`.
- [ ] Login form validate được email và password.
- [ ] Login form hiển thị loading.
- [ ] Login form hiển thị lỗi khi đăng nhập thất bại.
- [ ] Login thành công chuyển sang `/dashboard`.
- [ ] Auth state lưu được user và access token.
- [ ] Request API tự gắn `Authorization` header.
- [ ] Protected route chặn user chưa đăng nhập.
- [ ] Logout xóa auth state.
- [ ] Logout chuyển về `/login`.
- [ ] Refresh token lấy được access token mới.
- [ ] Refresh token fail thì user bị logout.
- [ ] Role route chặn user không đủ quyền.

### Kiểm thử thủ công

- [ ] Đăng nhập bằng email không tồn tại.
- [ ] Đăng nhập bằng password sai.
- [ ] Đăng nhập bằng tài khoản inactive.
- [ ] Đăng nhập bằng tài khoản Admin.
- [ ] Đăng nhập bằng tài khoản Employee.
- [ ] Gọi `/api/auth/me` không có token.
- [ ] Gọi `/api/auth/me` với token sai.
- [ ] Gọi `/api/auth/me` với token đúng.
- [ ] Logout xong không dùng lại refresh token được.
- [ ] Employee không truy cập được route chỉ dành cho Admin.

## 9. Các lỗi người mới dễ gặp

### Lưu password thật vào database

Không bao giờ lưu password dạng plain text. Luôn dùng bcrypt để hash password trước khi lưu.

### Nhầm access token và refresh token

Access token dùng để gọi API nghiệp vụ. Refresh token chỉ dùng để xin access token mới.

Không nên dùng refresh token để gọi các API như employees, attendance hoặc leave requests.

### Quên gắn Bearer vào Authorization header

Header đúng là:

```http
Authorization: Bearer access_token
```

Nếu thiếu chữ `Bearer`, backend thường sẽ không đọc được token.

### Dùng cùng secret cho access token và refresh token

Nên dùng 2 secret khác nhau:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Cách này giúp tách rõ mục đích của từng loại token.

### Không xử lý user inactive

Nếu tài khoản bị khóa nhưng vẫn đăng nhập được thì phân quyền chưa đủ chặt.

Login, refresh token và `/me` đều nên kiểm tra trạng thái user.

### Trả lỗi quá chi tiết khi login sai

Không nên trả:

- `Email does not exist`
- `Password is wrong`

Nên trả chung:

- `Invalid email or password`

Cách này an toàn hơn vì không tiết lộ email nào đang tồn tại trong hệ thống.

### Quên xóa refresh token khi logout

Nếu logout chỉ xóa state ở frontend mà không xóa refresh token ở backend, token cũ vẫn có thể được dùng lại.

### Lưu token không nhất quán ở frontend

Nếu access token lưu ở Zustand nhưng refresh token lưu ở nơi khác, cần thống nhất rõ flow.

Với MVP học tập:

- Có thể lưu access token trong Zustand.
- Có thể lưu refresh token tạm trong localStorage hoặc Zustand persist.

Với bản nâng cao:

- Nên dùng HTTP-only cookie cho refresh token.

### Quên xử lý CORS

Frontend và backend thường chạy khác port, ví dụ:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Nếu backend không bật CORS, frontend sẽ bị lỗi khi gọi API.

### Quên validate dữ liệu đầu vào

Backend vẫn phải validate request body, kể cả frontend đã validate.

Frontend validate giúp UX tốt hơn. Backend validate giúp hệ thống an toàn hơn.

### Không test API bằng Postman trước khi làm frontend

Nên test backend trước bằng Postman. Khi API đã chạy đúng, việc nối frontend sẽ dễ debug hơn nhiều.

### Không thống nhất format response

Nên thống nhất response từ đầu, ví dụ:

```json
{
  "message": "Login successful",
  "data": {}
}
```

Khi frontend biết format cố định, việc đọc dữ liệu và hiển thị lỗi sẽ đơn giản hơn.

### Role trong token bị cũ

Nếu role của user thay đổi trong database nhưng access token cũ vẫn còn role cũ, user có thể giữ quyền cũ cho đến khi token hết hạn.

Với MVP, chấp nhận access token sống ngắn, ví dụ 15 phút. Với hệ thống nâng cao, có thể kiểm tra role mới nhất từ database ở middleware.
