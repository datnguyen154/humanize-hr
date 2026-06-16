# Employee Management Module

## 1. Mục Tiêu Module

Employee Management là module dùng để quản lý thông tin nhân viên trong hệ thống HRM.

Trong phạm vi MVP đầu tiên, module này chỉ tập trung vào chức năng:

- Xem danh sách nhân viên.
- Phân trang danh sách nhân viên.
- Tìm kiếm nhân viên.
- Lọc nhân viên theo phòng ban.
- Lọc nhân viên theo trạng thái.

Mục tiêu của bước đầu là giúp Admin có thể xem dữ liệu nhân viên một cách rõ ràng, dễ tìm kiếm và phù hợp để hiển thị trên giao diện bảng.

Frontend sẽ dùng:

- TanStack Query để gọi API, cache dữ liệu, quản lý loading và error.
- shadcn Table để hiển thị danh sách nhân viên.

Vì vậy API `GET /api/employees` cần hỗ trợ tốt pagination, search và filter.

---

## 2. Actors

## 2.1 Admin

Admin là người quản lý hệ thống.

Trong MVP này, Admin có quyền:

- Xem danh sách toàn bộ nhân viên.
- Tìm kiếm nhân viên.
- Lọc nhân viên theo phòng ban.
- Lọc nhân viên theo trạng thái.
- Xem thông tin cơ bản của từng nhân viên trong bảng.

## 2.2 Employee

Employee là nhân viên sử dụng hệ thống.

Trong phạm vi xem danh sách nhân viên ở MVP đầu tiên:

- Employee chưa cần xem danh sách toàn bộ nhân viên.
- Employee có thể được hỗ trợ xem hồ sơ cá nhân ở module khác hoặc giai đoạn sau.

---

## 3. Business Rules

Các rule nghiệp vụ cần tuân thủ:

- Chỉ user đã đăng nhập mới được truy cập API danh sách nhân viên.
- Trong MVP, chỉ Admin được xem danh sách toàn bộ nhân viên.
- Danh sách nhân viên cần phân trang để tránh trả quá nhiều dữ liệu một lần.
- Nếu không truyền `page`, mặc định dùng `page = 1`.
- Nếu không truyền `limit`, mặc định dùng `limit = 10`.
- `limit` nên có giới hạn tối đa, ví dụ `100`, để tránh request quá nặng.
- `search` dùng để tìm theo tên nhân viên hoặc email.
- `departmentId` dùng để lọc nhân viên theo phòng ban.
- `status` dùng để lọc nhân viên theo trạng thái làm việc.
- Nếu không có nhân viên phù hợp, API vẫn trả về `data: []`, không xem là lỗi.
- API response phải luôn có `meta` để frontend hiển thị pagination.
- Không trả về dữ liệu nhạy cảm như `passwordHash`.
- API hỗ trợ sắp xếp dữ liệu bằng `sortBy` và `sortOrder`.
- Nếu không truyền `sortBy`, mặc định sắp xếp theo `createdAt`.
- Nếu không truyền `sortOrder`, mặc định là `desc`.
- Chỉ cho phép sort theo một số field an toàn: `employeeCode`, `fullName`, `joinedAt`, `createdAt`.

---

## 4. User Stories

## US-EMP-001: Xem danh sách nhân viên

Là Admin, tôi muốn xem danh sách nhân viên để nắm được thông tin nhân sự trong công ty.

### Acceptance Criteria

- Admin truy cập được danh sách nhân viên.
- Danh sách hiển thị dạng bảng.
- Mỗi dòng là một nhân viên.
- API trả về danh sách theo từng trang.
- Response có `data` và `meta`.
- Không trả về `passwordHash`.

---

## US-EMP-002: Phân trang danh sách nhân viên

Là Admin, tôi muốn chuyển trang trong danh sách nhân viên để xem dữ liệu dễ hơn khi số lượng nhân viên lớn.

### Acceptance Criteria

- Frontend có thể gửi `page` và `limit`.
- Backend trả đúng số lượng nhân viên theo `limit`.
- Backend trả đúng thông tin pagination trong `meta`.
- `meta.totalItems` là tổng số nhân viên phù hợp với điều kiện lọc.
- `meta.totalPages` là tổng số trang.
- `meta.hasNextPage` cho biết còn trang tiếp theo không.
- `meta.hasPreviousPage` cho biết có trang trước không.

---

## US-EMP-003: Tìm kiếm nhân viên

Là Admin, tôi muốn tìm kiếm nhân viên theo từ khóa để nhanh chóng tìm được người cần xem.

### Acceptance Criteria

- Admin có thể nhập từ khóa tìm kiếm.
- Frontend gửi từ khóa qua query param `search`.
- Backend tìm kiếm theo `fullName` hoặc `email`.
- Tìm kiếm không nên phân biệt chữ hoa chữ thường.
- Nếu không tìm thấy kết quả, trả về `data: []`.

---

## US-EMP-004: Lọc theo phòng ban

Là Admin, tôi muốn lọc danh sách nhân viên theo phòng ban để xem nhân sự của từng bộ phận.

### Acceptance Criteria

- Frontend gửi `departmentId`.
- Backend chỉ trả về nhân viên thuộc phòng ban đó.
- Nếu phòng ban không có nhân viên, trả về `data: []`.
- Response vẫn có đầy đủ `meta`.

---

## US-EMP-005: Lọc theo trạng thái

Là Admin, tôi muốn lọc nhân viên theo trạng thái để biết ai đang làm việc, ai đã nghỉ hoặc bị khóa.

### Acceptance Criteria

- Frontend gửi `status`.
- Backend lọc nhân viên theo trạng thái.
- Nếu `status` không hợp lệ, trả về lỗi `400`.

## US-EMP-006: Tạo nhân viên

Là Admin, tôi muốn tạo nhân viên mới để quản lý nhân sự trong hệ thống.

### Acceptance Criteria

- Chỉ ADMIN được phép tạo nhân viên.
- employeeCode là bắt buộc.
- employeeCode phải duy nhất.
- fullName là bắt buộc.
- email là bắt buộc.
- email phải duy nhất.
- phone là bắt buộc.
- position là bắt buộc.
- status là bắt buộc.
- status chỉ nhận ACTIVE hoặc INACTIVE.
- joinedAt là bắt buộc.
- joinedAt phải là ngày hợp lệ.
- Tạo thành công trả về thông tin nhân viên vừa tạo.

---

## 5. API Contract

## 5.1 Get Employee List

### Endpoint

```http
GET /api/employees
```

### Authentication

Yêu cầu access token.

```http
Authorization: Bearer access_token
```

### Authorization

Trong MVP:

- Chỉ `ADMIN` được truy cập.
- `EMPLOYEE` không được xem danh sách toàn bộ nhân viên.

### Query Params

| Param          | Type   | Required | Description                                                                          |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| `page`         | Number | No       | Trang hiện tại, mặc định là `1`                                                      |
| `limit`        | Number | No       | Số item mỗi trang, mặc định là `10`                                                  |
| `search`       | String | No       | Tìm theo tên hoặc email                                                              |
| `departmentId` | UUID   | No       | Lọc theo phòng ban                                                                   |
| `status`       | Enum   | No       | Lọc theo trạng thái nhân viên                                                        |
| `sortBy`       | String | No       | Field dùng để sắp xếp. Cho phép: `employeeCode`, `fullName`, `joinedAt`, `createdAt` |
| `sortOrder`    | String | No       | Thứ tự sắp xếp. Cho phép: `asc`, `desc`. Mặc định là `desc`                          |

### Ví Dụ Request

```http
GET /api/employees?page=1&limit=10&search=nguyen&departmentId=department_id&status=ACTIVE
```

### Success Response

```json
{
    "data": [
        {
            "id": "employee_id",
            "employeeCode": "EMP001",
            "fullName": "Nguyen Van A",
            "email": "nguyen.van.a@example.com",
            "phone": "0901234567",
            "gender": "MALE",
            "dateOfBirth": "1998-01-15",
            "position": "Frontend Developer",
            "department": {
                "id": "department_id",
                "name": "Engineering"
            },
            "status": "ACTIVE",
            "joinedAt": "2024-01-01",
            "createdAt": "2024-01-01T08:00:00.000Z",
            "updatedAt": "2024-01-10T08:00:00.000Z"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "totalItems": 35,
        "totalPages": 4,
        "hasNextPage": true,
        "hasPreviousPage": false
    }
}
```

### Empty Response

Khi không có nhân viên phù hợp:

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

## 5.2 Create Employee

### Endpoint

POST /api/employees

### Authentication

Yêu cầu access token.

Authorization: Bearer access_token

### Authorization

Chỉ ADMIN được phép tạo nhân viên.

### Request Body

```json
{
    "employeeCode": "EMP031",
    "fullName": "Nguyen Van B",
    "email": "b@example.com",
    "phone": "0901234567",
    "position": "Frontend Developer",
    "status": "ACTIVE",
    "joinedAt": "2024-01-01T00:00:00.000Z"
}
```

### Success Response

```json
{
    "data": {
        "id": "uuid",
        "employeeCode": "EMP031",
        "fullName": "Nguyen Van B",
        "email": "b@example.com",
        "phone": "0901234567",
        "position": "Frontend Developer",
        "status": "ACTIVE",
        "joinedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
}
```

### Error Responses

| Case                    | Status |
| ----------------------- | ------ |
| employeeCode đã tồn tại | 409    |
| email đã tồn tại        | 409    |
| dữ liệu không hợp lệ    | 400    |
| không có quyền          | 403    |

---

## 6. Database Fields Needed For Employee Model

MVP xem danh sách nhân viên cần các field sau.

## Employee Table

| Field          | Type     | Description                                               |
| -------------- | -------- | --------------------------------------------------------- |
| `id`           | UUID     | Khóa chính                                                |
| `userId`       | UUID     | Liên kết với tài khoản đăng nhập nếu nhân viên có account |
| `employeeCode` | String   | Mã nhân viên, ví dụ `EMP001`                              |
| `fullName`     | String   | Họ tên nhân viên                                          |
| `email`        | String   | Email công việc hoặc email đăng nhập                      |
| `phone`        | String   | Số điện thoại                                             |
| `gender`       | Enum     | Giới tính, ví dụ `MALE`, `FEMALE`, `OTHER`                |
| `dateOfBirth`  | DateTime | Ngày sinh                                                 |
| `position`     | String   | Chức vụ hoặc vị trí công việc                             |
| `departmentId` | UUID     | Liên kết với phòng ban                                    |
| `status`       | Enum     | Trạng thái nhân viên                                      |
| `joinedAt`     | DateTime | Ngày vào công ty                                          |
| `createdAt`    | DateTime | Ngày tạo dữ liệu                                          |
| `updatedAt`    | DateTime | Ngày cập nhật dữ liệu                                     |

### Gợi Ý Employee Status

Các trạng thái cơ bản:

- `ACTIVE`: Nhân viên đang làm việc và tài khoản có thể hoạt động bình thường
- `INACTIVE`: Nhân viên không còn hoạt động trong hệ thống, ví dụ đã nghỉ việc hoặc bị vô hiệu hóa tài khoản. Dữ liệu lịch sử vẫn được giữ lại, nhưng nhân viên không còn được tính là nhân sự đang hoạt động

### Relationships

`Employee` liên kết với `Department`:

- Một phòng ban có nhiều nhân viên.
- Một nhân viên thuộc một phòng ban.

`Employee` có thể liên kết với `User`:

- Một nhân viên có thể có một tài khoản đăng nhập.
- Tài khoản đăng nhập dùng cho authentication.
- Thông tin nhân sự dùng cho employee management.

Lưu ý cho người mới backend:

- `User` dùng để đăng nhập và phân quyền.
- `Employee` dùng để lưu hồ sơ nhân viên.
- Không nên trộn hết thông tin nhân viên vào bảng `User`.

---

## 7. Error Cases

| Case                                     | HTTP Status | Message               |
| ---------------------------------------- | ----------- | --------------------- |
| Không gửi access token                   | 401         | Unauthorized          |
| Access token sai hoặc hết hạn            | 401         | Unauthorized          |
| User không phải Admin                    | 403         | Forbidden             |
| `page` không phải số hợp lệ              | 400         | Invalid page          |
| `limit` không phải số hợp lệ             | 400         | Invalid limit         |
| `status` không hợp lệ                    | 400         | Invalid status        |
| `departmentId` không đúng định dạng UUID | 400         | Invalid departmentId  |
| Server hoặc database lỗi                 | 500         | Internal server error |
| `sortBy` không hợp lệ                    | 400         | Invalid sortBy        |
| `sortOrder` không hợp lệ                 | 400         | Invalid sortOrder     |

---

## 8. Ghi Chú Triển Khai Cho Frontend

Frontend dùng TanStack Query nên API cần ổn định về query params và response shape.

Query key gợi ý:

```text
employees, page, limit, search, departmentId, status
```

Khi user thay đổi `search`, `departmentId` hoặc `status`, frontend nên quay lại `page = 1`.

shadcn Table nên hiển thị các cột MVP:

- Mã nhân viên.
- Họ tên.
- Email.
- Số điện thoại.
- Phòng ban.
- Chức vụ.
- Trạng thái.
- Ngày vào công ty.

Trong MVP Create Employee hiện tại,
gender, dateOfBirth và departmentId
sẽ được bổ sung ở giai đoạn sau.

Các action như thêm, sửa, xóa nhân viên sẽ làm ở bước sau, không thuộc phạm vi tài liệu MVP hiện tại.
