# S2 — Calendar Exceptions, Preview & Schedule Activation

Ngày: 22/10/2026. **Nghiệp vụ S2 đã xác nhận, S2-04 cho chấm công OUT_OF_SCHEDULE. S2A Exact Contract v1 APPROVED / Backend READY**, có [115 tests/build/PostgreSQL PASS và migration localhost](../codex-reports/attendance-payroll-s2a-backend.md); chưa Frontend/QA done. S2B schema/contract chưa chốt, chưa triển khai. S1 đã QA PASS/done; source commit `71f85081`, commit đóng QA `4628479c`. Tiến độ chính ở [checklist](attendance-payroll-mvp-slices.md).

Tài liệu này cụ thể hóa S2 trong [plan MVP](attendance-calculation-payroll-mvp.md), không thay [API S1 v1 đã triển khai](../modules/work-schedule.md). **API S2A lấy [Exact Contract v1](../modules/work-calendar-s2a.md) làm chuẩn**; không duy trì DTO sơ bộ song song. API/model S2B còn đề xuất; không suy nghiệp vụ đã xác nhận thành quyền tự code/migration.

## 1. Source thực tế và ranh giới

- `backend/src/modules/work-calendar/work-schedule.service.ts:90`: S1 chỉ list/detail/create/update DRAFT. Ngày hiệu lực chưa được áp; ACTIVE có trong enum nhưng chưa có activation API/resolver.
- `backend/prisma/schema.prisma`: WorkScheduleVersion + WorkScheduleAudit và CalendarException S2A; chưa activation snapshot hoặc lịch nguồn gắn với Attendance. Ngoại lệ DRAFT chưa thay nguồn check-in/out.
- `backend/src/modules/attendance/attendance.service.ts:57`: timezone legacy Asia/Bangkok, PRESENT khi giờ check-in <=08:00:00, LATE khi sau đó. `checkIn` tạo một record/người/ngày từ giờ server; `checkOut` cập nhật record ngày hiện tại, không xét lịch/ngày nghỉ hoặc về sớm.
- `backend/src/modules/attendance/attendance-adjustment.service.ts:214`: approve tính lại status bằng cùng cutoff cố định; chưa có nguồn lịch tại ngày cần sửa. Đã có transaction, stale guard, audit request và ownership để reuse.
- `backend/src/modules/dashboard/dashboard.service.ts:100`: Employee Dashboard có todayAttendance, chưa có calendar context. `EmployeeAttendanceWidget.tsx` chỉ dựa workingStatus, chưa biết ngày nghỉ.
- Frontend reuse `features/work-schedule/`, query-key factory, schema/form/dialog/calendar S1; shared DatePicker/ConfirmDialog/Skeleton/StatusBadge. Không tạo design system hoặc Payroll Engine mới.

Đã chốt, không hỏi lại: một lịch chung, ADMIN cấu hình, Asia/Ho_Chi_Minh, date YYYY-MM-DD, HH:mm, ISO weekdays 1–7, một nghỉ giữa ca, demo 08–17/nghỉ 12–13, chưa ca đêm/ca xoay/OT; không sửa snapshot/Payroll lịch sử hoặc unlock kỳ LOCKED. S2 chưa tính payableDays, salaryStandardDays, khấu trừ, tiền OT hoặc lương.

## 2. Quyết định người dùng đã xác nhận — không hỏi lại

| ID | Gate liên quan | Quyết định đã xác nhận |
| --- | --- | --- |
| S2-01 | A0-03/04: nguồn lễ và nghỉ bù | ADMIN nhập ngày dương lịch theo nguồn hợp lệ từng năm, lưu tên/căn cứ/lý do; không hardcode lịch lễ lặp vĩnh viễn, đổi âm lịch hay lấy lịch công chức áp cho mọi doanh nghiệp. Nghỉ bù do lễ trùng nghỉ tuần liên kết nguồn lễ, HR xác nhận ngày hợp lệ; chưa tự sinh/ghi vào DB. Không dùng nghỉ bù để thay nghĩa vụ OT. |
| S2-02 | A0-04: ngoại lệ và hoán đổi | HOLIDAY, COMPENSATORY_OFF, SWAP và WORK_OVERRIDE. SWAP là một cặp ngày atomic, đổi ngày làm sang ngày nghỉ tuần với cùng thời lượng/ca nguồn, không ghi hai request độc lập. WORK_OVERRIDE chỉ đổi giờ của ngày vốn làm việc. Chặn overlap/ghi đè lễ hoặc nghỉ bù; việc không hỗ trợ trả issue, không tự chọn ưu tiên thắng. |
| S2-03 | A0-03: thời điểm activate/hồi tố | effectiveFrom sớm nhất là ngày mai theo timezone công ty; chỉ nối sau effectiveFrom ACTIVE cuối cùng, không chen lịch/hồi tố. ACTIVE và ngoại lệ đã activate bất biến; thay đổi bằng draft mới. Chưa sửa/hủy lịch future đã activate. Đây là giới hạn MVP, không phải quy định pháp luật; không mặc nhiên backfill lịch sử. |
| S2-04 | A0-03: chưa có lịch/ngày nghỉ — ĐÃ THAY ĐỔI | Trước lịch ACTIVE đầu tiên giữ legacy. Ngày nghỉ/ngày ngoài lịch **vẫn cho check-in/check-out**, giữ ownership/unique người-ngày và flow kiểm tra hiện có. Backend lưu raw và đánh dấu **OUT_OF_SCHEDULE** để HR đối soát; không tự tính công hưởng lương/OT, không gán là đi muộn chỉ vì không có ca. Đây là phân loại nghiệp vụ, chưa quyết định sẽ thêm enum/field/nullability nào. Không tự tạo Attendance vắng mặt/ngày nghỉ. |
| S2-05 | A0-05 phần cần S2: biên đi muộn và sửa công | Giữ so sánh chính xác tới giây: bằng startTime:00 là PRESENT, sau đó là LATE; chưa grace/rounding/phạt tiền. Approve điều chỉnh dùng snapshot lịch gốc của record, hoặc lịch có hiệu lực đúng attendanceDate nếu bổ sung ngày thiếu. Ngày legacy vẫn cutoff 08:00; không dùng lịch hôm nay cho quá khứ. |
| S2-06 | A0-02: giới hạn trước activate | MVP một lịch chung/ca ban ngày theo chế độ ngày, tối đa 8h thực làm/ngày, 48h/tuần, nghỉ giữa giờ và nghỉ tuần phù hợp; chưa chế độ tuần 10h/ngày, ca liên tục/đối tượng đặc thù. Kiểm tra tuần giao tháng/năm và swap trước activate S2B; không áp ngược vào lưu DRAFT S1. Cấu hình không hỗ trợ có blocker, nhưng raw check-in ngoài lịch không bị cấm hoặc tự được công nhận OT. |

ADMIN đã được xác nhận là người cấu hình/xác nhận lễ/nghỉ bù theo nguồn hợp lệ. Hệ thống chỉ phản ánh ngoại lệ đã nhập, **không khẳng định danh sách rỗng là năm không có ngày lễ**. Đủ nguồn lịch lễ theo kỳ vẫn là gate trước tính/khóa công S3–S6, không biến S2A preview thành chứng nhận Payroll. Không tự thêm calendar expiry, API lịch lễ ngoài hoặc công hưởng lương. Không còn blocker nghiệp vụ riêng S2A; các chi tiết API/edge case được chốt trong contract v1 để review trước implementation.

Các phần A0-04 mẫu số lương, A0-05 quy đổi công/làm tròn, A0-06 quyền phép, A0-07 employment, A0-08/09 khóa kỳ và A0-10 thuế/BH vẫn OPEN cho slice sau. S2 đã chốt chưa grace cho phân loại đi muộn; không hỏi lại như blocker S2A. Không yêu cầu chốt tất cả để làm calendar S2, cũng không ngầm đóng chúng.

### Ranh giới pháp lý / nguồn tham khảo

Nghỉ bù do lễ trùng nghỉ tuần khác hoán đổi lịch và nghỉ sau làm thêm; không dùng một nhãn để bỏ quyền lợi OT. [Giải đáp Bộ LĐTBXH trên Cổng Chính phủ](https://baochinhphu.vn/can-cu-xac-dinh-thoi-gian-lam-them-gio-102250116110252383.htm).

Điều 105/109/111/112 có quy định giờ, nghỉ giữa giờ, nghỉ tuần/lễ; ca liên tục có cách tính nghỉ khác. Chế độ theo tuần có thể khác chế độ theo ngày, nên giới hạn MVP không được quảng bá thành luật duy nhất. Tham khảo [VBHN 125/2025 trên Cổng Chính phủ](https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/125-vbhn-vpqh.pdf). Phải kiểm tra quy định tại kỳ áp dụng; không coi đây là chứng nhận tuân thủ đầy đủ hay cho HR tắt quyền bắt buộc.

## 3. Resolver và tác động Attendance đề xuất

1. **Một resolver Backend**: ngày công ty → version ACTIVE có effectiveFrom gần nhất <= ngày → ca/ngày tuần → ngoại lệ hợp lệ. Preview, check-in và approve adjustment dùng chung, không nhân bản logic ở frontend.
2. Nhiều version có thể mang ACTIVE để giữ timeline; không có nghĩa tất cả cùng áp dụng. Version future là đã phê duyệt/chờ hiệu lực. Khoảng hiệu lực suy từ version kế tiếp; không sửa config lịch cũ để “đổi lịch đang active”.
3. HOLIDAY trên ngày vốn nghỉ tuần vẫn giữ cả bằng chứng nghỉ tuần/lễ; requiredWorkingMinutes=0, không trừ hai lần. COMPENSATORY_OFF phải có nguồn lễ đủ điều kiện và đúng ngày làm kế tiếp hợp lệ; xử lý chuỗi nghỉ/giao năm bằng resolver, chặn nguồn trùng hoặc vòng tham chiếu.
4. SWAP được lưu/cập nhật/xóa nguyên cặp. offDate là ngày làm hợp lệ, workDate vốn nghỉ tuần; dùng ca/thời lượng offDate trước hoán đổi. Kiểm tra cả hai ngày, tuần liền kề và nguồn lễ/nghỉ bù. Cặp qua ranh giới version nếu không bảo toàn được quan hệ phải chặn rõ, không mất nửa cặp.
5. WORK_OVERRIDE phải giữ một nghỉ hợp lệ trong cùng ngày, không tự biến ngày lễ/tuần thành ngày làm. Overlap với ngoại lệ khác trả conflict để HR đối soát, không áp thứ tự âm thầm che luật.
6. Check-in giữ giờ server/ownership/unique người-ngày. Ngày làm có ca resolved: đi muộn theo giờ bắt đầu, chưa grace. Ngày nghỉ/ngoài lịch vẫn nhận raw punch và OUT_OF_SCHEDULE để HR đối soát; **bỏ đề xuất ATTENDANCE_NOT_SCHEDULED**. Không tự cho công/OT hoặc phân loại đúng giờ/đi muộn khi không có ca. Checkout vẫn theo record đang mở, không cấm vì lịch/ngày nghỉ.
7. Cần reference/snapshot nguồn lịch để giữ lịch sử, nhưng **chưa chọn schema Attendance** trước review tương thích ở mục 7. Không backfill/reclassify hàng loạt. Approve bổ sung ngày nghỉ ghi raw và giữ phân loại ngoài lịch, không tạo công OT; reject không ghi. Legacy giữ behavior cũ; ngày có lịch dùng đúng nguồn của ngày/record, không lấy lịch hôm nay sửa quá khứ.
8. GET lịch sử/report/Excel đọc status đã lưu, không join lịch mới để tính lại quá khứ. Dashboard không tự đổi nghĩa PRESENT/LATE thành công hưởng lương. Kỳ LOCKED vẫn không unlock; guard ghi nguồn của S6 là gate bắt buộc trước release khả năng khóa.

## 4. Contract S2A và đề xuất activation S2B

### S2A — nguồn contract duy nhất

[Exact Contract S2A v1](../modules/work-calendar-s2a.md) đặc tả 6 endpoint: list/detail/create/replace/delete ngoại lệ theo version và preview tháng bắt buộc versionId DRAFT. Payload phân biệt HOLIDAY/COMPENSATORY_OFF/SWAP/WORK_OVERRIDE; CAS/audit cùng revision lịch nền, SWAP atomic, preview không phụ thuộc pagination. Không có ACTIVE projection, timeline, activation hoặc canActivate trong S2A. Giữ nguyên bốn API S1.

### S2B — chỉ đề xuất, chưa Exact Contract

Base `/api`, ADMIN-only; auth hiện có giữ nguyên. Hai API dự kiến:

| Method / path | Request chính | Response dự kiến |
| --- | --- | --- |
| GET `/work-calendar/timeline` | page/limit | 200 `{data:ActiveTimelineDto[],meta}`; effectiveTo exclusive/null, sort effectiveFrom giảm dần |
| POST `/work-calendar/versions/:id/activate` | `{expectedRevision,sourceFingerprint,reason}` | 200 `{data:{schedule,activation}}`; immutable snapshot, effectiveFrom, activatedAt/by |

S2B phải bổ sung preview/validation cho activation dựa trên cả DRAFT và timeline ACTIVE; không dùng fingerprint S2A như bằng chứng đủ điều kiện activate. Cần đặc tả DTO/errors riêng khi mở S2B, không mở PATCH S1 cho ACTIVE.

Server validate lại nguồn/hiệu lực, serialize activation cấp công ty và kiểm tra unique effectiveFrom/CAS/fingerprint/ngày hiện tại trong transaction. Lưu immutable snapshot + audit. Ngoại lệ/cặp của version trước bị cắt bởi hiệu lực mới phải được khai báo lại đầy đủ hoặc trả blocker, không mất nửa SWAP/ngày lễ/nghỉ bù. Source thay sau preview trả 409, không auto retry. Kiểm tra race/qua nửa đêm; không ghi lại Attendance/Payroll lịch sử. Các chi tiết này là gate contract S2B, chưa triển khai.

### Employee context, không thêm polling

Đề xuất thêm field additive `data.todaySchedule` vào GET `/api/dashboard/employee`, giữ mọi field cũ: `{date,source:'LEGACY'|'ACTIVE',scheduleVersionId,dayType,startTime,endTime,canCheckIn,canCheckOut,message}` (nullable fields khi legacy/không có lịch). Chỉ cung cấp ngày hiện tại cho EMPLOYEE, không mở API quản lý calendar cho employee.

Widget nhận props từ container để giải thích OUT_OF_SCHEDULE và vẫn cho chấm công ngoài lịch, không gọi API riêng/polling. canCheckIn/canCheckOut dựa trạng thái record/quyền, **không false chỉ vì ngày nghỉ**. Representation flag/punctuality chưa chốt; schema/DTO/dashboard/report phải duyệt cùng S2B sau compatibility review. Check-in/out success vẫn invalidate dashboard/history hiện có, không đổi thành OT/công được trả lương.

## 5. Storage và phạm vi triển khai tối thiểu đề xuất

- Reuse WorkScheduleVersion/WorkScheduleAudit, thêm CalendarException gắn version; với SWAP nên có các ngày chiếm dụng riêng với unique(versionId,date) hoặc kiểm tra giao ngày dưới parent CAS/lock. Chốt thiết kế vật lý khi duyệt contract, không chỉ unique offDate rồi bỏ lọt workDate trùng.
- Activation snapshot immutable chứa config + exceptions + schema/fingerprint; metadata activatedAt/by. Audit thêm action cho ngoại lệ/activate. Snapshot có thể nằm trong version và audit, không tự tạo framework event sourcing.
- S2A đã triển khai storage ngoại lệ/audit theo contract duyệt, không migration Attendance. Reference/snapshot/classification S2B còn phải quyết định sau compatibility review; không tự thêm OUT_OF_SCHEDULE vào enum hoặc gán PRESENT giả để tương thích. Daily resolver preview được reuse về sau; legacy chưa đổi.
- S2A chỉ migration additive localhost đã được phép; không seed lễ/demo ACTIVE, cron, production deploy/migration, đổi env hoặc tạo template tiền/công.

## 6. Chia S2 thành phần nhỏ để QA theo vertical slice

| Phần | Codex Backend/API/tests | Anti Frontend sau Backend READY | Review/QA và URL dự kiến |
| --- | --- | --- | --- |
| S2A — Ngoại lệ DRAFT + calendar preview | Backend READY: resolver preview, CRUD/CAS/audit/tests/local migration; **chưa activate/đổi check-in** | [Brief](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md): tab calendar cạnh S1, DRAFT/tháng, list/dialog ngoại lệ, SWAP một form, preview/issues, giữ input 409 và cache revision; chưa Frontend | Codex review/sửa mọi logic; người dùng QA và `done` S2A trước S2B. `/admin/attendance/settings?tab=calendar` là URL đề xuất, chưa có tab này |
| S2B — Activation + Attendance integration | Sau S2A QA/done: review schema/status/KPI trước migration, timeline/snapshot/activation/race; check-in/out/approve dùng nguồn đúng ngày, OUT_OF_SCHEDULE không cấp công/OT; dashboard/report theo contract duyệt | Confirm activate/lịch hiệu lực; widget vẫn cho chấm công ngày nghỉ, nhãn ngoài lịch/cần đối soát, không tự tính lịch hoặc thêm polling | Codex review, người dùng QA/done S2B. Cùng settings page và `/employee/dashboard`, `/employee/attendance`, `/admin/attendance/adjustments` |

Giữ workflow **Codex Backend/logic → Anti Frontend/UI → Codex review → người dùng QA/done** ở từng slice; Codex vẫn sở hữu logic/state/validation/API/concurrency và chủ động sửa kể cả frontend. Chưa giao Anti, không làm S2B trước khi S2A QA/done. **Không commit/push; người dùng tự thực hiện sau QA PASS.**

### Acceptance/tests và evidence theo slice

- S2A Backend đã có [evidence](../codex-reports/attendance-payroll-s2a-backend.md): tháng nhuận/cuối năm, holidays trên workday/weekend, chuỗi nghỉ bù, SWAP cross-month/year, overlap cả workDate, source/break validation, race cùng revision/audit rollback; preview không ghi, đọc toàn nguồn/fingerprint và snapshot nhất quán. UI/integration FE và người dùng QA vẫn chờ, không suy thành slice DONE.
- S2B: activate ngày mai/giữa tháng, ngày quá khứ/hôm nay bị từ chối theo đề xuất, duplicate effectiveFrom, hai activation race, preview stale, snapshot bất biến, không bỏ mồ côi cặp/ngoại lệ khi nối version; revalidate ngày khi qua nửa đêm.
- Attendance S2B: trước/sau first activation, 08:00:00/08:00:01 và giờ ca khác; ngày nghỉ check-in/out thành công với OUT_OF_SCHEDULE, không tự tạo công/OT; duplicate/ownership vẫn kiểm tra; late/present không bị cộng giả, report/Excel/dashboard không rơi mất record. Lịch theo ngày không theo ngày approve; snapshot/legacy không đổi hàng loạt, reject không ghi. S1/S2A DRAFT không tác động Attendance.
- Regression: S1 đủ CRUD/409/cache, Attendance adjustment/report/Excel và Employee Dashboard, ADMIN/EMPLOYEE auth; API envelopes/errors/typecheck/tests/lint/build. Frontend keyboard/focus/loading/retry/mobile/confirm phải có evidence, không đánh PASS từ source.
- Tiếp theo: Backend S2A READY/[brief](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) → người dùng giao Anti Frontend/UI → Codex review → người dùng QA/done. **Chưa S2B, không commit/push hoặc tự triển khai Frontend.** Acceptance activation/Attendance S2B chưa chạy.

## 7. Compatibility review Attendance — phải hoàn tất lựa chọn trước S2B schema

Đã đọc source qua CodeGraph và Prisma schema, không thay code:

| File/vị trí | Ràng buộc hiện tại / rủi ro nếu chỉ thêm enum mới |
| --- | --- |
| `backend/prisma/schema.prisma:159` và enum AttendanceStatus | Attendance.status bắt buộc, chỉ PRESENT/LATE, unique employeeId/attendanceDate. Không thể đưa null/OUT_OF_SCHEDULE vào DTO/DB mà không có thay đổi tương thích có chủ đích |
| `backend/src/modules/attendance/attendance.service.ts:59` và `attendance-adjustment.service.ts:214` | Hàm cũ luôn trả PRESENT/LATE theo 08:00; chỉ sửa check-in mà bỏ approve sẽ làm mất flag ngoài lịch khi chỉnh giờ |
| `backend/src/modules/attendance/attendance.repository.ts:117` | Monthly report chỉ cộng PRESENT/LATE và **totalRecords = present + late**; thêm status thứ ba đơn lẻ sẽ làm mất record khỏi tổng. missingCheckOut vẫn đếm toàn bộ nên có thể lớn hơn totalRecords |
| `backend/src/modules/attendance/attendance-report.types.ts`, `attendance-report-excel.generator.ts:7` | DTO/Excel chỉ có tổng/đúng giờ/đi muộn/chưa checkout; không có cột ngoài lịch/cần đối soát |
| `backend/src/modules/dashboard/dashboard.repository.ts:71` | Employee summary chỉ count hai status. todayAttendance trả status; chưa có calendar/classification context |
| `backend/src/modules/dashboard/admin-dashboard.service.ts:59` | Chart total cộng mọi group nhưng present/late chỉ hai enum; thêm enum không đồng bộ sẽ khiến total khác tổng series hiện có |
| `frontend/src/features/attendance/types/attendance.types.ts:1` | Union chỉ PRESENT/LATE, status không nullable; nhiều consumers dùng union này |
| `frontend/src/pages/admin/attendance/AttendanceListPage.tsx:50`, Employee AttendanceHistoryPage, employee-dashboard.mappers.ts | Filter/badge/tone chỉ hai status; mapper Dashboard có thể hiện raw status lạ. OUT_OF_SCHEDULE cần nhãn tiếng Việt “Ngoài lịch làm việc” và “Cần đối soát”, không render English hoặc tô là đúng giờ |

**Kết luận:** OUT_OF_SCHEDULE là nghiệp vụ đã chốt, **không đồng nghĩa đã chọn thêm giá trị vào AttendanceStatus**. Không thể giải quyết bằng enum migration đơn lẻ hoặc flag ẩn nhưng vẫn gán PRESENT/LATE giả cho ngày không có ca.

Trước Backend S2B, Codex phải đề xuất/chốt: enum kết hợp hay schedule assessment tách punctuality; nullability/legacy adapter; cách đếm raw total, ngoài lịch và KPI punctuality; filter/export/dashboard/approve/snapshot tương thích. Raw ngoài lịch phải được giữ trong lịch sử và tổng raw, không tự trả công/OT. S2A không cần các lựa chọn vật lý này, nên **không lấy chúng làm blocker S2A**.
