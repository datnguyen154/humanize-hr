# Authentication Module

## 1. Mục Tiêu Module

Authentication là module dùng để xác thực người dùng và kiểm soát quyền truy cập vào hệ thống HRM.

Module này trả lời các câu hỏi chính:

- Người dùng là ai?
- Người dùng đã đăng nhập chưa?
- Người dùng có quyền truy cập chức năng này không?
- Người dùng có thể tự đổi mật khẩu tài khoản của mình không?

---

## 2. Vai Trò Người Dùng

Hệ thống có 2 role chính:

### ADMIN

Admin có quyền:

- Đăng nhập hệ thống.
- Xem thông tin tài khoản hiện tại.
- Đổi mật khẩu của chính mình.
- Quản lý nhân viên.
- Quản lý phòng ban.
- Xem và duyệt đơn nghỉ phép.
- Xem dữ liệu chấm công.

### EMPLOYEE

Employee có quyền:

- Đăng nhập hệ thống.
- Xem thông tin tài khoản hiện tại.
- Đổi mật khẩu của chính mình.
- Xem hồ sơ cá nhân.
- Chấm công.
- Gửi đơn nghỉ phép.
- Xem lịch sử chấm công của bản thân.

---

## 3. Chức Năng Chính

Module Authentication bao gồm:

- Login.
- Logout.
- Refresh Token.
- Get Current User.
- Change Password.
- Protect Route bằng access token.
- Role-based Authorization.

---

## 4. Login Flow

Luồng đăng nhập:

1. Người dùng nhập email và password.
2. Frontend gửi request đến API login.
3. Backend kiểm tra email có tồn tại không.
4. Backend kiểm tra tài khoản có đang ACTIVE không.
5. Backend dùng bcrypt để so sánh password người dùng nhập với passwordHash trong database.
6. Nếu hợp lệ, backend tạo access token và refresh token.
7. Backend lưu refresh token vào database.
8. Frontend lưu thông tin đăng nhập.
9. Người dùng được chuyển vào màn hình phù hợp với role.

---

## 5. Access Token Và Refresh Token

### Access Token

Access token dùng để gọi các API cần đăng nhập.

Đặc điểm:

- Thời gian sống ngắn.
- Được gửi trong header `Authorization`.
- Format:

```http
Authorization: Bearer access_token
```

### Refresh Token

Refresh token dùng để xin access token mới khi access token cũ hết hạn.

Đặc điểm:

- Thời gian sống dài hơn access token.
- Được lưu trong database bảng `RefreshToken`.
- Không dùng trực tiếp để gọi các API nghiệp vụ.

---

## 6. Change Password Flow

Change Password cho phép user đã đăng nhập đổi mật khẩu của chính mình.

Luồng xử lý:

1. Người dùng đã đăng nhập.
2. Frontend gửi access token trong header.
3. Người dùng nhập `currentPassword`, `newPassword`, `confirmPassword`.
4. Backend lấy `userId` từ access token.
5. Backend tìm user theo `userId`.
6. Backend kiểm tra `currentPassword` có khớp với `passwordHash` hiện tại không.
7. Backend kiểm tra `newPassword` và `confirmPassword` có giống nhau không.
8. Backend kiểm tra `newPassword` đủ mạnh không.
9. Backend kiểm tra `newPassword` không được giống `currentPassword`.
10. Backend hash `newPassword` bằng bcrypt.
11. Backend cập nhật `passwordHash` mới vào bảng `User`.
12. Backend trả về message đổi mật khẩu thành công.

Ghi chú cho người mới backend:

- Backend không bao giờ lưu password dạng plain text.
- Database chỉ lưu `passwordHash`.
- Khi đổi mật khẩu, phải dùng `bcrypt.compare()` để kiểm tra mật khẩu cũ.
- Khi lưu mật khẩu mới, phải dùng `bcrypt.hash()`.

---

## 7. User Stories

### US-001: Login

Là một người dùng, tôi muốn đăng nhập vào hệ thống bằng email và password để sử dụng các chức năng phù hợp với quyền của mình.

Acceptance Criteria:

- Người dùng nhập email và password.
- Nếu email không tồn tại, hệ thống trả lỗi.
- Nếu password sai, hệ thống trả lỗi.
- Nếu tài khoản bị khóa, hệ thống không cho đăng nhập.
- Nếu đăng nhập thành công, hệ thống trả về access token, refresh token và thông tin user.

### US-002: Logout

Là một người dùng, tôi muốn đăng xuất khỏi hệ thống để bảo vệ tài khoản của mình.

Acceptance Criteria:

- Người dùng gửi refresh token cần logout.
- Backend xóa refresh token trong database.
- Refresh token đó không còn dùng được nữa.

### US-003: Get Current User

Là một người dùng đã đăng nhập, tôi muốn lấy thông tin tài khoản hiện tại để hiển thị tên và quyền của tôi.

Acceptance Criteria:

- Frontend gửi request kèm access token.
- Nếu token hợp lệ, backend trả về thông tin user.
- Nếu token thiếu, sai hoặc hết hạn, backend trả về 401.

### US-004: Refresh Token

Là một người dùng, tôi muốn lấy access token mới khi access token cũ hết hạn để không bị đăng xuất đột ngột.

Acceptance Criteria:

- Frontend gửi refresh token.
- Nếu refresh token hợp lệ và còn trong database, backend trả về access token mới.
- Nếu refresh token không hợp lệ hoặc hết hạn, backend trả về 401.

### US-005: Change Password

Là một người dùng đã đăng nhập, tôi muốn đổi mật khẩu của chính mình để bảo mật tài khoản.

Acceptance Criteria:

- User phải gửi access token hợp lệ.
- User phải nhập mật khẩu hiện tại.
- User phải nhập mật khẩu mới.
- User phải xác nhận lại mật khẩu mới.
- Nếu mật khẩu hiện tại sai, hệ thống trả lỗi.
- Nếu mật khẩu mới và xác nhận mật khẩu không khớp, hệ thống trả lỗi.
- Nếu mật khẩu mới quá yếu, hệ thống trả lỗi.
- Nếu mật khẩu mới giống mật khẩu hiện tại, hệ thống trả lỗi.
- Nếu hợp lệ, hệ thống cập nhật passwordHash mới.

---

## 8. API Contract

### 8.1 Login

Endpoint:

```http
POST /api/auth/login
```

Request Body:

```json
{
  "email": "admin@example.com",
  "password": "12345678"
}
```

Success Response:

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

### 8.2 Get Current User

Endpoint:

```http
GET /api/auth/me
```

Headers:

```http
Authorization: Bearer access_token
```

Success Response:

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

### 8.3 Refresh Token

Endpoint:

```http
POST /api/auth/refresh-token
```

Request Body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Success Response:

```json
{
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

### 8.4 Logout

Endpoint:

```http
POST /api/auth/logout
```

Request Body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Success Response:

```json
{
  "message": "Logout successful"
}
```

### 8.5 Change Password

Endpoint:

```http
PATCH /api/auth/change-password
```

Authentication:

- Requires Bearer Access Token.
- Bất kỳ user nào đã đăng nhập đều có thể đổi mật khẩu của chính mình.
- Không cần phân quyền ADMIN hay EMPLOYEE.

Headers:

```http
Authorization: Bearer access_token
```

Request Body:

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

Success Response:

```json
{
  "message": "Password changed successfully"
}
```

Validation Rules:

- `currentPassword` là bắt buộc.
- `newPassword` là bắt buộc.
- `confirmPassword` là bắt buộc.
- `currentPassword` phải khớp với mật khẩu hiện tại trong database.
- `newPassword` và `confirmPassword` phải giống nhau.
- `newPassword` phải đủ mạnh.
- `newPassword` không được giống `currentPassword`.

Gợi ý rule password mạnh cho MVP:

- Ít nhất 8 ký tự.
- Có ít nhất 1 chữ cái.
- Có ít nhất 1 số.
- Không chỉ toàn khoảng trắng.

Error Responses:

```json
{
  "message": "Unauthorized"
}
```

```json
{
  "message": "Current password is incorrect"
}
```

```json
{
  "message": "New password and confirm password do not match"
}
```

```json
{
  "message": "Password is too weak"
}
```

```json
{
  "message": "New password must be different from current password"
}
```

---

## 9. Database Design

### User Table

| Field        | Type     | Description |
| ------------ | -------- | ----------- |
| id           | UUID     | Khóa chính của user |
| email        | String   | Email đăng nhập, không được trùng |
| passwordHash | String   | Mật khẩu đã được hash bằng bcrypt |
| fullName     | String   | Họ tên người dùng |
| role         | Enum     | ADMIN hoặc EMPLOYEE |
| status       | Enum     | ACTIVE hoặc INACTIVE |
| createdAt    | DateTime | Ngày tạo |
| updatedAt    | DateTime | Ngày cập nhật |

Liên quan đến Change Password:

- Không cần tạo bảng mới.
- Chỉ cập nhật field `passwordHash` trong bảng `User`.
- Field `updatedAt` sẽ tự cập nhật khi passwordHash thay đổi.

### RefreshToken Table

| Field     | Type     | Description |
| --------- | -------- | ----------- |
| id        | UUID     | Khóa chính |
| userId    | UUID     | Liên kết với User |
| token     | String   | Refresh token |
| expiresAt | DateTime | Thời gian hết hạn |
| createdAt | DateTime | Ngày tạo |
| updatedAt | DateTime | Ngày cập nhật |

---

## 10. Error Cases

| Case | HTTP Status | Message |
| ---- | ----------- | ------- |
| Email không tồn tại | 401 | Invalid email or password |
| Password sai khi login | 401 | Invalid email or password |
| Thiếu access token | 401 | Unauthorized |
| Access token không hợp lệ | 401 | Unauthorized |
| Access token hết hạn | 401 | Unauthorized |
| User không đủ quyền | 403 | Forbidden |
| Tài khoản bị khóa | 403 | Account is inactive |
| Thiếu currentPassword | 400 | currentPassword is required |
| Thiếu newPassword | 400 | newPassword is required |
| Thiếu confirmPassword | 400 | confirmPassword is required |
| Mật khẩu hiện tại sai | 400 | Current password is incorrect |
| Mật khẩu mới và xác nhận không khớp | 400 | New password and confirm password do not match |
| Mật khẩu mới quá yếu | 400 | Password is too weak |
| Mật khẩu mới giống mật khẩu hiện tại | 400 | New password must be different from current password |

---

## 11. Implementation Order Cho Change Password

Khi bắt đầu code API Change Password, nên làm theo thứ tự:

1. Repository: thêm method tìm user theo id nếu chưa có, và method cập nhật `passwordHash`.
2. Service: validate request body.
3. Service: lấy user hiện tại từ `userId`.
4. Service: dùng bcrypt kiểm tra `currentPassword`.
5. Service: kiểm tra `newPassword` và `confirmPassword`.
6. Service: kiểm tra độ mạnh của password.
7. Service: hash mật khẩu mới.
8. Service: cập nhật `passwordHash`.
9. Controller: đọc body và gọi service.
10. Route: thêm `PATCH /api/auth/change-password` với middleware `authenticate`.
11. Test bằng Postman.

---

## 12. Ghi Chú Triển Khai

Ở giai đoạn MVP:

- Chưa cần forgot password.
- Chưa cần đăng ký tài khoản.
- Chưa cần gửi email xác nhận đổi mật khẩu.
- Chưa cần bắt logout toàn bộ thiết bị sau khi đổi mật khẩu.
- Có thể cân nhắc xóa refresh token cũ sau khi đổi mật khẩu ở phiên bản nâng cao.

