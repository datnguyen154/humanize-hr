# Employee Dashboard Module

## 1. Mục Tiêu Module

Employee Dashboard là module cung cấp một API tổng hợp cho màn hình dashboard của nhân viên.

Mục tiêu chính:

- Frontend chỉ cần gọi một endpoint duy nhất.
- Backend tự tổng hợp dữ liệu từ Employee, Attendance và LeaveRequest.
- Nhân viên có thể xem nhanh tình trạng chấm công, thống kê đi làm, nghỉ phép và hoạt động gần đây.

Endpoint chính:

```http
GET /api/dashboard/employee
```

---

## 2. Đối Tượng Sử Dụng

Module này dành cho:

- EMPLOYEE đã đăng nhập.

Không dành cho:

- ADMIN.
- User chưa đăng nhập.
- User chưa có Employee profile liên kết.

---

## 3. User Stories

### US-001: Xem dashboard cá nhân

Là một nhân viên, tôi muốn xem dashboard cá nhân để biết hôm nay tôi đã check-in/check-out chưa, tháng này đi làm thế nào và tình trạng nghỉ phép ra sao.

Acceptance Criteria:

- Nhân viên đăng nhập thành công.
- Frontend gọi một API duy nhất.
- Backend trả về đủ dữ liệu cho dashboard.
- Nhân viên chỉ xem dữ liệu của chính mình.

### US-002: Xem tình trạng chấm công hôm nay

Là một nhân viên, tôi muốn biết hôm nay mình đã check-in chưa, có đi muộn không và đã check-out chưa.

Acceptance Criteria:

- Nếu đã check-in, API trả về `status` và `checkInTime`.
- Nếu đã check-out, API trả thêm `checkOutTime`.
- Nếu chưa check-in, các field có thể là `null`.

### US-003: Xem tổng quan nghỉ phép

Là một nhân viên, tôi muốn biết số đơn nghỉ phép đang chờ duyệt, số ngày nghỉ phép năm đã dùng và số ngày còn lại.

Acceptance Criteria:

- Annual leave quota mặc định là 12 ngày/năm.
- Chỉ tính used annual leave từ các đơn `ANNUAL` có status `APPROVED`.
- Remaining annual leave = 12 - used annual leave.

---

## 4. Business Rules

- API yêu cầu Bearer Access Token.
- Chỉ role `EMPLOYEE` được gọi API này.
- Employee được xác định từ `userId` trong access token.
- Không nhận `employeeId` từ request body hoặc query.
- Nếu user chưa có Employee profile, trả về 404.
- Backend tổng hợp dữ liệu từ:
  - `Employee`
  - `Attendance`
  - `LeaveRequest`
- Frontend chỉ gọi một endpoint, không cần gọi thêm API khác để dựng dashboard.
- Attendance summary chỉ tính trong tháng hiện tại.
- Leave summary tính theo năm hiện tại.
- Annual leave quota MVP là 12 ngày/năm.
- Recent activities chỉ lấy 5 hoạt động gần nhất.

---

## 5. Dashboard Sections

### 5.1 Today's Attendance

Dữ liệu chấm công của ngày hiện tại.

Fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| status | PRESENT \| LATE \| null | Trạng thái chấm công hôm nay |
| checkInTime | DateTime \| null | Thời gian check-in |
| checkOutTime | DateTime \| null | Thời gian check-out |

Nếu nhân viên chưa check-in hôm nay:

```json
{
  "status": null,
  "checkInTime": null,
  "checkOutTime": null
}
```

### 5.2 Attendance Summary

Thống kê chấm công trong tháng hiện tại.

Fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| present | number | Số ngày đi làm đúng giờ trong tháng |
| late | number | Số ngày đi muộn trong tháng |

Quy tắc:

- `present` đếm các attendance có status `PRESENT`.
- `late` đếm các attendance có status `LATE`.
- Chỉ tính từ ngày đầu tháng đến ngày cuối tháng hiện tại.

### 5.3 Leave Summary

Thống kê nghỉ phép của năm hiện tại.

Fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| pendingLeaveRequests | number | Số đơn nghỉ phép đang chờ duyệt |
| usedAnnualLeave | number | Số ngày phép năm đã dùng |
| remainingAnnualLeave | number | Số ngày phép năm còn lại |

Quy tắc:

- `pendingLeaveRequests`: đếm đơn có status `PENDING`.
- `usedAnnualLeave`: tổng số ngày của đơn `ANNUAL` đã `APPROVED`.
- `remainingAnnualLeave`: `12 - usedAnnualLeave`.
- Nếu dùng quá 12 ngày, MVP có thể trả số âm hoặc giới hạn về 0 tùy service quyết định. Khuyến nghị giới hạn về 0 để frontend dễ hiển thị.

### 5.4 Recent Activities

Danh sách 5 hoạt động gần nhất của nhân viên.

Supported activity types:

- `CHECK_IN`
- `CHECK_OUT`
- `LEAVE_REQUEST_CREATED`
- `LEAVE_REQUEST_APPROVED`
- `LEAVE_REQUEST_REJECTED`

Fields:

| Field | Type | Description |
| ----- | ---- | ----------- |
| type | string | Loại hoạt động |
| message | string | Nội dung hiển thị ngắn gọn |
| createdAt | DateTime | Thời điểm xảy ra hoạt động |

---

## 6. Activity Type Descriptions

| Activity Type | Ý nghĩa | Ví dụ message |
| ------------- | ------- | ------------- |
| CHECK_IN | Nhân viên check-in trong ngày | You checked in at 08:00 |
| CHECK_OUT | Nhân viên check-out trong ngày | You checked out at 17:30 |
| LEAVE_REQUEST_CREATED | Nhân viên tạo đơn nghỉ phép | Leave request created |
| LEAVE_REQUEST_APPROVED | Đơn nghỉ phép được duyệt | Leave request approved |
| LEAVE_REQUEST_REJECTED | Đơn nghỉ phép bị từ chối | Leave request rejected |

Ghi chú:

- Activity có thể được build từ dữ liệu có sẵn trong `Attendance` và `LeaveRequest`.
- MVP chưa cần tạo bảng Activity riêng.
- Sau này nếu hệ thống lớn hơn, có thể tạo bảng `ActivityLog`.

---

## 7. API Contract

### Endpoint

```http
GET /api/dashboard/employee
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

- Chỉ `EMPLOYEE`.
- Dùng middleware:
  - `authenticate`
  - `requireRole("EMPLOYEE")`

### Query Params

Không cần query params cho MVP.

Frontend chỉ gọi:

```http
GET /api/dashboard/employee
```

---

## 8. Sample Success Response

```json
{
  "data": {
    "todayAttendance": {
      "status": "PRESENT",
      "checkInTime": "2026-06-25T01:00:00.000Z",
      "checkOutTime": "2026-06-25T10:30:00.000Z"
    },
    "attendanceSummary": {
      "present": 18,
      "late": 2
    },
    "leaveSummary": {
      "pendingLeaveRequests": 1,
      "usedAnnualLeave": 4,
      "remainingAnnualLeave": 8
    },
    "recentActivities": [
      {
        "type": "CHECK_OUT",
        "message": "You checked out at 17:30",
        "createdAt": "2026-06-25T10:30:00.000Z"
      },
      {
        "type": "CHECK_IN",
        "message": "You checked in at 08:00",
        "createdAt": "2026-06-25T01:00:00.000Z"
      },
      {
        "type": "LEAVE_REQUEST_APPROVED",
        "message": "Leave request approved",
        "createdAt": "2026-06-20T03:15:00.000Z"
      },
      {
        "type": "LEAVE_REQUEST_CREATED",
        "message": "Leave request created",
        "createdAt": "2026-06-18T02:20:00.000Z"
      },
      {
        "type": "LEAVE_REQUEST_REJECTED",
        "message": "Leave request rejected",
        "createdAt": "2026-06-10T04:45:00.000Z"
      }
    ]
  }
}
```

Ghi chú về thời gian:

- Backend trả về DateTime dạng ISO string.
- Frontend tự format theo timezone và UI mong muốn.

---

## 9. Error Responses

### 401 Unauthorized

Khi thiếu token, token sai hoặc token hết hạn.

```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden

Khi user không phải role `EMPLOYEE`.

```json
{
  "message": "Forbidden"
}
```

### 404 Employee Profile Not Found

Khi user đã đăng nhập nhưng chưa được liên kết với Employee profile.

```json
{
  "message": "Employee profile not found"
}
```

### 500 Internal Server Error

Khi có lỗi ngoài dự kiến ở server.

```json
{
  "message": "Internal server error"
}
```

---

## 10. Data Mapping Gợi Ý

### Employee

Dùng để xác định nhân viên hiện tại:

- Lấy `userId` từ access token.
- Tìm `Employee` theo `userId`.
- Dùng `employee.id` để query attendance và leave request.

### Attendance

Dùng cho:

- Today's attendance.
- Attendance summary current month.
- Recent activities loại `CHECK_IN` và `CHECK_OUT`.

### LeaveRequest

Dùng cho:

- Pending leave requests.
- Used annual leave.
- Remaining annual leave.
- Recent activities loại leave request.

---

## 11. Implementation Order

Nên implement theo thứ tự sau:

1. Tạo `docs/modules/dashboard.md`.
2. Tạo Dashboard Repository Layer.
3. Repository: tìm Employee theo `userId`.
4. Repository: lấy attendance hôm nay.
5. Repository: đếm attendance `PRESENT` và `LATE` trong tháng hiện tại.
6. Repository: đếm leave request `PENDING`.
7. Repository: lấy các leave request `ANNUAL` đã `APPROVED` trong năm hiện tại.
8. Repository: lấy dữ liệu cần thiết để build recent activities.
9. Tạo Dashboard Service Layer.
10. Service: derive employee từ authenticated user.
11. Service: tính toán attendance summary.
12. Service: tính toán leave summary.
13. Service: build recent activities và lấy 5 item mới nhất.
14. Tạo Dashboard Controller.
15. Tạo Dashboard Routes.
16. Mount route trong `app.ts` dưới `/api/dashboard`.
17. Test bằng Postman với EMPLOYEE token.

---

## 12. Postman Test Gợi Ý

### Request

```http
GET http://localhost:5000/api/dashboard/employee
Authorization: Bearer employee_access_token
```

### Expected Result

- EMPLOYEE token hợp lệ: trả về `200 OK`.
- ADMIN token: trả về `403 Forbidden`.
- Không gửi token: trả về `401 Unauthorized`.
- EMPLOYEE chưa có profile: trả về `404 Employee profile not found`.

---

## 13. Phạm Vi Không Làm Trong MVP

MVP chưa cần:

- Dashboard cho Admin.
- Biểu đồ nâng cao.
- Cache dashboard.
- Bảng ActivityLog riêng.
- Notification realtime.
- WebSocket.
- Tùy chỉnh annual leave quota theo từng nhân viên.

