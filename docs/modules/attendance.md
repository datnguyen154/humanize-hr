# Attendance Management Module

## 1. Mục Tiêu Module

Attendance Management là module quản lý việc chấm công hằng ngày trong hệ thống HRM.

Trong phạm vi MVP, module hỗ trợ:

- Employee check in khi bắt đầu ngày làm việc.
- Employee check out khi kết thúc ngày làm việc.
- Employee xem lịch sử chấm công của chính mình.
- Admin xem toàn bộ bản ghi chấm công.
- Admin tìm kiếm, lọc, phân trang và sắp xếp dữ liệu chấm công.

Module giúp hệ thống ghi nhận thời gian vào làm, thời gian ra về và xác định nhân viên đi làm đúng giờ hay đi muộn.

---

## 2. Actors

## 2.1 EMPLOYEE

Employee là nhân viên đã có tài khoản đăng nhập và được liên kết với một Employee profile.

Employee có quyền:

- Check in cho chính mình.
- Check out cho chính mình.
- Xem lịch sử chấm công của chính mình.
- Không được chấm công thay người khác.
- Không được xem lịch sử chấm công của nhân viên khác.

## 2.2 ADMIN

Admin là người quản lý hệ thống hoặc quản lý nhân sự.

Admin có quyền:

- Xem toàn bộ bản ghi chấm công.
- Tìm kiếm theo tên hoặc mã nhân viên.
- Lọc theo trạng thái.
- Lọc theo nhân viên.
- Lọc theo khoảng ngày.
- Phân trang và sắp xếp danh sách.

Trong MVP, Admin không check in hoặc check out thay Employee.

---

## 3. Business Rules

- Tất cả Attendance API đều yêu cầu Bearer Access Token.
- User phải được liên kết với Employee profile mới có thể check in hoặc check out.
- Backend xác định Employee từ `req.user.userId`, không nhận `employeeId` từ request body khi check in/out.
- Một Employee chỉ được check in một lần trong một ngày.
- Employee phải check in trước khi check out.
- Một Employee chỉ được check out một lần trong một ngày.
- Check in sau `08:00:00` có status `LATE`.
- Check in tại hoặc trước `08:00:00` có status `PRESENT`.
- Status được backend tự động tính, client không được tự gửi status.
- Employee chỉ xem được lịch sử của chính mình.
- Admin xem được toàn bộ bản ghi chấm công.
- Nếu không tìm thấy dữ liệu phù hợp, API danh sách trả `data: []`.
- API danh sách luôn trả `meta` để frontend xử lý pagination.
- `page` mặc định là `1`.
- `limit` mặc định là `10` và nên giới hạn tối đa là `100`.
- `sortOrder` chỉ nhận `asc` hoặc `desc`.

### Quy Ước Ngày Giờ

- Hệ thống phải có timezone công ty được cấu hình rõ ràng, ví dụ `Asia/Bangkok`.
- `attendanceDate` là ngày làm việc theo timezone công ty, không phải ngày UTC một cách máy móc.
- Mốc `08:00` cũng được tính theo timezone công ty.
- Database nên lưu `checkInTime` và `checkOutTime` dưới dạng DateTime chuẩn.
- API nên trả thời gian theo định dạng ISO 8601.

Việc thống nhất timezone giúp tránh trường hợp một lần check in gần nửa đêm bị ghi nhận sang sai ngày.

---

## 4. User Stories

## US-ATT-001: Employee Check In

Là Employee, tôi muốn check in khi bắt đầu làm việc để hệ thống ghi nhận thời gian đến công ty.

### Acceptance Criteria

- Employee phải đăng nhập.
- User phải có Employee profile.
- Employee chưa check in trong ngày hiện tại.
- Backend tự ghi nhận `attendanceDate` và `checkInTime`.
- Backend tự tính status `PRESENT` hoặc `LATE`.
- Check in thành công trả về bản ghi attendance vừa tạo.
- Check in lần thứ hai trong cùng ngày trả về lỗi.

---

## US-ATT-002: Employee Check Out

Là Employee, tôi muốn check out khi kết thúc làm việc để hệ thống ghi nhận thời gian ra về.

### Acceptance Criteria

- Employee phải đăng nhập.
- User phải có Employee profile.
- Employee phải check in trong ngày trước đó.
- Bản ghi hiện tại chưa có `checkOutTime`.
- Backend tự ghi nhận thời gian check out.
- Check out lần thứ hai trong cùng ngày trả về lỗi.

---

## US-ATT-003: Employee Xem Lịch Sử Chấm Công

Là Employee, tôi muốn xem lịch sử chấm công của mình để kiểm tra thời gian làm việc.

### Acceptance Criteria

- Employee phải đăng nhập.
- Employee chỉ nhận dữ liệu của chính mình.
- API hỗ trợ pagination.
- API hỗ trợ lọc theo status và khoảng ngày.
- API hỗ trợ sắp xếp.
- Response có `data` và `meta`.

---

## US-ATT-004: Admin Xem Toàn Bộ Chấm Công

Là Admin, tôi muốn xem toàn bộ bản ghi chấm công để theo dõi tình hình đi làm của nhân viên.

### Acceptance Criteria

- Chỉ Admin được gọi API danh sách toàn bộ.
- Admin có thể tìm theo `employee.fullName` hoặc `employee.employeeCode`.
- Admin có thể lọc theo `status`.
- Admin có thể lọc theo `employeeId`.
- Admin có thể lọc theo khoảng ngày.
- API hỗ trợ pagination và sort.
- Response có `data` và `meta`.

---

## 5. API Contracts

## 5.1 Check In

### Endpoint

```http
POST /api/attendance/check-in
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `EMPLOYEE` được check in cho chính mình.

### Request Body

Không cần request body. Backend lấy `userId` từ access token và tự xác định thời gian hiện tại.

### Success Response

```json
{
    "data": {
        "id": "70faf657-66b4-4b29-a313-64584a769f3b",
        "employeeId": "e91b3e53-071d-47fe-aea0-ac6a7b9efa58",
        "attendanceDate": "2026-06-19T00:00:00.000Z",
        "checkInTime": "2026-06-19T00:55:00.000Z",
        "checkOutTime": null,
        "status": "PRESENT",
        "createdAt": "2026-06-19T00:55:00.000Z",
        "updatedAt": "2026-06-19T00:55:00.000Z"
    }
}
```

### Error Responses

| Case                          | Status | Message                    |
| ----------------------------- | ------ | -------------------------- |
| Không có token hợp lệ         | 401    | Unauthorized               |
| User không phải Employee      | 403    | Forbidden                  |
| User chưa có Employee profile | 404    | Employee profile not found |
| Đã check in trong ngày        | 409    | Already checked in today   |

---

## 5.2 Check Out

### Endpoint

```http
POST /api/attendance/check-out
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `EMPLOYEE` được check out cho chính mình.

### Request Body

Không cần request body.

### Success Response

```json
{
    "data": {
        "id": "70faf657-66b4-4b29-a313-64584a769f3b",
        "employeeId": "e91b3e53-071d-47fe-aea0-ac6a7b9efa58",
        "attendanceDate": "2026-06-19T00:00:00.000Z",
        "checkInTime": "2026-06-19T00:55:00.000Z",
        "checkOutTime": "2026-06-19T09:15:00.000Z",
        "status": "PRESENT",
        "createdAt": "2026-06-19T00:55:00.000Z",
        "updatedAt": "2026-06-19T09:15:00.000Z"
    }
}
```

### Error Responses

| Case                          | Status | Message                            |
| ----------------------------- | ------ | ---------------------------------- |
| Không có token hợp lệ         | 401    | Unauthorized                       |
| User không phải Employee      | 403    | Forbidden                          |
| User chưa có Employee profile | 404    | Employee profile not found         |
| Chưa check in trong ngày      | 400    | Check in required before check out |
| Đã check out trong ngày       | 409    | Already checked out today          |

---

## 5.3 Get Own Attendance History

### Endpoint

```http
GET /api/attendance/history
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `EMPLOYEE` xem lịch sử của chính mình. Backend tự xác định Employee từ access token.

### Query Params

| Param       | Type   | Required | Description                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| `page`      | Number | No       | Trang hiện tại, mặc định `1`                    |
| `limit`     | Number | No       | Số bản ghi mỗi trang, mặc định `10`             |
| `status`    | Enum   | No       | Lọc theo `PRESENT` hoặc `LATE`                  |
| `fromDate`  | Date   | No       | Ngày bắt đầu, định dạng `YYYY-MM-DD`            |
| `toDate`    | Date   | No       | Ngày kết thúc, định dạng `YYYY-MM-DD`           |
| `sortBy`    | String | No       | `attendanceDate`, `checkInTime`, `checkOutTime` |
| `sortOrder` | String | No       | `asc` hoặc `desc`                               |

### Example Request

```http
GET /api/attendance/history?page=1&limit=10&status=LATE&fromDate=2026-06-01&toDate=2026-06-30&sortBy=attendanceDate&sortOrder=desc
```

### Success Response

```json
{
    "data": [
        {
            "id": "70faf657-66b4-4b29-a313-64584a769f3b",
            "employeeId": "e91b3e53-071d-47fe-aea0-ac6a7b9efa58",
            "attendanceDate": "2026-06-19T00:00:00.000Z",
            "checkInTime": "2026-06-19T01:15:00.000Z",
            "checkOutTime": "2026-06-19T09:10:00.000Z",
            "status": "LATE",
            "createdAt": "2026-06-19T01:15:00.000Z",
            "updatedAt": "2026-06-19T09:10:00.000Z"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
    }
}
```

---

## 5.4 Get All Attendance Records

### Endpoint

```http
GET /api/attendance
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được truy cập.

### Query Params

| Param        | Type   | Required | Description                                                  |
| ------------ | ------ | -------- | ------------------------------------------------------------ |
| `page`       | Number | No       | Trang hiện tại, mặc định `1`                                 |
| `limit`      | Number | No       | Số bản ghi mỗi trang, mặc định `10`                          |
| `search`     | String | No       | Tìm theo tên hoặc mã nhân viên                               |
| `status`     | Enum   | No       | Lọc theo `PRESENT` hoặc `LATE`                               |
| `employeeId` | UUID   | No       | Lọc theo nhân viên                                           |
| `fromDate`   | Date   | No       | Ngày bắt đầu, định dạng `YYYY-MM-DD`                         |
| `toDate`     | Date   | No       | Ngày kết thúc, định dạng `YYYY-MM-DD`                        |
| `sortBy`     | String | No       | `attendanceDate`, `checkInTime`, `checkOutTime`, `createdAt` |
| `sortOrder`  | String | No       | `asc` hoặc `desc`                                            |

### Example Request

```http
GET /api/attendance?page=1&limit=10&search=EMP001&status=PRESENT&fromDate=2026-06-01&toDate=2026-06-30&sortBy=attendanceDate&sortOrder=desc
```

### Success Response

```json
{
    "data": [
        {
            "id": "70faf657-66b4-4b29-a313-64584a769f3b",
            "employeeId": "e91b3e53-071d-47fe-aea0-ac6a7b9efa58",
            "employee": {
                "id": "e91b3e53-071d-47fe-aea0-ac6a7b9efa58",
                "employeeCode": "EMP001",
                "fullName": "Nguyen Van An"
            },
            "attendanceDate": "2026-06-19T00:00:00.000Z",
            "checkInTime": "2026-06-19T00:55:00.000Z",
            "checkOutTime": "2026-06-19T09:15:00.000Z",
            "status": "PRESENT",
            "createdAt": "2026-06-19T00:55:00.000Z",
            "updatedAt": "2026-06-19T09:15:00.000Z"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
    }
}
```

### Empty Response

```json
{
    "data": [],
    "meta": {
        "page": 1,
        "limit": 10,
        "totalItems": 0,
        "totalPages": 0,
        "hasNextPage": false,
        "hasPreviousPage": false
    }
}
```

---

## 6. Database Fields

## Attendance Table

| Field            | Type     | Required | Description                            |
| ---------------- | -------- | -------- | -------------------------------------- |
| `id`             | UUID     | Yes      | Khóa chính của bản ghi chấm công       |
| `employeeId`     | UUID     | Yes      | Nhân viên sở hữu bản ghi               |
| `attendanceDate` | DateTime | Yes      | Ngày làm việc theo timezone công ty    |
| `checkInTime`    | DateTime | Yes      | Thời điểm check in                     |
| `checkOutTime`   | DateTime | No       | Thời điểm check out, ban đầu là `null` |
| `status`         | Enum     | Yes      | `PRESENT` hoặc `LATE`                  |
| `createdAt`      | DateTime | Yes      | Thời điểm tạo bản ghi                  |
| `updatedAt`      | DateTime | Yes      | Thời điểm cập nhật gần nhất            |

### AttendanceStatus Enum

- `PRESENT`: Check in tại hoặc trước 08:00 theo timezone công ty.
- `LATE`: Check in sau 08:00 theo timezone công ty.

### Relationships

- Một Employee có nhiều Attendance record.
- Một Attendance record thuộc về đúng một Employee.
- `employeeId` là foreign key tham chiếu tới `Employee.id`.

### Constraints Và Indexes Đề Xuất

- Unique constraint trên `[employeeId, attendanceDate]` để ngăn check in hai lần trong cùng ngày.
- Index trên `[attendanceDate]` để lọc và sort theo ngày.
- Index trên `[status, attendanceDate]` để lọc trạng thái theo thời gian.
- Index trên `[employeeId, attendanceDate]` để lấy lịch sử của một Employee.
- Có thể thêm index cho `checkInTime` nếu API thường xuyên sort theo thời gian check in.

Unique constraint là lớp bảo vệ ở database. Service vẫn cần kiểm tra trước để trả thông báo lỗi dễ hiểu.

---

## 7. Error Cases

| Case                          | HTTP Status | Message                                 |
| ----------------------------- | ----------- | --------------------------------------- |
| Không gửi access token        | 401         | Unauthorized                            |
| Token sai hoặc hết hạn        | 401         | Unauthorized                            |
| Role không được phép          | 403         | Forbidden                               |
| User chưa có Employee profile | 404         | Employee profile not found              |
| Đã check in trong ngày        | 409         | Already checked in today                |
| Check out trước khi check in  | 400         | Check in required before check out      |
| Đã check out trong ngày       | 409         | Already checked out today               |
| `page` không hợp lệ           | 400         | Invalid page                            |
| `limit` không hợp lệ          | 400         | Invalid limit                           |
| `status` không hợp lệ         | 400         | Invalid status                          |
| `employeeId` không đúng UUID  | 400         | Invalid employeeId                      |
| `fromDate` không hợp lệ       | 400         | Invalid fromDate                        |
| `toDate` không hợp lệ         | 400         | Invalid toDate                          |
| `fromDate` sau `toDate`       | 400         | fromDate must be before or equal toDate |
| `sortBy` không hợp lệ         | 400         | Invalid sortBy                          |
| `sortOrder` không hợp lệ      | 400         | Invalid sortOrder                       |
| Database hoặc server lỗi      | 500         | Internal server error                   |

---

## 8. Implementation Order

Nên triển khai module theo thứ tự sau:

1. Cập nhật Prisma schema:
    - Tạo enum `AttendanceStatus`.
    - Tạo model `Attendance`.
    - Thêm relation `Employee -> Attendance[]`.
    - Thêm unique constraint `[employeeId, attendanceDate]`.
    - Thêm các index phục vụ filter và sort.

2. Tạo migration và chạy Prisma generate.

3. Tạo sample attendance seed nếu cần test danh sách.

4. Tạo repository layer:
    - Tìm attendance theo Employee và ngày.
    - Tạo bản ghi check in.
    - Cập nhật check out.
    - Lấy danh sách và tổng số bản ghi với cùng điều kiện filter.

5. Tạo service layer:
    - Tìm Employee bằng `userId`.
    - Xác định ngày hiện tại theo timezone công ty.
    - Tính status theo mốc 08:00.
    - Kiểm tra duplicate check in/check out.
    - Validate pagination, filter, date range và sort.
    - Dùng `Promise.all` cho dữ liệu phân trang và total count.

6. Tạo controller layer:
    - Đọc `req.user.userId`.
    - Đọc query params.
    - Gọi service và trả response.
    - Handle service error và unexpected error.

7. Tạo routes:
    - Check in/out và history: `authenticate`, `requireRole("EMPLOYEE")`.
    - Admin list: `authenticate`, `requireRole("ADMIN")`.

8. Mount routes dưới `/api/attendance`.

9. Test bằng Postman:
    - Employee check in lần đầu.
    - Employee check in lần hai trong cùng ngày.
    - Employee check out trước khi check in.
    - Employee check out thành công và thử check out lần hai.
    - Employee xem lịch sử của mình.
    - Admin xem, tìm kiếm và lọc toàn bộ dữ liệu.

---

## 9. Ghi Chú Cho Người Mới Backend

Không nhận `employeeId`, thời gian hoặc status từ client khi check in/out. Các giá trị này phải được backend xác định từ access token và đồng hồ hệ thống.

Luồng check in cơ bản:

1. Lấy `userId` từ access token.
2. Tìm Employee profile liên kết với user.
3. Tính `attendanceDate` theo timezone công ty.
4. Kiểm tra Employee đã check in trong ngày chưa.
5. So sánh thời gian hiện tại với 08:00.
6. Tạo Attendance record.

Luồng check out cơ bản:

1. Lấy Employee profile từ user đăng nhập.
2. Tìm Attendance record của ngày hiện tại.
3. Kiểm tra đã check in chưa.
4. Kiểm tra `checkOutTime` còn `null`.
5. Cập nhật `checkOutTime` bằng thời gian hiện tại.
