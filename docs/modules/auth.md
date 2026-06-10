# Authentication Module

## 1. Mục Tiêu Module

Authentication là module dùng để xác thực người dùng và kiểm soát quyền truy cập vào hệ thống HRM.

Module này trả lời các câu hỏi:

- Người dùng là ai?
- Người dùng đã đăng nhập chưa?
- Người dùng có quyền truy cập chức năng này không?

---

# 2. Vai Trò Người Dùng

Hệ thống có 2 role chính:

## Admin

Có quyền:

- Truy cập Dashboard.
- Quản lý nhân viên.
- Quản lý phòng ban.
- Xem và duyệt đơn nghỉ phép.
- Xem dữ liệu chấm công.

## Employee

Có quyền:

- Xem hồ sơ cá nhân.
- Chấm công.
- Gửi đơn nghỉ phép.
- Xem lịch sử chấm công của bản thân.

---

# 3. Chức Năng Chính

Module Authentication bao gồm:

- Login.
- Logout.
- Refresh Token.
- Get Current User.
- Protect Route.
- Role-based Authorization.

---

# 4. Login Flow

Luồng đăng nhập:

1. Người dùng nhập email và password.
2. Frontend gửi request đến API login.
3. Backend kiểm tra email có tồn tại không.
4. Backend kiểm tra password có đúng không.
5. Nếu hợp lệ, backend tạo access token và refresh token.
6. Frontend lưu thông tin đăng nhập.
7. Người dùng được chuyển vào Dashboard.

---

# 5. Access Token và Refresh Token

## Access Token

Dùng để truy cập API cần đăng nhập.

Đặc điểm:

- Thời gian sống ngắn.
- Ví dụ: 15 phút.
- Được gửi kèm mỗi request.

## Refresh Token

Dùng để xin access token mới khi access token hết hạn.

Đặc điểm:

- Thời gian sống dài hơn.
- Ví dụ: 7 ngày.
- Không dùng trực tiếp để gọi API nghiệp vụ.

---

# 6. User Stories

## US-001: Login

Là một người dùng, tôi muốn đăng nhập vào hệ thống bằng email và password để có thể sử dụng các chức năng phù hợp với quyền của mình.

### Acceptance Criteria

- Người dùng nhập email và password.
- Nếu email không tồn tại, hệ thống trả về lỗi.
- Nếu password sai, hệ thống trả về lỗi.
- Nếu tài khoản bị khóa, hệ thống không cho đăng nhập.
- Nếu đăng nhập thành công, hệ thống trả về access token, refresh token và thông tin user.
- Sau khi đăng nhập thành công, Frontend chuyển user đến Dashboard.

---

## US-002: Logout

Là một người dùng, tôi muốn đăng xuất khỏi hệ thống để bảo vệ tài khoản của mình.

### Acceptance Criteria

- Người dùng bấm nút logout.
- Frontend xóa trạng thái đăng nhập.
- Refresh token không còn được sử dụng.
- Người dùng được chuyển về trang Login.

---

## US-003: Get Current User

Là một người dùng đã đăng nhập, tôi muốn hệ thống lấy thông tin tài khoản hiện tại để hiển thị tên, avatar và quyền của tôi.

### Acceptance Criteria

- Frontend gửi request kèm access token.
- Nếu token hợp lệ, backend trả về thông tin user.
- Nếu token không hợp lệ hoặc hết hạn, backend trả về lỗi 401.

---

## US-004: Refresh Token

Là một người dùng, tôi muốn hệ thống tự động lấy access token mới khi access token cũ hết hạn để không bị đăng xuất đột ngột.

### Acceptance Criteria

- Khi access token hết hạn, frontend gọi API refresh token.
- Nếu refresh token hợp lệ, backend trả về access token mới.
- Nếu refresh token không hợp lệ, user bị đăng xuất.

---

# 7. API Contract

## 7.1 Login

### Endpoint

```http
POST /api/auth/login
```

### Request Body

```json
{
    "email": "admin@example.com",
    "password": "12345678"
}
```

### Success Response

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

### Error Response

```json
{
    "message": "Invalid email or password"
}
```

---

## 7.2 Get Current User

### Endpoint

```http
GET /api/auth/me
```

### Headers

```http
Authorization: Bearer access_token
```

### Success Response

```json
{
    "data": {
        "id": "user_id",
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "ADMIN"
    }
}
```

---

## 7.3 Refresh Token

### Endpoint

```http
POST /api/auth/refresh-token
```

### Request Body

```json
{
    "refreshToken": "jwt_refresh_token"
}
```

### Success Response

```json
{
    "data": {
        "accessToken": "new_jwt_access_token"
    }
}
```

---

## 7.4 Logout

### Endpoint

```http
POST /api/auth/logout
```

### Request Body

```json
{
    "refreshToken": "jwt_refresh_token"
}
```

### Success Response

```json
{
    "message": "Logout successful"
}
```

---

# 8. Database Design

## User Table

| Field        | Type     | Description          |
| ------------ | -------- | -------------------- |
| id           | UUID     | Khóa chính           |
| email        | String   | Email đăng nhập      |
| passwordHash | String   | Mật khẩu đã mã hóa   |
| fullName     | String   | Họ tên người dùng    |
| role         | Enum     | ADMIN hoặc EMPLOYEE  |
| status       | Enum     | ACTIVE hoặc INACTIVE |
| createdAt    | DateTime | Ngày tạo             |
| updatedAt    | DateTime | Ngày cập nhật        |

---

## RefreshToken Table

| Field     | Type     | Description       |
| --------- | -------- | ----------------- |
| id        | UUID     | Khóa chính        |
| userId    | UUID     | Liên kết với User |
| token     | String   | Refresh token     |
| expiresAt | DateTime | Thời gian hết hạn |
| createdAt | DateTime | Ngày tạo          |

---

# 9. Error Cases

| Case                | HTTP Status | Message                   |
| ------------------- | ----------- | ------------------------- |
| Email không tồn tại | 401         | Invalid email or password |
| Password sai        | 401         | Invalid email or password |
| Token không hợp lệ  | 401         | Unauthorized              |
| Token hết hạn       | 401         | Token expired             |
| User không đủ quyền | 403         | Forbidden                 |
| Tài khoản bị khóa   | 403         | Account is inactive       |

---

# 10. Frontend Pages

## Login Page

Route:

```text
/login
```

Chức năng:

- Nhập email.
- Nhập password.
- Validate form.
- Hiển thị lỗi đăng nhập.
- Gọi API login.
- Redirect sau khi login thành công.

---

## Protected Routes

Các route cần đăng nhập:

```text
/dashboard
/employees
/departments
/attendance
/leave-requests
```

Nếu user chưa đăng nhập, chuyển về:

```text
/login
```

---

# 11. Ghi Chú Triển Khai

Ở giai đoạn MVP:

- Chỉ cần login bằng email và password.
- Chưa cần forgot password.
- Chưa cần đăng ký tài khoản.
- Tài khoản user sẽ được Admin tạo trong module Employee Management.
- Access token có thể lưu trong memory hoặc Zustand.
- Refresh token nên lưu an toàn hơn, có thể dùng HTTP-only cookie ở phiên bản nâng cao.

---

# 12. Phạm Vi Không Làm Ở MVP

Không làm trong phiên bản đầu:

- Register.
- Forgot Password.
- Login bằng Google.
- Two-factor Authentication.
- Email Verification.
