# Work Calendar — S2A Exact API Contract v1

**Cập nhật22/10/2026:** v1 giữ6 API, có [addendum v1.1 đã triển khai Backend](work-calendar-s2a-holiday-batch.md) cho holidayPolicy/preset/batch atomic và preview classification. Đọc cả hai; phần mở rộng không phải activation hoặc Payroll. [Evidence mới](../codex-reports/attendance-payroll-s2a-holiday-batch.md):137 Backend tests/full build PASS; Frontend mới/F11 mobile còn chờ Anti, chưa QA/done. Build DLL bị chặn ở review trước đã được xác minh lại PASS sau người dùng dừng backend.

Ngày22/10/2026. **Contract v1 APPROVED; Backend S2A IMPLEMENTED/READY**, v1.1 mở rộng theo yêu cầu mới như trên. Migration v1 đã áp localhost, v1.1 không migration. Frontend v1 đã review/sửa logic,100 tests/lint/build PASS; Backend mới137 tests/full build PASS. Còn UIv1.1 và F11 mobile giao Anti, chưa user QA/done/S2B. Tiến độ: [checklist](../plans/attendance-payroll-mvp-slices.md); [brief Anti](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md); [plan S2](../plans/attendance-payroll-s2-calendar-proposal.md).

## 1. Scope và nguyên tắc

- S2A chỉ Calendar Exceptions của WorkScheduleVersion **DRAFT** và Monthly Preview; không activate, timeline ACTIVE, sửa Attendance/status/dashboard/report/Payroll hoặc tính công hưởng lương/OT.
- ADMIN cấu hình/xác nhận; auth Bearer/middleware/refresh flow giữ nguyên. 401 `{message:"Unauthorized"}`, 403 `{message:"Forbidden"}`; lỗi module tiếng Việt theo mục 8.
- Giữ nguyên 4 API và DTO [S1 v1](work-schedule.md). Không thêm exceptions vào payload POST/PATCH cấu hình S1 hoặc cho PATCH ACTIVE. Các endpoint mới có base `http://localhost:3000/api`.
- Cùng timezone `Asia/Ho_Chi_Minh`, civil date `YYYY-MM-DD` (ngày có thật, năm 0001–9999), time `HH:mm`, ISO weekday 1–7. Không dùng timezone trình duyệt hoặc đổi ngày bằng `toISOString()` ở FE. Timestamps audit là UTC ISO; tính weekday/date phải tránh bẫy JS Date.UTC năm 0–99.
- Một lịch chung, một ca/ngày và đúng một khoảng nghỉ; DRAFT vẫn có thể chưa đủ điều kiện kích hoạt. S2A không biến validation preview thành chứng nhận đủ nguồn pháp lý/Payroll. Chấm công ngoài lịch chỉ thuộc S2B, **không bị chặn bởi contract này**.

## 2. Endpoints

| Method | Path | Thành công |
| --- | --- | --- |
| GET | `/work-calendar/versions/:versionId/exceptions` | 200 `{data:CalendarExceptionDto[],meta,scheduleRevision}` |
| GET | `/work-calendar/versions/:versionId/exceptions/:id` | 200 `{data:{exception:CalendarExceptionDto,scheduleRevision}}` |
| POST | `/work-calendar/versions/:versionId/exceptions` | 201 `{data:{exception:CalendarExceptionDto,scheduleRevision}}` |
| PATCH | `/work-calendar/versions/:versionId/exceptions/:id` | 200 `{data:{exception:CalendarExceptionDto,scheduleRevision}}` |
| DELETE | `/work-calendar/versions/:versionId/exceptions/:id` | 200 `{data:{removedExceptionId,scheduleRevision}}` |
| GET | `/work-calendar/preview?versionId=<uuid>&year=2026&month=11` | 200 `{data:CalendarPreviewDto}` |

Tất cả chỉ nhận parent DRAFT. Parent non-DRAFT trả 409, không tạo API đọc/sửa ACTIVE sớm. GET chi tiết ngoại lệ phục vụ reload sau conflict, không tìm id trong một trang list rồi kết luận mất dữ liệu. `id` phải thuộc `versionId`; sai/không tồn tại trả 404, không tiết lộ version khác.

List query: page mặc định 1/phạm vi 1–1000000; limit mặc định 10/phạm vi 1–100; kind tùy chọn trong 4 enum. `fromDate`/`toDate` cùng có hoặc cùng bỏ, inclusive, from <= to, tối đa 366 ngày tính cả hai đầu. Lọc SWAP nếu offDate **hoặc** workDate thuộc range; một SWAP chỉ xuất hiện một lần. Sort cố định `firstAffectedDate ASC, id ASC`, firstAffectedDate là date hoặc min(offDate,workDate), không dựa createdAt.

Meta đúng S1: `{page,limit,totalItems,totalPages,hasNextPage,hasPreviousPage}`; count là số event sau filter, SWAP tính một event. Empty totalPages=0; page vượt cuối trả data=[] theo meta, không đổi page. Parent revision + count + rows đọc cùng snapshot.

Preview bắt buộc versionId/year/month; không có chế độ ACTIVE trong S2A. versionId sai định dạng UUID trong query trả 400 tại field versionId; UUID hợp lệ nhưng parent không tồn tại trả 404. ID URL sai/không tìm thấy trả 404 theo S1. year là chuỗi đúng 4 số 0001–9999; month nhận `1`–`12` hoặc `01`–`09`, response dùng JSON number. Mọi query phải single scalar; duplicate/array/unknown param bị 400. Preview trả toàn bộ 28/29/30/31 ngày theo thứ tự date tăng, không pagination; đọc toàn bộ nguồn DRAFT cần thiết, không tái dùng trang list để tính tổng.

## 3. Request payload và DTO

POST/PATCH body đều `{expectedRevision:number, exception:CalendarExceptionPayload}`. PATCH là **thay toàn bộ payload event**, không merge từng field/không PATCH nửa SWAP. DELETE body `{expectedRevision:number,reason:string}`. Revision là integer JSON 1–2147483646, không numeric string; dùng chung counter của WorkScheduleVersion, không thêm event revision riêng.

Shape chuẩn, mọi field dưới đây bắt buộc trong nhánh tương ứng:

```ts
type CalendarExceptionPayload =
  | { kind: 'HOLIDAY'; date: string; name: string; sourceReference: string; reason: string }
  | { kind: 'COMPENSATORY_OFF'; date: string; sourceHolidayDate: string; reason: string }
  | { kind: 'SWAP'; offDate: string; workDate: string; reason: string }
  | { kind: 'WORK_OVERRIDE'; date: string; startTime: string; endTime: string;
      breaks: [{ startTime: string; endTime: string }]; reason: string }

type CalendarExceptionDto = {
  id: string
  scheduleVersionId: string
  payload: CalendarExceptionPayload
  firstAffectedDate: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}
```

UUID/actor/timestamps/firstAffectedDate server-owned; không nhận client gửi vào payload. Trim text: name 1–200 ký tự; reason/sourceReference 1–1000 ký tự. Không nhận null, field thừa hoặc field của nhánh khác. sourceReference chỉ lưu căn cứ văn bản, không fetch URL/parse tài liệu/cấp quyền pháp lý tự động.

Ví dụ POST (payload minh họa, không seed hoặc quyết định ngày activate):

```json
{
  "expectedRevision": 1,
  "exception": {
    "kind": "SWAP",
    "offDate": "2026-11-06",
    "workDate": "2026-11-07",
    "reason": "Hoán đổi lịch làm việc theo xác nhận của quản trị viên"
  }
}
```

Ví dụ response POST:

```json
{
  "data": {
    "exception": {
      "id": "33333333-3333-4333-8333-333333333333",
      "scheduleVersionId": "11111111-1111-4111-8111-111111111111",
      "payload": {
        "kind": "SWAP",
        "offDate": "2026-11-06",
        "workDate": "2026-11-07",
        "reason": "Hoán đổi lịch làm việc theo xác nhận của quản trị viên"
      },
      "firstAffectedDate": "2026-11-06",
      "createdBy": "22222222-2222-4222-8222-222222222222",
      "updatedBy": "22222222-2222-4222-8222-222222222222",
      "createdAt": "2026-10-22T00:00:00.000Z",
      "updatedAt": "2026-10-22T00:00:00.000Z"
    },
    "scheduleRevision": 2
  }
}
```

GET detail dùng cùng envelope trên; list data là array DTO, scheduleRevision ở top-level cạnh meta. Không phải `response.data.data.data`. Không trả số công/tiền, employeeId hoặc Attendance status trong các DTO S2A.

## 4. Semantics và kiểm tra giao ngày

1. Ngày bị tác động (date hoặc **cả offDate/workDate**) phải >= effectiveFrom của parent. Không hạn chế phải cùng tháng/năm, không cấm ngày đã qua khi chỉ lưu DRAFT. Activation ngày mai/không hồi tố do S2B kiểm tra sau.
2. Mỗi ngày chỉ có một event tường minh trong một version; SWAP chiếm cả hai ngày. WEEKLY_OFF từ lịch tuần không phải event, nên HOLIDAY trên ngày vốn nghỉ tuần hợp lệ và giữ `isBaseWeeklyOff=true`. Không cho HOLIDAY/COMP/WORK_OVERRIDE/SWAP âm thầm đè nhau.
3. HOLIDAY có thể trên workday hoặc weekly off. Nếu trùng weekly off, preview yêu cầu nghỉ bù được HR xác nhận; không tự ghi/sinh COMPENSATORY_OFF. Danh sách rỗng không chứng minh năm không có lễ.
4. COMPENSATORY_OFF liên kết HOLIDAY **cùng DRAFT** bằng sourceHolidayDate; nguồn phải tồn tại và vốn là weekly off. Một nguồn tối đa một COMP, target sau source, target là ngày làm hợp lệ kế tiếp theo projection. Không dùng liên kết COMP → COMP hoặc source ACTIVE để giả đã hỗ trợ timeline S2B.
5. Tính target bù có thứ tự: lấy các HOLIDAY trùng nghỉ tuần theo source date tăng; tìm ngày làm kế tiếp sau từng nguồn, loại HOLIDAY/SWAPPED_OFF và chỗ đã dành cho nguồn trước. SWAPPED_WORKDAY là ngày làm. Việc giữ chỗ tính từ **các HOLIDAY nguồn**, không phụ thuộc thứ tự người dùng nhập COMP, không tự lưu kết quả. Nếu không có target trong miền ngày hợp lệ hoặc gặp ngày chưa xác định, báo issue, không loop vô hạn/đoán ngày; nguồn sau cũng không được tự chiếm target khi phân bổ của nguồn trước còn chưa xác định. Sửa event làm thay đổi target của COMP khác sẽ được báo ở preview để HR sửa, không tự dời bản ghi.
6. SWAP: offDate != workDate; offDate vốn là ngày làm, workDate vốn nghỉ tuần theo lịch nền. Cho workDate trước hoặc sau offDate, nhưng cả hai thuộc phạm vi DRAFT. WorkDate nhận ca/thời lượng của offDate trước swap; không phải OT và không thêm tiền/công. Do một lịch/ca chung và không cho overlap, không có override ẩn lên ca nguồn.
7. WORK_OVERRIDE chỉ trên ngày vốn làm, không biến lễ/nghỉ tuần thành ngày làm. HH:mm và đúng một break theo điều kiện S1 `start < breakStart < breakEnd < end`; cùng ngày. Không thêm paid/grace/employee field.
8. HOLIDAY đang có COMP tham chiếu: DELETE hoặc PATCH đổi kind/date bị 409 REFERENCED. Có thể sửa name/sourceReference/reason. HR sửa/xóa COMP trước, không cascade hoặc xóa bằng chứng không rõ ràng.
9. S1 PATCH lịch nền vẫn giữ contract/shape/validation hiện có và tăng cùng revision. **Không tự xóa/dời/rewrite event** nếu đổi weekdays/effectiveFrom/giờ. Event cũ có thể cần sửa sau đổi lịch nền: preview trả BLOCKER/UNRESOLVED; CRUD cho phép sửa hoặc xóa để khắc phục. Không yêu cầu toàn bộ DRAFT phải sẵn sàng activate mới được lưu từng bước.

POST/PATCH kiểm tra shape, dates, chiếm dụng ngày, nguồn/điều kiện của event đang ghi theo cấu hình hiện tại; không âm thầm sửa các event khác để làm request thành công. Base edit hoặc thay event liên quan có thể làm DRAFT chưa hoàn chỉnh, được thể hiện qua preview. DELETE event đang lỗi được phép để repair, trừ nguồn HOLIDAY còn được tham chiếu. Không thêm rule giảm công/lương.

## 5. Concurrency, audit và fingerprint

- Mỗi create/replace/delete: đọc parent DRAFT/revision, validate event/occupied dates dưới cùng transaction, **CAS ngay câu UPDATE parent** theo id/status/revision, tăng 1, lưu toàn event/cả SWAP + audit before/after + actor. Thua CAS hoặc audit lỗi phải rollback tất cả, không có nửa cặp hoặc revision tăng mà event không đổi.
- Event không có revision riêng. Save hợp lệ dù không thay đổi giá trị vẫn tăng parent revision, giống S1. Hai request cùng revision chỉ một thành công. Base PATCH S1 và mutation ngoại lệ cạnh tranh trên cùng parent, không hai bộ counter.
- Stale revision trả 409 trước thao tác ghi; client không tự tăng/retry. Nếu event bị xóa trong lúc sửa: client nhận conflict, reload parent/detail rồi nhận 404 và giữ phần nhập để người dùng xử lý; không biến thành create ngầm.
- List/detail/preview đọc snapshot nhất quán. Fingerprint là chuỗi opaque `sha256:<64 lowercase hex>`, hash schema/resolver version + full config DRAFT + revision + toàn event canonical (kể cả ngoài tháng/filter/page), sort ổn định. Không gồm clock request, page hoặc timestamp hiển thị để cùng nguồn có cùng fingerprint; không phải chứng nhận Payroll/activation.
- Không đưa Attendance/Leave/Payroll vào fingerprint S2A vì chưa dùng các nguồn đó. S2B sẽ có fingerprint timeline/activation riêng; không tái dùng hash DRAFT như token đã phê duyệt activation.

## 6. Monthly Preview DTO

```ts
type CalendarDayType = 'WORKDAY' | 'WEEKLY_OFF' | 'HOLIDAY' |
  'COMPENSATORY_OFF' | 'SWAPPED_OFF' | 'SWAPPED_WORKDAY' | 'NO_SCHEDULE' | 'UNRESOLVED'
type CalendarIssue = {
  code: 'NO_SCHEDULE' | 'EXCEPTION_BEFORE_EFFECTIVE_FROM' | 'EXCEPTION_DATE_CONFLICT' |
    'SWAP_BASE_DAY_INVALID' | 'WORK_OVERRIDE_BASE_DAY_INVALID' |
    'COMPENSATORY_SOURCE_INVALID' | 'COMPENSATORY_SOURCE_DUPLICATED' |
    'COMPENSATORY_OFF_REQUIRED' | 'COMPENSATORY_DATE_INVALID' | 'COMPENSATORY_TARGET_UNRESOLVED'
  severity: 'WARNING' | 'BLOCKER'
  scope: 'MONTH' | 'DRAFT'
  date: string | null
  exceptionIds: string[]
  message: string
}
type CalendarPreviewDay = {
  date: string
  weekday: number
  dayType: CalendarDayType
  isBaseWeeklyOff: boolean | null
  isWorkingDay: boolean | null
  shift: { startTime: string; endTime: string;
    breaks: [{ startTime: string; endTime: string }] } | null
  requiredWorkingMinutes: number | null
  scheduleVersionId: string | null
  exceptionIds: string[]
}
type CalendarPreviewDto = {
  mode: 'DRAFT_PROJECTION'
  versionId: string
  scheduleRevision: number
  effectiveFrom: string
  timezone: 'Asia/Ho_Chi_Minh'
  year: number
  month: number
  sourceFingerprint: string
  days: CalendarPreviewDay[]
  summary: {
    totalDays: number
    resolvedDays: number
    missingScheduleDays: number
    unresolvedDays: number
    isComplete: boolean
    requiredWorkingDays: number | null
    requiredWorkingMinutes: number | null
    partialRequiredWorkingDays: number
    partialRequiredWorkingMinutes: number
  }
  validation: { hasBlockingIssues: boolean; issues: CalendarIssue[] }
}
```

- Workday resolved: shift có giá trị; minutes = end − start − break, integer phút. Ngày nghỉ resolved: shift=null, isWorkingDay=false, minutes=0. Một ngày không bị trừ/cộng hai lần; SWAP là một event nhưng giải quyết hai ngày theo calendar.
- Ngày trước effectiveFrom: NO_SCHEDULE, source/shift/minutes/isWorkingDay/isBaseWeeklyOff=null, exceptionIds=[]; MONTH/WARNING. **Không lấy legacy hoặc lịch demo để lấp** preview DRAFT. Đây là thiếu coverage của range, không phải record vắng mặt.
- Source xung đột/không đủ để quyết định ngày: UNRESOLVED, isWorkingDay/shift/minutes=null, parent versionId vẫn được trả để truy vết, isBaseWeeklyOff theo lịch nền nếu có. Không chọn một event thắng rồi trả số có vẻ hợp lệ.
- Khi thiếu/sai COMP, ngày bù kỳ vọng nếu xác định được phải UNRESOLVED, không tự hiển thị là nghỉ đã xác nhận hoặc làm bình thường. Ngày target sai đã lưu cũng UNRESOLVED. Issue mang source/event liên quan; HR tự sửa, GET không tạo/dời COMP.
- `totalDays = resolvedDays + missingScheduleDays + unresolvedDays`. isComplete chỉ true khi hai loại thiếu/unresolved đều 0. Khi incomplete, hai tổng requiredWorking* là null; partial* chỉ cộng các ngày resolved và gắn nhãn chưa đầy đủ. Không thay null bằng 0. Có thể isComplete=true nhưng DRAFT khác tháng còn issue.
- Validation kiểm tra **toàn DRAFT**, nên issue ngày ngoài tháng vẫn có scope DRAFT và date thực tế. NO_SCHEDULE trong phần trước hiệu lực chỉ scope MONTH. hasBlockingIssues=true khi có bất kỳ BLOCKER; không phải `canActivate`. Thiếu/sai ngoại lệ sau base edit là BLOCKER. Issues sort ổn định theo scope/date/code/exception ids.
- Không trả `canActivate`, ACTIVE projection, salaryStandardDays, standardDays, payableDays, paidLeaveDays, OT hoặc tiền. Kiểm tra đầy đủ giới hạn lao động trước activate và nguồn ACTIVE thuộc S2B; có preview không đồng nghĩa lịch đã đủ điều kiện áp dụng.

## 7. Edge cases chuẩn để implement/test sau

- Leap year, năm 0001/0099/9999, cuối tháng/năm; hai nửa SWAP khác tháng/năm, không đếm trùng khi filter; timestamp input bị từ chối, browser/server timezone không làm trôi date.
- Hai ngày lễ trùng nghỉ tuần liền nhau: target bù phân bổ theo source date, không theo thứ tự nhập event; source/target ngoài tháng vẫn đọc được. Không tự tạo bù dù preview biết target.
- Ngày lễ trên workday không có bù tự động; HOLIDAY trên WEEKLY_OFF không biến thành hai ngày nghỉ. Duplicate source COMP bị từ chối; không thể tạo vòng vì source chỉ là HOLIDAY.
- Sửa/xóa HOLIDAY referenced, đổi kind PATCH, reverse/sửa cặp SWAP, overlap vào workDate của SWAP khác; rollback audit/CAS không để dở cặp.
- Đổi effectiveFrom/weekdays qua S1 khiến event cũ sai: giữ nguyên dữ liệu, preview issue/null, repair/delete được. Không siết ngược toàn S1 để che dependency mới.
- Page vượt cuối, filter không có kết quả, parent revision khác khi background refetch; preview toàn nguồn dù list limit=1. Fingerprint đổi khi chỉnh event ngoài tháng hoặc xóa/recreate, ổn định khi GET lại không đổi nguồn.
- Biên miền ngày không có ngày làm kế tiếp: COMPENSATORY_TARGET_UNRESOLVED, không sinh năm 10000/0000 hoặc tự lặp vô hạn. Kiểm tra ngày bằng date-only arithmetic; không cố định tháng 30 ngày hoặc 22/26 công.

## 8. Errors và hành vi client

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Thông tin ngoại lệ lịch làm việc không hợp lệ.",
  "details": { "exception.workDate": "Ngày làm bù phải là ngày nghỉ tuần theo lịch nền." }
}
```

| HTTP | Code | Message/điều kiện |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Body/query/date/time/text/source/nhánh payload sai; details field → một lỗi tiếng Việt, path dotted như exception.breaks.0.startTime. Unknown fields không silently ignore |
| 404 | WORK_SCHEDULE_NOT_FOUND | Không tìm thấy bản nháp lịch làm việc |
| 404 | WORK_CALENDAR_EXCEPTION_NOT_FOUND | Không tìm thấy ngoại lệ lịch làm việc; gồm id không thuộc parent |
| 409 | WORK_SCHEDULE_NOT_DRAFT | Chỉ được thao tác với bản nháp lịch làm việc |
| 409 | WORK_SCHEDULE_REVISION_CONFLICT | Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu |
| 409 | WORK_CALENDAR_EXCEPTION_CONFLICT | Ngày đã có ngoại lệ khác. Vui lòng kiểm tra lại lịch |
| 409 | WORK_CALENDAR_EXCEPTION_REFERENCED | Ngày lễ đang được liên kết với nghỉ bù. Vui lòng xử lý nghỉ bù trước |
| 500 | INTERNAL_SERVER_ERROR | Không thể xử lý lịch làm việc. Vui lòng thử lại sau; không raw DB error |

Nguồn HOLIDAY không tồn tại/không hợp lệ trong payload COMP là 400 tại exception.sourceHolidayDate; lỗi 404 dành cho parent/id URL. Với request hợp lệ nhưng DRAFT đang thiếu/không nhất quán do chỉnh cấu hình, GET preview trả **200 + issues**, không 500 và không biến thành calendar rỗng.

FE dùng Axios/API envelope thật, RHF/Zod theo contract và query-key factory work-schedule hiện có. Key list gồm versionId + mọi filter/page; detail gồm versionId/id; preview gồm versionId/year/month. Success invalidate parent list/detail, exception list/detail và preview của version liên quan, không refetch Attendance/Payroll hoặc gọi trùng invalidate + refetch. Mutation trả event DTO + parent revision, **không set partial DTO đè toàn bộ cached WorkScheduleDto**.

409 giữ form/giá trị/revision đang sửa, không auto overwrite hoặc retry revision mới. Reload chủ động GET detail ngoại lệ và GET parent S1 để đồng bộ form/cấu hình/revision, khóa thao tác trong reload. Nếu hai phản hồi không cùng revision, báo “Dữ liệu đã thay đổi trong lúc tải lại. Vui lòng thử lại.” và giữ input, không merge hai snapshot. Sau lỗi retry được; 404 khi reload không tự đóng/mất dữ liệu. Không lấy revision background mới gắn với payload cũ để vượt CAS.

Đổi tháng/DRAFT có cancel hoặc query key tách biệt, không hiện dữ liệu version cũ như version mới. Không polling, engine/holiday generation ở FE hoặc fixture trong production. UI tiếng Việt; unknown errors dùng fallback tiếng Việt, giữ auth interceptor.

## 9. Gate, workflow và verification

- **Người dùng đã duyệt Exact Contract v1 và cho phép triển khai Backend S2A.** Không hỏi lại ADMIN/timezone/atomic SWAP/không OT. Bản triển khai giữ v1, bổ sung diễn giải UUID query/URL và nguyên tắc không đoán target chưa xác định, không đổi endpoint hoặc business policy.
- S2B còn phải chọn representation OUT_OF_SCHEDULE và cách tổng hợp KPI/report sau compatibility review; không đổi enum/nullability chỉ từ tên cờ nghiệp vụ, không chặn S2A vì quyết định đó.
- Backend S2A READY: migration `20261022090000_add_calendar_exceptions`, service/repository/routes/audit + unit/HTTP/isolated PostgreSQL tests đã chạy. Migration localhost/schema diff/build PASS; không áp production. Evidence và lệnh chạy ở report, không coi mock tests là end-to-end UI.
- Đã chuẩn bị brief Anti Frontend/UI: chọn DRAFT/tháng, list/form ngoại lệ, SWAP một form, monthly preview/issues, loading/error/retry/409/focus/mobile theo shared components. Chưa tự triển khai Frontend hoặc nhắn/giao agent chạy. Codex sở hữu mọi logic/integration và review/sửa logic; người dùng QA/done S2A trước S2B.
- URL dự kiến `/admin/attendance/settings?tab=calendar` chưa có UI tab S2A. Không dùng route hiện có như evidence UI đã hoàn thành. **Không commit/push; người dùng tự commit sau QA PASS.**
