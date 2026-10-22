# Work Schedule — S1 API Contract v1

Ngày: 19/10/2026. Contract kỹ thuật S1 do Codex chốt và đã implement theo ủy quyền triển khai Backend S1; các quyết định A0-01/02/03 liên quan draft được người dùng xác nhận, bao gồm xác nhận bổ sung giờ **HH:mm**. Backend tests và integration evidence: [report S1](../codex-reports/attendance-payroll-s1-work-schedule-drafts.md). Không có Frontend S1 tại thời điểm bàn giao.

## Scope và auth

Một lịch chung toàn công ty, nhiều bản nháp có version riêng. S1 chỉ list/detail/create/edit **DRAFT**. Không DELETE, clone endpoint, activate, preview công, chốt công hay Payroll. Client dùng mẫu demo để điền form rồi POST; backend không seed hoặc tự activate. `effectiveFrom` trong draft chỉ là cấu hình chưa có tác động.

Base local: `http://localhost:3000/api`. Tất cả endpoint cần `Authorization: Bearer <accessToken>` với role ADMIN. Reuse auth middleware hiện có: 401 `{message:"Unauthorized"}`, 403 `{message:"Forbidden"}`; không tự đổi contract auth để thêm code. Các lỗi module dùng code tiếng Anh ổn định và message/details tiếng Việt bên dưới.

| Method | Path | Success |
| --- | --- | --- |
| GET | `/work-calendar/versions?page=1&limit=10` | 200 `{data:WorkScheduleDto[],meta}` |
| GET | `/work-calendar/versions/:id` | 200 `{data:WorkScheduleDto}` |
| POST | `/work-calendar/versions` | 201 `{data:WorkScheduleDto}` |
| PATCH | `/work-calendar/versions/:id` | 200 `{data:WorkScheduleDto}` |

## POST body

```json
{
  "effectiveFrom": "2026-11-01",
  "timezone": "Asia/Ho_Chi_Minh",
  "weekdays": [1, 2, 3, 4, 5],
  "startTime": "08:00",
  "endTime": "17:00",
  "breaks": [{ "startTime": "12:00", "endTime": "13:00" }]
}
```

Ngày 2026-11-01 là **ví dụ payload**, không phải quyết định ngày bắt đầu dữ liệu hoặc ngày activate. Không tự điền effectiveFrom vào seed lịch sử.

- Tất cả 6 fields bắt buộc. Body phải là JSON object; field lạ bị từ chối, không silently ignore.
- `effectiveFrom`: date-only YYYY-MM-DD, năm 0001–9999 và ngày có thật. Không nhận ISO timestamp. S1 không cấm ngày quá khứ/tương lai vì chỉ lưu draft; S2 mới kiểm tra tác động hiệu lực trước activate.
- `timezone`: chỉ literal `Asia/Ho_Chi_Minh`; không tự fallback hoặc nhận timezone máy client.
- `weekdays`: array 1–7 phần tử, integer ISO 1=Thứ Hai … 7=Chủ Nhật, không trùng. Server trả thứ tự tăng dần. S1 kiểm tra cấu trúc; không khẳng định mọi tổ hợp ngày là lịch được phép activate theo pháp luật.
- Giờ là HH:mm 24h từ 00:00 đến 23:59, có leading zero. Không nhận `08`, `8:00`, `24:00`, seconds, offset hoặc datetime.
- `breaks`: array **đúng một object** có startTime/endTime, không field `paid`, không nhiều khoảng nghỉ. Điều kiện: `startTime < break.startTime < break.endTime < endTime`, cùng một ngày, có thời gian làm trước/sau nghỉ. Không ca qua đêm hoặc khoảng nghỉ rỗng.
- Mẫu demo nghỉ 12:00–13:00 không tính giờ làm đã được chốt; S1 chỉ lưu khoảng thời gian, chưa tính phút làm/công/lương. Không tự thêm grace/min/max ngày công hoặc giới hạn 8h vào validation draft.
- `status`, `version`, `revision`, actor/timestamps là server-owned; client gửi chúng sẽ nhận 400. Version dùng sequence DB, không cam kết liên tục vì rollback có thể tạo khoảng trống. Cho phép nhiều draft cùng effectiveFrom; chưa có lịch active bị ảnh hưởng.

## PATCH body và concurrency

```json
{
  "expectedRevision": 1,
  "endTime": "17:30"
}
```

`expectedRevision` bắt buộc là JSON number nguyên từ 1 đến 2147483646, không nhận numeric string. Gửi ít nhất một config field thuộc POST; những field khác giữ nguyên. `breaks`/`weekdays` nếu gửi sẽ thay toàn bộ array, không merge theo index. Không dùng null để xóa required field. Server merge rồi validate **toàn cấu hình**, không chỉ field thay đổi.

Server ghi với guard `{id,status:DRAFT,revision:expectedRevision}` trong transaction, tăng revision 1 và lưu audit before/after cùng actor/time. Đọc trước khi ghi chưa đủ; CAS guard ở chính câu UPDATE. Hai client sửa cùng revision chỉ một thắng. PATCH hợp lệ dù không đổi giá trị vẫn tăng revision và ghi audit. Khi 409, refetch detail và cho người dùng kiểm tra lại; không tự retry bằng revision mới hoặc ghi đè form đang nhập.

## WorkScheduleDto

Ví dụ shape, không phải bản ghi đã seed:

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "version": 1,
    "revision": 1,
    "status": "DRAFT",
    "effectiveFrom": "2026-11-01",
    "timezone": "Asia/Ho_Chi_Minh",
    "weekdays": [1, 2, 3, 4, 5],
    "startTime": "08:00",
    "endTime": "17:00",
    "breaks": [{ "startTime": "12:00", "endTime": "13:00" }],
    "createdBy": "22222222-2222-4222-8222-222222222222",
    "updatedBy": "22222222-2222-4222-8222-222222222222",
    "createdAt": "2026-10-19T00:00:00.000Z",
    "updatedAt": "2026-10-19T00:00:00.000Z"
  }
}
```

Config/metadata không nullable. createdAt/updatedAt là instant UTC ISO, khác effectiveFrom date-only. Actor UUID từ JWT, không từ payload. Không có quantity, payableDays hay netSalary. DB lưu phút trong ngày và date; DTO che internal minute fields. Status enum dự trữ ACTIVE cho bước sau, nhưng endpoint S1 chỉ trả DRAFT thành công; GET/PATCH id non-DRAFT trả 409. List lọc DRAFT ở DB.

List chỉ nhận `page`, `limit`; page mặc định 1, phạm vi 1–1000000; limit mặc định 10, phạm vi 1–100. Query phải là một chuỗi số nguyên dương, duplicate/array/unknown params bị 400. Sort cố định version desc, version unique. meta gồm page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage; count/list cùng snapshot đọc. Empty có data=[] và totalPages=0, hai cờ false. Page vượt cuối trả data=[] theo meta, không tự chuyển page.

## Error contract

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Thông tin lịch làm việc không hợp lệ.",
  "details": { "startTime": "Giờ phải có định dạng HH:mm từ 00:00 đến 23:59." }
}
```

| Status | code | Ý nghĩa / UI |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | details là field → message tiếng Việt của lỗi đầu tiên; có thể là body, effectiveFrom, timezone, weekdays, startTime, endTime, breaks, breaks.0.startTime/endTime, expectedRevision, page, limit hoặc field không được hỗ trợ. FE giữ form và hiển thị lỗi tương ứng |
| 404 | WORK_SCHEDULE_NOT_FOUND | UUID không đúng hoặc id không tồn tại; “Không tìm thấy bản nháp lịch làm việc.” |
| 409 | WORK_SCHEDULE_NOT_DRAFT | Id đã không còn DRAFT; “Chỉ được thao tác với bản nháp lịch làm việc.” |
| 409 | WORK_SCHEDULE_REVISION_CONFLICT | Revision đã thay đổi hoặc CAS thua; “Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.” |
| 500 | INTERNAL_SERVER_ERROR | Lỗi module/DB không dự kiến; “Không thể xử lý lịch làm việc. Vui lòng thử lại sau.” Không trả raw DB error |

Lỗi JSON syntax/content-type bị Express xử lý trước controller theo middleware hiện hữu; không dựa vào code module cho body không parse được. Với lỗi auth 401/403 dùng interceptor/role handling hiện có. Path không tồn tại (activate/delete) dùng 404 mặc định Express, không coi là API business của S1.

## Storage và giới hạn

WorkScheduleVersion có version sequence/revision, scalar minute fields, creator/updater và timestamps; WorkScheduleAudit có before/after/actor và action CREATE/UPDATE. Tạo/sửa và audit cùng transaction; audit lỗi thì không lưu draft. Các FK restrict bảo vệ audit, không cascade xóa lịch sử; không có endpoint đọc audit trong S1, chưa làm tab lịch sử FE.

Migration additive `20261019140000_add_work_schedule_drafts` tạo riêng bảng/enum/index/FK/check; không seed dữ liệu, không đọc/ghi Attendance, Leave hay Payroll. Chỉ module mới và app route được nối; timezone Attendance cũ vẫn giữ nguyên đến slice được duyệt để integrate, không đổi chung sang timezone mới chỉ vì S1 lưu draft.
