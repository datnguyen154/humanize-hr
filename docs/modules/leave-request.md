# Leave Request Management Module

## 1. Mục Tiêu Module

Leave Request Management là module dùng để quản lý đơn xin nghỉ phép trong hệ thống HRM.

Trong phạm vi MVP, module này tập trung vào các chức năng chính:

- Nhân viên tạo đơn xin nghỉ phép.
- Nhân viên xem danh sách đơn nghỉ phép của chính mình.
- Admin xem toàn bộ đơn nghỉ phép trong hệ thống.
- Admin xem chi tiết một đơn nghỉ phép.
- Admin duyệt hoặc từ chối đơn nghỉ phép.

Mục tiêu của module là giúp quy trình xin nghỉ phép rõ ràng hơn: nhân viên gửi yêu cầu, Admin xem xét, sau đó cập nhật trạng thái `APPROVED` hoặc `REJECTED`.

---

## 2. Actors

## 2.1 ADMIN

Admin là người quản lý hệ thống hoặc quản lý nhân sự.

Trong MVP Leave Request, Admin có quyền:

- Xem tất cả đơn nghỉ phép.
- Tìm kiếm đơn nghỉ phép theo nhân viên.
- Lọc đơn nghỉ phép theo trạng thái.
- Lọc đơn nghỉ phép theo `employeeId`.
- Xem chi tiết từng đơn nghỉ phép.
- Duyệt đơn nghỉ phép.
- Từ chối đơn nghỉ phép.

## 2.2 EMPLOYEE

Employee là nhân viên sử dụng hệ thống.

Trong MVP Leave Request, Employee có quyền:

- Tạo đơn xin nghỉ phép.
- Xem các đơn nghỉ phép của chính mình.
- Không được xem đơn nghỉ phép của nhân viên khác.
- Không được duyệt hoặc từ chối đơn nghỉ phép.

---

## 3. Business Rules

Các rule nghiệp vụ cần tuân thủ:

- Tất cả API Leave Request đều yêu cầu Bearer Access Token.
- `ADMIN` có thể xem toàn bộ đơn nghỉ phép.
- `EMPLOYEE` chỉ được xem đơn nghỉ phép của chính mình.
- `EMPLOYEE` được tạo đơn nghỉ phép.
- `ADMIN` được duyệt hoặc từ chối đơn nghỉ phép.
- `EMPLOYEE` không được duyệt hoặc từ chối đơn nghỉ phép.
- Trong MVP, API tạo đơn nghỉ phép tạm thời nhận `employeeId` trong request body.
- `leaveType` chỉ nhận: `ANNUAL`, `SICK`, `UNPAID`, `OTHER`.
- `status` khi tạo mới mặc định là `PENDING`.
- `startDate` phải nhỏ hơn hoặc bằng `endDate`.
- `reason` là bắt buộc.
- Chỉ đơn có trạng thái `PENDING` nên được duyệt hoặc từ chối.
- Khi Admin duyệt hoặc từ chối, cần lưu `reviewedByUserId`, `reviewedAt`, `reviewNote`.
- `PATCH /api/leave-requests/:id/status` chỉ cho phép status mới là `APPROVED` hoặc `REJECTED`.
- `reviewNote` là optional.
- Không nên xóa cứng đơn nghỉ phép trong MVP.
- Nếu không tìm thấy đơn nghỉ phép phù hợp, API list vẫn trả về `data: []`.

---

## 4. User Stories

## US-LEAVE-001: Employee Tạo Đơn Nghỉ Phép

Là Employee, tôi muốn tạo đơn xin nghỉ phép để gửi yêu cầu nghỉ cho Admin xét duyệt.

### Acceptance Criteria

- Employee đã đăng nhập có thể tạo đơn nghỉ phép.
- Request body cần có `employeeId`, `leaveType`, `startDate`, `endDate`, `reason`.
- `status` mặc định là `PENDING`.
- `startDate` phải nhỏ hơn hoặc bằng `endDate`.
- Nếu tạo thành công, API trả về đơn nghỉ phép vừa tạo.

---

## US-LEAVE-002: Employee Xem Đơn Nghỉ Phép Của Mình

Là Employee, tôi muốn xem danh sách đơn nghỉ phép của mình để biết trạng thái xử lý.

### Acceptance Criteria

- Employee chỉ xem được đơn nghỉ phép của chính mình.
- Employee không xem được đơn nghỉ phép của người khác.
- API hỗ trợ pagination.
- API hỗ trợ lọc theo `status`.
- API trả về `data` và `meta`.

---

## US-LEAVE-003: Admin Xem Tất Cả Đơn Nghỉ Phép

Là Admin, tôi muốn xem tất cả đơn nghỉ phép để quản lý và xử lý yêu cầu nghỉ của nhân viên.

### Acceptance Criteria

- Admin xem được toàn bộ đơn nghỉ phép.
- API hỗ trợ pagination.
- API hỗ trợ search theo `employee.fullName` hoặc `employee.employeeCode`.
- API hỗ trợ filter theo `status`.
- API hỗ trợ filter theo `employeeId`.
- API hỗ trợ sort theo `createdAt`, `startDate`, `endDate`.

---

## US-LEAVE-004: Xem Chi Tiết Đơn Nghỉ Phép

Là Admin hoặc Employee, tôi muốn xem chi tiết một đơn nghỉ phép để biết đầy đủ thông tin.

### Acceptance Criteria

- Admin xem được chi tiết mọi đơn nghỉ phép.
- Employee chỉ xem được chi tiết đơn của chính mình.
- Nếu đơn không tồn tại, API trả về `404`.
- Nếu Employee cố xem đơn của người khác, API trả về `403`.

---

## US-LEAVE-005: Admin Duyệt Hoặc Từ Chối Đơn Nghỉ Phép

Là Admin, tôi muốn duyệt hoặc từ chối đơn nghỉ phép để hoàn tất quy trình xử lý.

### Acceptance Criteria

- Chỉ Admin được phép cập nhật trạng thái đơn nghỉ phép.
- Status mới chỉ được là `APPROVED` hoặc `REJECTED`.
- Employee không được gọi API duyệt/từ chối.
- Khi cập nhật trạng thái, lưu người review vào `reviewedByUserId`.
- Khi cập nhật trạng thái, lưu thời điểm review vào `reviewedAt`.
- `reviewNote` có thể có hoặc không.
- Cập nhật thành công trả về đơn nghỉ phép đã được cập nhật.

---

## 5. API Contracts

## 5.1 Get Leave Request List

### Endpoint

```http
GET /api/leave-requests
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

- `ADMIN`: xem tất cả đơn nghỉ phép.
- `EMPLOYEE`: chỉ xem đơn nghỉ phép của chính mình.

### Query Params

| Param        | Type   | Required | Description                                   |
| ------------ | ------ | -------- | --------------------------------------------- |
| `page`       | Number | No       | Trang hiện tại, mặc định là `1`               |
| `limit`      | Number | No       | Số item mỗi trang, mặc định là `10`           |
| `search`     | String | No       | Tìm theo tên nhân viên hoặc mã nhân viên      |
| `status`     | Enum   | No       | Lọc theo `PENDING`, `APPROVED`, `REJECTED`    |
| `employeeId` | UUID   | No       | Lọc theo nhân viên                            |
| `sortBy`     | String | No       | Cho phép: `createdAt`, `startDate`, `endDate` |
| `sortOrder`  | String | No       | Cho phép: `asc`, `desc`                       |

### Example Request

```http
GET /api/leave-requests?page=1&limit=10&status=PENDING&sortBy=createdAt&sortOrder=desc
```

### Success Response

```json
{
    "data": [
        {
            "id": "0db3a7ab-06d4-46c3-8d6a-ef94c8a6ad33",
            "employeeId": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
            "employee": {
                "id": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
                "employeeCode": "EMP001",
                "fullName": "Nguyen Van An"
            },
            "leaveType": "ANNUAL",
            "startDate": "2026-07-01T00:00:00.000Z",
            "endDate": "2026-07-03T00:00:00.000Z",
            "reason": "Nghỉ phép gia đình",
            "status": "PENDING",
            "reviewedByUserId": null,
            "reviewedAt": null,
            "reviewNote": null,
            "createdAt": "2026-06-17T08:00:00.000Z",
            "updatedAt": "2026-06-17T08:00:00.000Z"
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

## 5.2 Get Leave Request Detail

### Endpoint

```http
GET /api/leave-requests/:id
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

- `ADMIN`: xem được mọi đơn.
- `EMPLOYEE`: chỉ xem được đơn của chính mình.

### Success Response

```json
{
    "data": {
        "id": "0db3a7ab-06d4-46c3-8d6a-ef94c8a6ad33",
        "employeeId": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
        "employee": {
            "id": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
            "employeeCode": "EMP001",
            "fullName": "Nguyen Van An"
        },
        "leaveType": "ANNUAL",
        "startDate": "2026-07-01T00:00:00.000Z",
        "endDate": "2026-07-03T00:00:00.000Z",
        "reason": "Nghỉ phép gia đình",
        "status": "PENDING",
        "reviewedByUserId": null,
        "reviewedAt": null,
        "reviewNote": null,
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T08:00:00.000Z"
    }
}
```

### Not Found Response

```json
{
    "message": "Leave request not found"
}
```

---

## 5.3 Create Leave Request

### Endpoint

```http
POST /api/leave-requests
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

`EMPLOYEE` được tạo đơn nghỉ phép.

Trong MVP, request body tạm thời nhận `employeeId`. Ở giai đoạn sau, backend nên lấy employee từ access token thay vì tin hoàn toàn vào body.

### Request Body

```json
{
    "employeeId": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
    "leaveType": "ANNUAL",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-03T00:00:00.000Z",
    "reason": "Nghỉ phép gia đình"
}
```

### Success Response

```json
{
    "data": {
        "id": "0db3a7ab-06d4-46c3-8d6a-ef94c8a6ad33",
        "employeeId": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
        "leaveType": "ANNUAL",
        "startDate": "2026-07-01T00:00:00.000Z",
        "endDate": "2026-07-03T00:00:00.000Z",
        "reason": "Nghỉ phép gia đình",
        "status": "PENDING",
        "reviewedByUserId": null,
        "reviewedAt": null,
        "reviewNote": null,
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T08:00:00.000Z"
    }
}
```

### Error Responses

| Case                      | Status | Message                                   |
| ------------------------- | ------ | ----------------------------------------- |
| `employeeId` bị thiếu     | 400    | employeeId is required                    |
| Employee không tồn tại    | 404    | Employee not found                        |
| `leaveType` không hợp lệ  | 400    | Invalid leaveType                         |
| `startDate` không hợp lệ  | 400    | Invalid startDate                         |
| `endDate` không hợp lệ    | 400    | Invalid endDate                           |
| `startDate` sau `endDate` | 400    | startDate must be before or equal endDate |
| `reason` bị thiếu         | 400    | reason is required                        |

---

## 5.4 Update Leave Request Status

### Endpoint

```http
PATCH /api/leave-requests/:id/status
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép gọi API này.

### Request Body

```json
{
    "status": "APPROVED",
    "reviewNote": "Đã kiểm tra lịch làm việc, đồng ý duyệt."
}
```

### Success Response

```json
{
    "data": {
        "id": "0db3a7ab-06d4-46c3-8d6a-ef94c8a6ad33",
        "employeeId": "f60b995c-6a80-4f27-9cc7-8e63dbf104a2",
        "leaveType": "ANNUAL",
        "startDate": "2026-07-01T00:00:00.000Z",
        "endDate": "2026-07-03T00:00:00.000Z",
        "reason": "Nghỉ phép gia đình",
        "status": "APPROVED",
        "reviewedByUserId": "admin-user-id",
        "reviewedAt": "2026-06-17T09:00:00.000Z",
        "reviewNote": "Đã kiểm tra lịch làm việc, đồng ý duyệt.",
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T09:00:00.000Z"
    }
}
```

### Error Responses

| Case                        | Status | Message                                 |
| --------------------------- | ------ | --------------------------------------- |
| Không gửi token             | 401    | Unauthorized                            |
| User không phải Admin       | 403    | Forbidden                               |
| Leave request không tồn tại | 404    | Leave request not found                 |
| `status` là `PENDING`       | 400    | status must be APPROVED or REJECTED     |
| `status` không hợp lệ       | 400    | status must be APPROVED or REJECTED     |
| Đơn đã được xử lý trước đó  | 400    | Leave request has already been reviewed |

---

## 6. Database Fields

## LeaveRequest Table

| Field              | Type     | Required | Description                                         |
| ------------------ | -------- | -------- | --------------------------------------------------- |
| `id`               | UUID     | Yes      | Khóa chính của đơn nghỉ phép                        |
| `employeeId`       | UUID     | Yes      | Nhân viên tạo đơn nghỉ phép                         |
| `leaveType`        | Enum     | Yes      | Loại nghỉ phép: `ANNUAL`, `SICK`, `UNPAID`, `OTHER` |
| `startDate`        | DateTime | Yes      | Ngày bắt đầu nghỉ                                   |
| `endDate`          | DateTime | Yes      | Ngày kết thúc nghỉ                                  |
| `reason`           | String   | Yes      | Lý do xin nghỉ                                      |
| `status`           | Enum     | Yes      | Trạng thái đơn: `PENDING`, `APPROVED`, `REJECTED`   |
| `reviewedByUserId` | UUID     | No       | User Admin đã duyệt hoặc từ chối                    |
| `reviewedAt`       | DateTime | No       | Thời điểm duyệt hoặc từ chối                        |
| `reviewNote`       | String   | No       | Ghi chú của Admin khi duyệt hoặc từ chối            |
| `createdAt`        | DateTime | Yes      | Thời điểm tạo đơn                                   |
| `updatedAt`        | DateTime | Yes      | Thời điểm cập nhật đơn gần nhất                     |

### LeaveType Enum

- `ANNUAL`: Nghỉ phép năm.
- `SICK`: Nghỉ bệnh.
- `UNPAID`: Nghỉ không lương.
- `OTHER`: Lý do khác.

### LeaveRequestStatus Enum

- `PENDING`: Đơn mới tạo, đang chờ duyệt.
- `APPROVED`: Đơn đã được Admin duyệt.
- `REJECTED`: Đơn đã bị Admin từ chối.

### Relationships

`LeaveRequest` liên kết với `Employee`:

- Một Employee có thể có nhiều LeaveRequest.
- Một LeaveRequest thuộc về một Employee.

`LeaveRequest` có thể liên kết với `User` qua `reviewedByUserId`:

- `reviewedByUserId` lưu id của Admin đã duyệt hoặc từ chối.
- Field này nullable vì đơn mới tạo chưa có người review.

---

## 7. Error Cases

| Case                                                      | HTTP Status | Message                                   |
| --------------------------------------------------------- | ----------- | ----------------------------------------- |
| Không gửi access token                                    | 401         | Unauthorized                              |
| Access token sai hoặc hết hạn                             | 401         | Unauthorized                              |
| Không có quyền xem đơn                                    | 403         | Forbidden                                 |
| Employee không được approve/reject                        | 403         | Forbidden                                 |
| Leave request không tồn tại                               | 404         | Leave request not found                   |
| Employee không tồn tại                                    | 404         | Employee not found                        |
| `employeeId` không hợp lệ                                 | 400         | Invalid employeeId                        |
| `leaveType` không hợp lệ                                  | 400         | Invalid leaveType                         |
| `status` không hợp lệ khi filter                          | 400         | Invalid status                            |
| `status` khi review không phải `APPROVED` hoặc `REJECTED` | 400         | status must be APPROVED or REJECTED       |
| `startDate` không hợp lệ                                  | 400         | Invalid startDate                         |
| `endDate` không hợp lệ                                    | 400         | Invalid endDate                           |
| `startDate` sau `endDate`                                 | 400         | startDate must be before or equal endDate |
| `reason` bị thiếu                                         | 400         | reason is required                        |
| `page` không hợp lệ                                       | 400         | Invalid page                              |
| `limit` không hợp lệ                                      | 400         | Invalid limit                             |
| `sortBy` không hợp lệ                                     | 400         | Invalid sortBy                            |
| `sortOrder` không hợp lệ                                  | 400         | Invalid sortOrder                         |
| Server hoặc database lỗi                                  | 500         | Internal server error                     |
| Invalid leaveRequestId                                    | 400         | Bad Request                               |

---

## 8. Implementation Order

Nên triển khai module Leave Request theo thứ tự sau:

1. Cập nhật Prisma schema:
    - Thêm enum `LeaveType`.
    - Thêm enum `LeaveRequestStatus`.
    - Thêm model `LeaveRequest`.
    - Thêm relation `Employee -> LeaveRequest`.
    - Thêm relation optional từ `LeaveRequest.reviewedByUserId` tới `User`.

2. Tạo migration và chạy Prisma generate.

3. Tạo repository layer:
    - `findLeaveRequests(params)`.
    - `countLeaveRequests(params)`.
    - `findLeaveRequestById(id)`.
    - `createLeaveRequest(data)`.
    - `updateLeaveRequestStatus(id, data)`.

4. Tạo service layer:
    - Validate pagination.
    - Validate `employeeId`.
    - Validate `leaveType`.
    - Validate `startDate` và `endDate`.
    - Validate `reason`.
    - Kiểm tra Employee tồn tại.
    - Kiểm tra quyền xem đơn theo role.
    - Kiểm tra Admin-only khi approve/reject.

5. Tạo controller layer:
    - Đọc query params.
    - Đọc request body.
    - Gọi service.
    - Handle service error và unexpected error.

6. Tạo routes:
    - `GET /`
    - `GET /:id`
    - `POST /`
    - `PATCH /:id/status`

7. Register routes vào Express app:
    - Mount dưới `/api/leave-requests`.

8. Test bằng Postman:
    - Login Admin.
    - Login Employee.
    - Employee tạo đơn.
    - Employee xem đơn của mình.
    - Admin xem tất cả đơn.
    - Admin duyệt hoặc từ chối đơn.
    - Kiểm tra Employee không thể duyệt/từ chối.

---

## 9. Ghi Chú Cho Người Mới Backend

Trong module này, cần phân biệt rõ authentication và authorization:

- Authentication: người dùng đã đăng nhập chưa.
- Authorization: người dùng có được phép làm hành động này không.

Ví dụ:

- Employee đã đăng nhập nên có thể tạo leave request.
- Nhưng Employee không có quyền approve/reject.
- Admin có quyền xem tất cả và approve/reject.

Trong MVP, `employeeId` được gửi trong body để dễ test. Về lâu dài, backend nên lấy Employee tương ứng từ `req.user.userId` để tránh việc Employee giả mạo `employeeId` của người khác.
