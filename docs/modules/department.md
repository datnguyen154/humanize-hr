# Department Management Module

## 1. Mục Tiêu Module

Department Management là module dùng để quản lý phòng ban trong hệ thống HRM.

Trong phạm vi MVP, module này tập trung vào các chức năng chính:

- Xem danh sách phòng ban.
- Tìm kiếm phòng ban theo tên hoặc mô tả.
- Lọc phòng ban theo trạng thái.
- Sắp xếp danh sách phòng ban.
- Tạo phòng ban mới.
- Xem chi tiết một phòng ban.
- Cập nhật thông tin phòng ban.
- Thay đổi trạng thái hoạt động của phòng ban.

Mục tiêu của module này là giúp Admin quản lý cấu trúc tổ chức cơ bản của công ty. Sau này, Employee Management có thể liên kết nhân viên với phòng ban thông qua `departmentId`.

---

## 2. Actors

## 2.1 Admin

Admin là người quản lý hệ thống.

Trong MVP Department Management, Admin có quyền:

- Xem danh sách toàn bộ phòng ban.
- Tìm kiếm, lọc và sắp xếp phòng ban.
- Tạo phòng ban mới.
- Xem chi tiết phòng ban.
- Cập nhật thông tin phòng ban.
- Chuyển trạng thái phòng ban sang `ACTIVE` hoặc `INACTIVE`.

## 2.2 Employee

Employee là nhân viên sử dụng hệ thống.

Trong phạm vi MVP này:

- Employee chưa có quyền quản lý phòng ban.
- Employee không được phép gọi các API Department Management.

---

## 3. Business Rules

Các rule nghiệp vụ cần tuân thủ:

- Tất cả API Department đều yêu cầu đăng nhập bằng Bearer Access Token.
- Chỉ user có role `ADMIN` mới được truy cập module Department.
- Tên phòng ban là bắt buộc.
- Tên phòng ban phải là duy nhất trong hệ thống.
- `status` chỉ nhận một trong hai giá trị: `ACTIVE` hoặc `INACTIVE`.
- Khi tạo mới phòng ban, nếu không truyền `status`, backend có thể mặc định là `ACTIVE`.
- Không nên xóa cứng phòng ban trong MVP.
- Khi muốn ngừng sử dụng phòng ban, Admin nên đổi `status` sang `INACTIVE`.
- `GET /api/departments` cần hỗ trợ pagination để tránh trả quá nhiều dữ liệu một lần.
- Nếu không truyền `page`, mặc định dùng `page = 1`.
- Nếu không truyền `limit`, mặc định dùng `limit = 10`.
- `limit` nên có giới hạn tối đa, ví dụ `100`.
- `search` dùng để tìm theo `name` hoặc `description`.
- `status` dùng để lọc phòng ban theo trạng thái.
- API danh sách cần hỗ trợ sort theo các field an toàn.
- Nếu không truyền `sortBy`, mặc định có thể sắp xếp theo `createdAt`.
- Nếu không truyền `sortOrder`, mặc định là `desc`.
- Nếu không có phòng ban phù hợp, API vẫn trả `data: []`, không xem là lỗi.

---

## 4. User Stories

## US-DEPT-001: Xem Danh Sách Phòng Ban

Là Admin, tôi muốn xem danh sách phòng ban để nắm được cơ cấu tổ chức trong công ty.

### Acceptance Criteria

- Admin có thể gọi API danh sách phòng ban.
- API yêu cầu Bearer Access Token.
- Chỉ ADMIN được phép truy cập.
- API trả về `data` và `meta`.
- Danh sách có hỗ trợ phân trang.
- Nếu không có dữ liệu, API trả về mảng rỗng.

---

## US-DEPT-002: Tìm Kiếm Và Lọc Phòng Ban

Là Admin, tôi muốn tìm kiếm và lọc phòng ban để nhanh chóng tìm được phòng ban cần quản lý.

### Acceptance Criteria

- Admin có thể truyền `search`.
- Backend tìm kiếm theo `name` hoặc `description`.
- Admin có thể truyền `status`.
- `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`.
- Nếu `status` không hợp lệ, API trả về `400`.

---

## US-DEPT-003: Tạo Phòng Ban

Là Admin, tôi muốn tạo phòng ban mới để quản lý các bộ phận trong công ty.

### Acceptance Criteria

- Chỉ ADMIN được phép tạo phòng ban.
- `name` là bắt buộc.
- `name` phải duy nhất.
- `description` có thể để trống.
- `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`.
- Tạo thành công trả về phòng ban vừa tạo.
- Nếu tên phòng ban đã tồn tại, API trả về `409`.

---

## US-DEPT-004: Xem Chi Tiết Phòng Ban

Là Admin, tôi muốn xem chi tiết một phòng ban để kiểm tra thông tin trước khi cập nhật.

### Acceptance Criteria

- Chỉ ADMIN được phép xem chi tiết phòng ban.
- API nhận `id` của phòng ban trên URL.
- Nếu phòng ban tồn tại, API trả về thông tin chi tiết.
- Nếu phòng ban không tồn tại, API trả về `404`.

---

## US-DEPT-005: Cập Nhật Phòng Ban

Là Admin, tôi muốn cập nhật thông tin phòng ban để dữ liệu tổ chức luôn chính xác.

### Acceptance Criteria

- Chỉ ADMIN được phép cập nhật phòng ban.
- Phòng ban phải tồn tại.
- Nếu cập nhật `name`, tên mới vẫn phải duy nhất.
- `description` có thể cập nhật.
- `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`.
- Cập nhật thành công trả về phòng ban mới nhất.

---

## US-DEPT-006: Cập Nhật Trạng Thái Phòng Ban

Là Admin, tôi muốn thay đổi trạng thái phòng ban để tạm ngừng hoặc khôi phục phòng ban trong hệ thống.

### Acceptance Criteria

- Chỉ ADMIN được phép thay đổi trạng thái.
- Phòng ban phải tồn tại.
- Request body chỉ cần truyền `status`.
- `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`.
- Cập nhật thành công trả về `id` và `status` mới.

---

## 5. API Contract

## 5.1 Get Department List

### Endpoint

```http
GET /api/departments
```

### Authentication

Yêu cầu access token.

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép truy cập.

### Query Params

| Param       | Type   | Required | Description                                                              |
| ----------- | ------ | -------- | ------------------------------------------------------------------------ |
| `page`      | Number | No       | Trang hiện tại, mặc định là `1`                                          |
| `limit`     | Number | No       | Số item mỗi trang, mặc định là `10`                                      |
| `search`    | String | No       | Tìm theo tên hoặc mô tả phòng ban                                        |
| `status`    | Enum   | No       | Lọc theo `ACTIVE` hoặc `INACTIVE`                                        |
| `sortBy`    | String | No       | Field dùng để sắp xếp. Gợi ý: `name`, `status`, `createdAt`, `updatedAt` |
| `sortOrder` | String | No       | Thứ tự sắp xếp: `asc` hoặc `desc`                                        |

### Example Request

```http
GET /api/departments?page=1&limit=10&search=engineering&status=ACTIVE&sortBy=createdAt&sortOrder=desc
```

### Success Response

```json
{
    "data": [
        {
            "id": "9f0f6f6b-5c1a-4a2a-9f15-71d5e18a2c10",
            "name": "Engineering",
            "description": "Phòng phát triển sản phẩm và hệ thống",
            "status": "ACTIVE",
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

## 5.2 Create Department

### Endpoint

```http
POST /api/departments
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép tạo phòng ban.

### Request Body

```json
{
    "name": "Engineering",
    "description": "Phòng phát triển sản phẩm và hệ thống",
    "status": "ACTIVE"
}
```

### Success Response

```json
{
    "data": {
        "id": "9f0f6f6b-5c1a-4a2a-9f15-71d5e18a2c10",
        "name": "Engineering",
        "description": "Phòng phát triển sản phẩm và hệ thống",
        "status": "ACTIVE",
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T08:00:00.000Z"
    }
}
```

### Error Responses

| Case                  | Status | Message                        |
| --------------------- | ------ | ------------------------------ |
| Không gửi token       | 401    | Unauthorized                   |
| User không phải Admin | 403    | Forbidden                      |
| `name` bị thiếu       | 400    | name is required               |
| `status` không hợp lệ | 400    | Invalid status                 |
| `name` đã tồn tại     | 409    | Department name already exists |

---

## 5.3 Get Department Detail

### Endpoint

```http
GET /api/departments/:id
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép xem chi tiết phòng ban.

### Success Response

```json
{
    "data": {
        "id": "9f0f6f6b-5c1a-4a2a-9f15-71d5e18a2c10",
        "name": "Engineering",
        "description": "Phòng phát triển sản phẩm và hệ thống",
        "status": "ACTIVE",
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T08:00:00.000Z"
    }
}
```

### Not Found Response

```json
{
    "message": "Department not found"
}
```

---

## 5.4 Update Department

### Endpoint

```http
PATCH /api/departments/:id
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép cập nhật phòng ban.

### Request Body

```json
{
    "name": "Product Engineering",
    "description": "Phòng phát triển sản phẩm nội bộ",
    "status": "ACTIVE"
}
```

### Success Response

```json
{
    "data": {
        "id": "9f0f6f6b-5c1a-4a2a-9f15-71d5e18a2c10",
        "name": "Product Engineering",
        "description": "Phòng phát triển sản phẩm nội bộ",
        "status": "ACTIVE",
        "createdAt": "2026-06-17T08:00:00.000Z",
        "updatedAt": "2026-06-17T09:30:00.000Z"
    }
}
```

### Error Responses

| Case                     | Status | Message                        |
| ------------------------ | ------ | ------------------------------ |
| Department không tồn tại | 404    | Department not found           |
| `name` đã tồn tại        | 409    | Department name already exists |
| `status` không hợp lệ    | 400    | Invalid status                 |
| Không có quyền           | 403    | Forbidden                      |

---

## 5.5 Update Department Status

### Endpoint

```http
PATCH /api/departments/:id/status
```

### Authentication

```http
Authorization: Bearer access_token
```

### Authorization

Chỉ `ADMIN` được phép thay đổi trạng thái phòng ban.

### Request Body

```json
{
    "status": "INACTIVE"
}
```

### Success Response

```json
{
    "data": {
        "id": "9f0f6f6b-5c1a-4a2a-9f15-71d5e18a2c10",
        "status": "INACTIVE"
    }
}
```

### Error Responses

| Case                     | Status | Message              |
| ------------------------ | ------ | -------------------- |
| Department không tồn tại | 404    | Department not found |
| `status` không hợp lệ    | 400    | Invalid status       |
| Không có token           | 401    | Unauthorized         |
| Không có quyền           | 403    | Forbidden            |

---

## 6. Database Fields

## Department Table

| Field         | Type     | Required | Description                                         |
| ------------- | -------- | -------- | --------------------------------------------------- |
| `id`          | UUID     | Yes      | Khóa chính của phòng ban                            |
| `name`        | String   | Yes      | Tên phòng ban, phải duy nhất                        |
| `description` | String   | No       | Mô tả ngắn về chức năng hoặc nhiệm vụ của phòng ban |
| `status`      | Enum     | Yes      | Trạng thái phòng ban: `ACTIVE` hoặc `INACTIVE`      |
| `createdAt`   | DateTime | Yes      | Thời điểm tạo phòng ban                             |
| `updatedAt`   | DateTime | Yes      | Thời điểm cập nhật phòng ban gần nhất               |

### Department Status

- `ACTIVE`: Phòng ban đang hoạt động và có thể được dùng trong hệ thống.
- `INACTIVE`: Phòng ban tạm ngừng hoạt động hoặc không còn sử dụng. Dữ liệu vẫn được giữ lại để phục vụ lịch sử.

### Gợi Ý Index Và Constraint

- `id` là primary key.
- `name` nên có unique constraint để tránh trùng tên phòng ban.
- `status` nên có index để hỗ trợ filter.
- `createdAt` có thể dùng để sort danh sách.

---

## 7. Error Cases

| Case                           | HTTP Status | Message                        |
| ------------------------------ | ----------- | ------------------------------ |
| Không gửi access token         | 401         | Unauthorized                   |
| Access token sai hoặc hết hạn  | 401         | Unauthorized                   |
| User không phải Admin          | 403         | Forbidden                      |
| `id` không đúng định dạng UUID | 400         | Department not found           |
| Department không tồn tại       | 404         | Department not found           |
| `page` không phải số hợp lệ    | 400         | Invalid page                   |
| `limit` không phải số hợp lệ   | 400         | Invalid limit                  |
| `status` không hợp lệ          | 400         | Invalid status                 |
| `sortBy` không hợp lệ          | 400         | Invalid sortBy                 |
| `sortOrder` không hợp lệ       | 400         | Invalid sortOrder              |
| `name` bị thiếu                | 400         | name is required               |
| `name` đã tồn tại              | 409         | Department name already exists |
| Server hoặc database lỗi       | 500         | Internal server error          |

---

## 8. Ghi Chú Cho Người Mới Backend

Department là bảng dữ liệu độc lập ở giai đoạn đầu. Sau này, Employee sẽ liên kết với Department bằng `departmentId`.

Khi implement backend, nên đi theo thứ tự:

1. Tạo enum `DepartmentStatus`.
2. Tạo model `Department` trong Prisma schema.
3. Tạo repository để thao tác database.
4. Tạo service để xử lý validation và business rules.
5. Tạo controller để nhận request và trả response.
6. Tạo routes và gắn middleware `authenticate`, `requireRole("ADMIN")`.
7. Register routes vào Express app.

Lưu ý quan trọng:

- Repository chỉ nên nói chuyện với Prisma.
- Service nên xử lý rule như validate status, kiểm tra trùng name, kiểm tra department tồn tại.
- Controller chỉ nên đọc request, gọi service và trả response.
- Middleware xử lý authentication và authorization trước khi request đi vào controller.

## Future Relation

Department sẽ được liên kết với Employee thông qua:

Employee {
departmentId: string | null
}

Department {
employees: Employee[]
}
