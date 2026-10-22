# Kế hoạch Attendance Calculation → Payroll Configuration MVP

Ngày cập nhật: 22/10/2026. S1 đã có Backend/Frontend và re-review; trạng thái QA/done lấy từ [checklist hiện hành](attendance-payroll-mvp-slices.md). Phần tính công/khóa/Payroll tiếp theo vẫn là kế hoạch, chưa triển khai.

Workflow hiện hành (cập nhật 22/10): triển khai **vertical slices**, không làm hết backend trước frontend. Codex phụ trách nghiệp vụ/Prisma/backend/contract, mọi logic/state/data flow/validation/API integration/concurrency ở cả frontend/backend, tests tương ứng và review tích hợp; chủ động sửa lỗi logic kể cả trong frontend. Anti phụ trách UI/UX, CSS/layout/responsive/visual và tests giao diện; lỗi hỗn hợp được Codex sửa logic trước rồi mới bàn giao visual. Người dùng QA localhost và xác nhận `done` rồi mới chuyển slice. Chi tiết scope, API đề xuất, owner, test, URL và tiến độ tại [checklist slices](attendance-payroll-mvp-slices.md); context bắt đầu cho Anti tại [ANTIGRAVITY_CONTEXT](../agents/ANTIGRAVITY_CONTEXT.md).

Tài liệu này cập nhật [audit hiện trạng](../codex-reports/payroll-configuration-mvp-audit.md). Quyết định mới thay thế đề xuất cũ làm Payroll Configuration trước, nhận công nhập tay rồi mới tự động hóa. Sau xác nhận S0, Backend/Prisma/migration S1 đã triển khai theo [contract v1](../modules/work-schedule.md), [evidence](../codex-reports/attendance-payroll-s1-work-schedule-drafts.md). Ngoài bốn endpoint draft S1, các model/endpoint tính công và Payroll bên dưới còn là đề xuất, không phải API đã có.

## 1. Quyết định đã chốt và giới hạn

- Hoàn thiện Attendance Calculation, đối soát và khóa kỳ trước Payroll Configuration.
- Có lịch demo T2–T6, 08:00–17:00, nghỉ 12:00–13:00. Đây là dữ liệu cấu hình, không phải hằng số của engine; giờ làm sau khi trừ nghỉ là 480 phút/ngày đối với mẫu này.
- HR cấu hình ngày làm việc, giờ vào/ra, giờ nghỉ, ngày hiệu lực, ngày lễ và ngoại lệ. Không hardcode 22/26 công.
- Một lịch chung, một ca ban ngày/ngày. Chưa hỗ trợ ca đêm, ca xoay, OT; không suy diễn thời gian ngoài ca thành OT.
- Backend tổng hợp từ Attendance, Leave APPROVED và điều chỉnh đã duyệt; đánh dấu dữ liệu thiếu/bất thường. HR đối soát, chỉnh sửa có lý do, xác nhận và khóa kỳ.
- Payroll MONTHLY sử dụng `monthlySalary × payableDays / standardDays`. Nghỉ hưởng lương hợp lệ được tính; không tự động phạt tiền đi muộn.
- Khóa kỳ phải bảo vệ cả công và đầu vào lương lịch sử, không chỉ disable nút ở frontend.
- **LOCKED không unlock trực tiếp trong MVP**, kể cả khi chưa phát hành Payroll. Sai sót sau khóa được ghi thành yêu cầu điều chỉnh riêng có lý do/audit để xử lý theo quy trình riêng; không sửa snapshot và không tự thay Payroll đã phát hành. Cách xử lý tiếp theo của yêu cầu chưa đồng nghĩa đã được duyệt.
- Giữ định hướng Salary Template mặc định có thể clone, rule có cấu trúc, một Payroll Engine dùng chung; phụ cấp/thưởng/khoản cộng trừ tùy chọn. DAILY/HOURLY là khả năng mở rộng sau luồng MONTHLY đầu tiên, chưa tự mở rộng phạm vi tính công.
- Node/Prisma/PostgreSQL và frontend hiện có; không cần cron, polling mới hay dịch vụ trả phí. Quyền cấu hình lịch S1 đã chốt ADMIN, một lịch chung công ty; quyền đối soát/khóa/tiếp nhận sau khóa chưa suy ra từ quyền cấu hình.

## 2. Điểm nối với hệ thống hiện tại

| Source hiện có | Tái sử dụng / điều chỉnh dự kiến |
| --- | --- |
| `backend/prisma/schema.prisma` | Giữ Attendance raw, LeaveRequest, AttendanceAdjustmentRequest và Payroll legacy; thêm cấu hình, kết quả tính, lịch sử đối soát và snapshot |
| `backend/src/modules/attendance/attendance.service.ts` | Giữ ownership và giờ server; thay cutoff 08:00 cố định bằng lịch có hiệu lực khi bật lịch mới. Status PRESENT/LATE cũ không được dùng làm payableDays |
| `attendance-adjustment.service.ts` trong cùng module | Reuse duyệt có transaction và stale guard; thêm kiểm tra kỳ công tại thời điểm ghi. Điều chỉnh APPROVED đã cập nhật Attendance: không cộng thêm lần thứ hai |
| `attendance-report.service.ts`, `attendance.repository.ts` | Reuse chọn kỳ và phạm vi truy vấn; giữ báo cáo đếm punch hiện có, không âm thầm đổi ý nghĩa API/Excel thành công hưởng lương |
| `backend/src/modules/leave-request/leave-request.service.ts` | Reuse đơn/approver/reviewer; bổ sung kiểm tra giao khoảng, căn cứ hưởng lương và tác động lên kỳ công. ANNUAL/SICK/OTHER hiện chưa đủ chứng minh số ngày được hưởng lương |
| `backend/src/modules/payroll/payroll.service.ts`, `payroll.repository.ts` | Giữ Decimal và legacy; luồng mới đọc kỳ công LOCKED. Bổ sung atomic status/revision guard thay precheck DRAFT rồi update theo id |
| `frontend/src/features/attendance/`, `features/payroll/` | Reuse API → type → query/mutation, query-key factory, giữ dữ liệu cũ khi refetch và invalidation đúng kỳ |
| `frontend/src/pages/admin/attendance/AttendanceMonthlyReportPage.tsx`, `pages/attendance-adjustments/components/` | Reuse chọn tháng, detail dialog, pending/error/retry, lịch sử duyệt; thêm bảng đối soát riêng, không đổi báo cáo cũ khi chưa duyệt contract |
| `frontend/src/components/ui/confirm-dialog.tsx`, shared DatePicker, shadcn Table/Dialog/Skeleton | Reuse confirmation khóa kỳ, form cấu hình/đối soát, desktop table/mobile cards; không tạo design system mới |

S1 hiện có model/API cấu hình lịch DRAFT và audit; chưa có activate/ngày lễ, công chuẩn/công hưởng lương, trạng thái khóa kỳ hoặc ngày kết thúc làm việc. Báo cáo tháng hiện bỏ qua người không có Attendance; bộ tính mới phải bắt đầu từ danh sách nhân viên thuộc kỳ, không bắt đầu từ danh sách punch. Không lấy số phép của Dashboard làm số ngày nghỉ hưởng lương.

## 3. Định nghĩa và pipeline tính công

### Đơn vị và mẫu số phải rõ

- `scheduledWorkMinutes`: thời gian cần trực tiếp làm theo lịch của ngày, sau nghỉ giữa ca và ngoại lệ.
- `workedMinutes`: giao của khoảng check-in/out hợp lệ với các khoảng làm việc; không tính nghỉ trưa hoặc giờ ngoài ca. Lưu raw riêng; một cặp punch không chứng minh mọi phút đều thực sự làm việc.
- `lateMinutes`, `earlyLeaveMinutes`: số phút chênh lệch theo lịch; tách khỏi số tiền và chính sách quy đổi công. Grace period, giây lẻ và làm tròn còn cần xác nhận.
- `actualWorkedDays`: công làm thực tế sau chính sách quy đổi được duyệt; không đồng nghĩa PRESENT+LATE.
- `paidLeaveDays`, `paidHolidayDays`, `unpaidDays`: các phần được phân loại, không cộng trùng thời gian làm/nghỉ.
- `payableDays`: tổng đơn vị hưởng lương đã đối soát. `standardDays`: mẫu số theo lịch và chính sách quy đổi của kỳ; không phải số người đã check-in.
- Ngày có dữ liệu thiếu phải có `null/UNRESOLVED` và issue, không thay bằng 0. 0 chỉ là kết quả đã đủ căn cứ hoặc HR đã xác nhận.

**Cần duyệt cách xử lý ngày lễ trước khi viết công thức công:** đề xuất tách `requiredWorkingDays` (ngày phải đi làm) và `salaryStandardDays` (mẫu số, API Payroll dùng tên standardDays). Ví dụ minh họa có 22 ngày theo lịch tuần, trong đó 1 lễ hưởng lương: có thể dùng mẫu số 22, công đủ điều kiện là 21 đi làm + 1 lễ = 22. Không được dùng mẫu số 21 nhưng tử số 22. Đây là phương án đề xuất, chưa coi là chính sách đã chốt; nghỉ bù/hoán đổi phải có quy tắc riêng và ví dụ được duyệt.

### Pipeline duy nhất ở backend

1. Xác định tháng theo timezone công ty và tập nhân viên thuộc kỳ, bao gồm người không có punch. Đọc ngày vào/nghỉ việc; dữ liệu chưa rõ phải đưa vào đối soát.
2. Sinh từng ngày từ lịch có hiệu lực tại ngày đó, áp ngoại lệ đã duyệt, phân biệt ngày làm/nghỉ tuần/lễ/nghỉ bù/hoán đổi. Thiếu lịch lễ đã xác nhận cho kỳ thì chưa đủ điều kiện khóa.
3. Đọc toàn bộ nguồn trong kỳ bằng truy vấn theo lô, không dùng list phân trang. Đơn phép giao kỳ phải được cắt theo ngày/khoảng làm việc, không chỉ lọc createdAt.
4. Attendance sau điều chỉnh APPROVED là giờ đầu vào hiện tại; giữ request làm bằng chứng. PENDING không sửa giờ, nhưng có thể là blocker chưa đối soát.
5. Tính giao khoảng punch/ca và nghỉ; phát hiện thiếu giờ, giờ không hợp lệ, làm ngày nghỉ/lễ, trùng phép hoặc nhiều phép chồng nhau. Không tự chọn một nguồn để che xung đột.
6. Quy đổi sang công theo policy version đã duyệt. Phép APPROVED còn phải có căn cứ hưởng lương; SICK không tự đồng nghĩa doanh nghiệp trả đủ lương, OTHER không tự động là có lương. Ngày lễ không tự tiêu phép năm.
7. Lưu kết quả đề xuất, nguồn và issue. HR sửa dữ liệu gốc qua flow điều chỉnh sẵn có hoặc đối soát công bằng lý do/căn cứ riêng; không sửa tổng tháng trực tiếp để che lỗi từng ngày.
8. Tính lại và kiểm tra revision; HR xác nhận rồi khóa. Payroll chỉ nhận snapshot LOCKED và không có blocker, không tự gọi lại raw để tính kỳ đó.

Case chưa hỗ trợ (ca qua ngày, OT, lịch không xác định) phải hiện issue rõ ràng. Không tự bỏ các giờ đó, gán thành vắng hay coi đã xử lý xong; cách giải quyết được ghi nhận trước khi khóa. Khoảng phút quy đổi thành một ngày, nửa ngày hoặc tỷ lệ liên tục là quyết định ở mục 8, chưa tự chọn.

## 4. Prisma schema đề xuất theo phase

S1 đã implement WorkScheduleVersion và WorkScheduleAudit; schema/migration thực tế cùng contract v1 có ưu tiên hơn đề xuất trước. Các bảng kỳ công/ngoại lệ/policy bên dưới vẫn là thiết kế để review, **không phải schema hoàn chỉnh có thể migrate ngay**. FK người thao tác trỏ `User.id`, nhân viên trỏ `Employee.id`; không cascade xóa snapshot/audit. Trường `Json` có schema/version và backend validation, không chứa công thức tự do.

| Model / phase | Field chính và Prisma type dự kiến | Ràng buộc / trách nhiệm |
| --- | --- | --- |
| `WorkScheduleVersion` / S1 đã có | `id String @db.Uuid`, `version Int @default(autoincrement()) @unique`, `revision Int`, `status DRAFT/ACTIVE`, `effectiveFrom DateTime @db.Date`, `timezone String`, `weekdays Int[]`, `startMinute/endMinute/breakStartMinute/breakEndMinute Int`, `createdBy/updatedBy`, timestamps | Một lịch chung, không assignment per employee. S1 chỉ DRAFT và một nghỉ; API dùng breaks array một interval, DB scalar phút thay đề xuất breaks JSON cũ. Version do sequence chống race; PATCH guard status/revision. ACTIVE chỉ được enum dự trữ; metadata/rule activate và unique active effectiveFrom là việc S2 |
| `WorkScheduleAudit` / S1 đã có | `id`, `scheduleVersionId`, `action CREATE/UPDATE`, `before Json?`, `after Json`, `actorId`, `createdAt` | Audit chuyên biệt cho draft, FK restrict, ghi cùng transaction; không tạo framework audit chung trước khi có use case kỳ công. Không có API sửa/xóa/đọc audit trong S1 |
| `CalendarException` / S2 | `id`, `date DateTime @db.Date`, `kind` enum, `details Json`, `replacementForDate DateTime? @db.Date`, `reason String`, `revision Int`, `updatedBy`, timestamps | Một cấu hình ngoại lệ có hiệu lực/ngày (`date` unique); kind phân biệt lễ, nghỉ bù, đổi ngày làm/nghỉ, đổi giờ. Details có discriminated schema và căn cứ hưởng lương, không bool tùy ý mâu thuẫn. Bản trước/sau vào audit; kỳ đã khóa giữ snapshot |
| `AttendanceCalculationPolicyVersion` / S3 | `id`, `version Int`, `revision Int`, `effectiveFrom DateTime @db.Date`, `status`, `ruleSchemaVersion Int`, `rules Json`, người kích hoạt/timestamps | Lưu cách quy đổi công, mẫu số, làm tròn, grace, phân loại nghỉ theo policy được duyệt. Active bất biến, không mặc định mọi ANNUAL/SICK là đủ quyền. Version ngày nào áp ngày đó; không rewrite lịch sử |
| `AttendancePeriod` / S4 | `id`, `year Int`, `month Int`, `status DRAFT/CONFIRMED/LOCKED`, `revision Int`, `sourceFingerprint String?`, `engineVersion String?`, `calendarReviewSnapshot Json?`, `calculatedAt`, `confirmedBy/At`, `lockedBy/At` | `@@unique([year, month])`; tháng hợp lệ. CalendarReviewSnapshot giữ lịch/ngoại lệ và xác nhận đủ dữ liệu lễ. Revision tăng khi tính lại/đối soát/mất hiệu lực xác nhận. Lock một kỳ toàn doanh nghiệp là đề xuất cần duyệt |
| `AttendancePeriodEmployee` / S4 | `id`, `periodId`, `employeeId`, `employeeSnapshot Json`, `standardDays Decimal? @db.Decimal(10,6)`, `actualWorkedDays Decimal?`, `paidLeaveDays Decimal?`, `paidHolidayDays Decimal?`, `payableDays Decimal?`, `unresolvedCount Int`, `summarySnapshot Json` | Unique periodId+employeeId. Các số công dùng cùng Decimal(10,6) dự kiến; chưa biết là null. Snapshot giữ phạm vi làm việc, các lịch/policy nguồn, bằng chứng nghỉ hưởng lương và tổng đã đối soát; chưa đủ dữ liệu không được khóa |
| `AttendancePeriodDay` / S4 | `id`, `periodEmployeeId`, `date DateTime @db.Date`, `scheduledWorkMinutes Int?`, `workedMinutes Int?`, `lateMinutes Int?`, `earlyLeaveMinutes Int?`, `calculatedSnapshot Json`, `resolvedSnapshot Json?`, `issues Json`, `resolutionStatus` | Unique periodEmployeeId+date. Có dòng cho ngày không punch/ngày nghỉ khi trong phạm vi đối soát. Thiếu lịch thì scheduledWorkMinutes là null kèm blocker, không giả 0. Snapshot chứa inputs, id+revision nguồn, interval breakdown, từng loại công; resolved không xóa calculated. Index phục vụ nhân viên/ngày và issue |
| `AttendanceReconciliationLog` / S5–S6 đề xuất | `id`, `periodId?`, `periodDayId?`, `entityType`, `entityId`, `action`, `before Json?`, `after Json`, `reason String`, `evidence Json?`, `actorId`, `createdAt` | Append-only cho đối soát và xác nhận/khóa/mất hiệu lực xác nhận. Chưa implement; không dùng log để âm thầm cấp quyền nghỉ có lương hoặc sửa raw Attendance |
| `PostLockAttendanceCorrectionRequest` / S6 | `id`, `periodId`, `employeeId`, `date DateTime? @db.Date`, `snapshotReference Json`, `reason String`, `requestedChange Json`, `evidence Json?`, `status`, `createdBy`, timestamps | Receipt riêng cho sai sót sau LOCKED, có audit và FK nguồn đã chốt. Tên/shape cần duyệt; trạng thái RECORDED đề xuất chỉ nghĩa đã tiếp nhận, không tự approved/applied. Không dùng review của AttendanceAdjustmentRequest hiện tại vì action đó cập nhật raw. Actor/quy trình giải quyết còn OPEN |

Mở rộng tối thiểu khác:

- `Employee`: cân nhắc `employmentEndDate DateTime? @db.Date` và chuẩn hóa semantics `joinedAt`. Không suy ngày nghỉ việc từ INACTIVE. Hồ sơ lịch sử chưa rõ phải được HR xác nhận phạm vi trong kỳ; null không chứng minh người INACTIVE còn làm cả tháng. Nếu cần tái tuyển dụng/nhiều giai đoạn, phải đổi sang EmploymentPeriod, không cố nhét vào một ngày kết thúc.
- `LeaveRequest`: giữ startDate/endDate và status hiện tại. Nếu MVP chỉ hỗ trợ nghỉ nguyên ngày thì phải xác nhận semantics ngày bắt đầu/kết thúc và các dữ liệu cũ trước. Căn cứ trả lương/ngày được ghi trong day snapshot và audit; nếu cần quản lý số dư phép hoặc nghỉ theo giờ/nửa ngày phải thiết kế allocation/ledger trước, không lấy số đơn làm số ngày.
- Payroll giai đoạn B: thêm `attendancePeriodEmployeeId?`, `calculationMode LEGACY/CONFIGURED`, `engineVersion?`, `calculationSnapshot Json?`, revision và publishedBy/At; sau đó mới thêm SalaryTemplate/Version + EmployeeSalaryAssignment theo audit. FK công phải cùng employee và cùng tháng/năm, kỳ LOCKED; kiểm tra tại backend. Snapshot giữ monthlySalary, standardDays, payableDays, lịch/policy version, template/rate, line items, Decimal strings và làm tròn.
- Không backfill dữ liệu công/salary assignment cho Payroll cũ bằng suy đoán. Legacy renderer/API/PDF hoạt động như cũ; dữ liệu mới có nguồn/snapshot rõ ràng.

Constraint quan trọng: khoảng giờ 0–1439, ca kết thúc sau bắt đầu và không qua ngày; breaks trong ca, không chồng lấn, không làm ca rỗng; weekday không trùng; version/hiệu lực không trùng; số phút không âm; mẫu số >0 khi tính lương. PostgreSQL CHECK/transaction bổ sung nơi Prisma không biểu diễn đủ. 480 phút chỉ là kết quả mẫu demo, không phải constraint toàn hệ thống. Giới hạn thời giờ và nghỉ bắt buộc phải được xác minh trước khi cho kích hoạt lịch ngoài mẫu.

## 5. API dự kiến và bảo vệ kỳ công

Tất cả endpoint mới dưới `/api`, ADMIN-only trong MVP; Employee giữ API self-service hiện tại. Không thay response shape của API cũ. Endpoint mới theo convention `{data}`/list `{data,meta}` và lỗi có `code` ổn định để frontend hiển thị tiếng Việt.

| Endpoint đề xuất | Input / output chính |
| --- | --- |
| `GET/POST /work-calendar/versions`, `GET .../:id` | Xem list/detail lịch; tạo draft `{effectiveFrom, timezone, weekdays, startTime, endTime, breaks}`. Giờ config là HH:mm, date-only YYYY-MM-DD |
| `PATCH /work-calendar/versions/:id`, `POST .../:id/activate` | Chỉ sửa draft; activate có expectedRevision và preview tác động. Không chỉnh lịch đã khóa bằng cách backdate |
| `GET/POST /work-calendar/exceptions`, `PATCH .../:id` | Lọc khoảng ngày; tạo/sửa ngoại lệ có reason, kind, dữ liệu theo kind và expectedRevision. Hiển thị ngày lễ/nghỉ bù/hoán đổi và kỳ bị ảnh hưởng |
| `GET /work-calendar/preview?year&month&versionId` | Preview phân loại ngày/giờ làm từ config draft/active, chưa phải công hưởng lương; S2 phải bàn giao UI/API thật trước S3 |
| `GET/POST /attendance-calculation-policies`, `PATCH .../:id`, `POST .../:id/activate` | Structured policy draft/version/activate, chỉ sửa draft với expectedRevision; chỉ triển khai sau khi mục 8 được duyệt; không nhận JS expression |
| `POST /attendance-periods/preview` | Preview một nhân viên/tháng/policy bằng engine backend ở S3; không lưu period/Payroll. Contract chưa chốt; phân biệt với calculate lưu kết quả ở S4 |
| `POST /attendance-periods` | `{year, month}` → tạo/lấy kỳ duy nhất; không sinh công bằng frontend |
| `POST /attendance-periods/:id/calculate` | `{expectedRevision}` → tính lại DRAFT từ nguồn thật, lưu breakdown/issues/fingerprint mới. Recalculate phải giữ/làm stale các đối soát cũ đúng nguồn, không silently xóa lý do HR |
| `GET /attendance-periods`, `GET /attendance-periods/:id` | Danh sách và tổng kỳ, trạng thái, revision, blockers/warnings, thời điểm tính, stale status. Summary là toàn kỳ dù employee list có phân trang |
| `GET /attendance-periods/:id/employees`, `GET .../employees/:employeeId` | List/search/filter có phân trang; detail trả từng ngày, nguồn, calculated/resolved, issue và audit. Có người không có punch |
| `POST /attendance-periods/:id/days/:dayId/reconciliations` | `{expectedRevision, resolutionType, values, reason, evidence?}` theo whitelist; server kiểm tra quyền/căn cứ và tính lại tổng. Không nhận tổng payableDays tùy ý của cả tháng |
| `POST /attendance-periods/:id/confirm`, `POST .../:id/lock` | expectedRevision; kiểm tra nguồn còn đúng, hết blockers, lịch lễ/phạm vi nhân viên/paid leave đủ căn cứ. Lock trả metadata snapshot; MVP không có endpoint unlock |
| `GET/POST /attendance-periods/:id/correction-requests` | Ghi/xem yêu cầu sai sót sau khóa với lý do, nguồn snapshot, requestedChange và audit. Chỉ tiếp nhận, không sửa snapshot/raw/Payroll hay tự bù tiền; role/lifecycle cần chốt trước S6 |
| Payroll giai đoạn B: `POST /payrolls/preview-calculation`, `POST /payrolls/calculate` | employeeId + kỳ + assignment/template version + revision; server chọn công LOCKED, trả/lưu cùng breakdown. Client không gửi netSalary đáng tin; contract chi tiết chốt ở B0 |

`/calculate` công là tính/lưu kết quả đối soát, chưa chốt; `confirm` là HR đã kiểm tra; `lock` mới cho Payroll sử dụng. Ngày kỳ chưa kết thúc có thể xem công tạm tính, không tự đánh vắng các ngày tương lai; thời điểm được khóa phải được chốt ở mục 8.

### State, concurrency và nguồn thay đổi

- `DRAFT → CONFIRMED → LOCKED`. DRAFT có thể tính lại; CONFIRMED thay nguồn/đối soát phải về DRAFT, xóa hiệu lực xác nhận với audit. LOCKED bất biến; GET chỉ đọc snapshot, không chạy lại engine ngầm.
- Các write nguồn (check-in/out, duyệt điều chỉnh, duyệt/sửa phép có ảnh hưởng, hiệu lực lịch/ngoại lệ, phạm vi làm việc) phải đi qua guard dùng chung. Đóng kỳ ở UI hoặc chỉ kiểm tra status trước transaction là chưa đủ.
- Đề xuất transaction + PostgreSQL advisory lock theo tháng/năm, kể cả chưa có AttendancePeriod, để tránh race nguồn/khóa. Thay lịch chung và lock kỳ cùng dùng thêm calendar lock; thứ tự lock thống nhất calendar trước, các kỳ theo thứ tự tăng để tránh deadlock. Không thêm Redis/queue.
- Lock transaction kiểm tra revision + fingerprint đầy đủ của tập nguồn/config/người thuộc kỳ, rồi khóa snapshot và status atomic. Fingerprint không chỉ là `max(updatedAt)`; phải phát hiện insert/delete và thay tập nguồn. Serializable/CAS và retry có giới hạn cho conflict; trả 409 khi cần HR tính lại.
- Guard chặn write làm thay công của kỳ LOCKED; trả mã đề xuất `ATTENDANCE_PERIOD_LOCKED`/`PERIOD_SOURCE_CHANGED` để UI giải thích. Yêu cầu/phép giao nhiều kỳ phải kiểm tra tất cả kỳ bị ảnh hưởng và không cập nhật một phần âm thầm. Sai sót sau khóa chuyển sang receipt riêng có lý do/audit; **không cho unlock trực tiếp**. Việc xử lý tiếp theo/điều chỉnh kỳ khác còn cần quyết định riêng.
- Sau Payroll PUBLISHED, không sửa snapshot hay backdate để thay lương cũ. Phát hiện sai sót phải có quy trình điều chỉnh có tham chiếu, chưa mặc định trừ/cộng vào kỳ sau khi chưa được duyệt.
- Invalidation frontend chỉ làm mới màn hình, không tính lại dữ liệu đã lưu. Nguồn đổi làm kỳ DRAFT hiển thị “Dữ liệu nguồn đã thay đổi, cần tính lại”; công đã đối soát phải được rà lại nếu bằng chứng liên quan đổi.

## 6. Luồng Admin đề xuất

1. **Cài lịch:** xem/nhân bản cấu hình demo → sửa ngày/giờ/nghỉ/hiệu lực → kiểm tra preview lịch tháng → kích hoạt version. Xác nhận danh sách lễ, nghỉ bù và ngoại lệ của kỳ, không tự áp lịch nghỉ cơ quan nhà nước cho mọi doanh nghiệp.
2. **Lập bảng công:** chọn tháng → tính công backend → xem bảng theo nhân viên, tổng công và số issue; lọc “Cần đối soát”. Xem số liệu tạm tính khác số đã khóa.
3. **Đối soát:** mở dialog nhân viên/ngày, thấy lịch, raw đã điều chỉnh, phép, breakdown và lý do bất thường. Sửa sai giờ bằng flow duyệt hiện tại; phân loại/xác nhận công bằng action có lý do và bằng chứng. Không có nút sửa tổng cho đủ tháng.
4. **Chốt:** tính lại nếu nguồn thay đổi → kiểm tra mọi blocker → xác nhận → dialog khóa kỳ nêu tác động; kiểm tra revision phía server. Sau khóa, chỉ xem snapshot/audit và dữ liệu xuất từ snapshot.
   Sai sót sau khóa được ghi qua action yêu cầu riêng, hiện rõ “Đã ghi nhận, chưa áp dụng”; không có nút Mở khóa hoặc áp dụng thay đổi vào kỳ cũ.
5. **Payroll Configuration, sau A:** clone Salary Template → bật/tắt/thêm/bớt khoản → cấu hình rule → preview backend → active version → gán nhân viên/rate có hiệu lực → chọn kỳ công LOCKED → tính nháp → review → phát hành/PDF snapshot.

Trên giao diện dùng rõ nhãn “Công thực tế”, “Nghỉ hưởng lương”, “Công hưởng lương”, “Công chuẩn tính lương”. Không gọi mọi số đếm là “công”. Giữ mobile cards/dialog header-footer ổn định, loading ban đầu khác background refetch; action pending khóa submit, lỗi giữ nội dung và có retry.

## 7. Vertical slices, acceptance và điểm dừng

Nguồn scope/contract dự kiến/owner/test/URL/checklist duy nhất là [attendance-payroll-mvp-slices.md](attendance-payroll-mvp-slices.md). Không duy trì một bảng tiến độ khác tại đây. Mỗi slice đi hết Backend → Frontend kết nối API thật → Codex review tích hợp → người dùng QA localhost → người dùng `done` trước khi mở slice tiếp theo. Không gom hoàn thành tất cả schema/engine/API rồi mới bàn giao Anti.

| Mốc kiến trúc cũ | Slice triển khai end-to-end tương ứng |
| --- | --- |
| A0 — Chốt semantics | S0 và gate nghiệp vụ tương ứng trước mỗi slice. Blocker không liên quan không được tự giải quyết hoặc dùng làm default |
| A1 — Lịch có hiệu lực | S1: xem/tạo/sửa draft; QA xong mới S2: ngoại lệ/preview lịch/activate |
| A2 — Engine công | S3: engine + preview công một nhân viên/tháng + UI đọc kết quả ngay; không chỉ giao một data layer chưa dùng |
| A3 — Bảng công tháng | S4: tính/lưu toàn kỳ, list/detail, UI tháng và issue |
| A4 — Đối soát | S5: backend/audit và modal đối soát ngày, QA thật |
| A5 — Xác nhận/khóa | S6: guard/snapshot và UI confirm/lock, cùng đường ghi nhận sai sót sau khóa. Không unlock |
| B0/B1 — Payroll contract/engine | Chốt gate Payroll sau S6; S7 template/config/preview, S8 assignment + preview từ công LOCKED. Mỗi slice backend + UI + QA riêng |
| B2 — Phát hành | S9: lưu nháp/publish atomic + Admin/Employee/PDF snapshot; regression legacy |

A0 chưa hoàn tất toàn bộ. Người dùng đã duyệt gate draft S1 và ủy quyền Codex chốt/implement contract; backend READY được ghi theo tests thực tế. Trước S2/S3 vẫn phải chốt chính sách tác động công/lương. Contract S1 v1 và report là source of truth của phần đã làm; các API còn lại ở mục 5 là danh mục dự kiến. Không triển khai mutation quản lý policy/template rộng hơn scope slice được duyệt.

Code dự kiến bổ sung trong module `backend/src/modules/attendance/`: service/repository/types cho lịch, calculation policy và period; `attendance-calculation.engine.ts` thuần; helper period guard dùng chung bởi Attendance/Leave/Payroll. Chỉ chia file theo trách nhiệm thực tế, không tạo package framework. Frontend tiếp tục `features/attendance/{api,hooks,types}` và page/components tại khu vực Admin; thêm query keys của kỳ/chi tiết/config vào factory hiện có. Duyệt lịch/đối soát không tự chạy engine trong browser.

## 8. Rà soát A0: đã chốt và còn OPEN

**Đã chốt, không hỏi lại:** Attendance Calculation trước Payroll; lịch demo và HR tùy chỉnh có hiệu lực; một lịch/ca ban ngày, chưa ca đêm/ca xoay/OT; backend tự tổng hợp và đánh dấu bất thường; HR đối soát có lý do rồi xác nhận/khóa; MONTHLY prorate theo công hưởng lương, không phạt tiền đi muộn; LOCKED không unlock trực tiếp, sai sót phải có request/audit riêng, không tự sửa snapshot/Payroll PUBLISHED. Workflow Codex/Anti/người dùng và gate `done` đã chốt. Những công thức quy đổi chi tiết và quyền thao tác chưa được suy ra từ các quyết định này.

Trạng thái dưới được cập nhật theo xác nhận người dùng; phần còn OPEN không được agent tự quyết. Gate gắn slice thay vì khóa cả dự án vì một câu hỏi chưa liên quan.

| ID / gate | Quyết định cần xác nhận | Đề xuất hoặc rủi ro cần xem |
| --- | --- | --- |
| A0-01 / S1 CONFIRMED | Timezone, biểu diễn ngày/giờ/lịch draft | Người dùng xác nhận Asia/Ho_Chi_Minh, YYYY-MM-DD, ISO 1–7 và bổ sung HH:mm gồm phút. S1 không sửa timezone Attendance cũ; không cho chọn timezone khác trong payload |
| A0-02 / S1 CONFIRMED, S2 giới hạn áp dụng OPEN | Một nghỉ giữa ca và mẫu demo | Đã chốt đúng một nghỉ; demo T2–T6 08–17, nghỉ 12–13 không tính làm việc. Không còn hỏi lại một/nhiều khoảng nghỉ. Các giới hạn pháp luật/case ngoài mẫu trước activate phải review ở S2; chưa thêm rule giảm công/lương |
| A0-03 / S1 CONFIRMED, S2 hiệu lực OPEN | Quyền và phạm vi draft | Đã chốt chỉ ADMIN, một lịch công ty, effectiveFrom nhập trong draft chưa tác động Attendance đến activate S2. Ngày bắt đầu active/demo, backdate/lịch giữa tháng và người xác nhận lễ/nghỉ bù chưa chốt; S1 không seed/backfill hoặc activate |
| A0-04 / S2 lịch, S3 quy đổi | Lễ/nghỉ bù/ngoại lệ và mẫu số | Duyệt cách tách requiredWorkingDays và salaryStandardDays ở mục 3; định nghĩa nghỉ bù/làm bù và tương quan tử-mẫu. Cần fixture cụ thể, không chỉ chọn nhãn “trừ ngày lễ”; làm đủ điều kiện cả tháng không trả vượt/thiếu vì đếm trùng |
| A0-05 / S3 | Đi muộn/về sớm, partial day và làm tròn công | Giảm payableDays theo phút, nửa ngày hay HR xác nhận? Grace, giây biên, quy đổi ca ngắn, ngưỡng đủ công và precision? Không phạt tiền không đồng nghĩa được tự trừ lương theo phút |
| A0-06 / S3–S5 | Nghỉ hưởng lương hợp lệ | ANNUAL cần ledger tối thiểu hay HR xác nhận theo hồ sơ bên ngoài? SICK do BHXH chi trả hay có thỏa thuận trả thêm? OTHER gồm trường hợp nào? Nguyên/nửa ngày và date bounds? Không tự dùng quota 12 hoặc coi APPROVED là đủ quyền |
| A0-07 / S3–S4, S8 | Phạm vi nhân viên, mẫu số người vào/nghỉ giữa kỳ | Ngày bắt đầu/kết thúc có tính cả ngày, INACTIVE có phải nghỉ việc, có tái tuyển dụng? Đề xuất mẫu số lịch cả tháng, tử số chỉ phạm vi đủ điều kiện; cắt cả mẫu số có thể trả đủ tháng cho người chỉ làm một phần. Cần fixture và dữ liệu lịch sử HR xác nhận |
| A0-08 / S6 | Quyền/scope/thời điểm khóa | Khóa cả doanh nghiệp/tháng hay từng người; có cần hai người confirm/lock? Chỉ khóa khi hết tháng hay cutoff khác? Pending leave/adjustment có chặn không? Đây chưa được chốt chỉ từ yêu cầu “khóa kỳ” |
| A0-09 / S6 | Yêu cầu sai sót sau khóa: ai ghi/ai nhận/quy trình xử lý | **Không unlock và phải ghi nhận request có lý do/audit đã chốt.** Còn cần quyền tạo/xem, người tiếp nhận, lifecycle và căn cứ xử lý. RECORDED là trạng thái receipt đề xuất; có bù kỳ sau hay chứng từ riêng phải duyệt, không tự áp vào lương hoặc hỏi lại việc cho unlock trước publish |
| A0-10 / S7–S9 | Lương hợp đồng, rule tùy chọn và nghĩa vụ | Nguồn rate/effective, whitelist/base các khoản, làm tròn VND và giới hạn Decimal? Thuế/BH nhập số HR đối soát hay demo trước nghĩa vụ? Không tự phát hành như net hoàn chỉnh khi chưa đủ dữ liệu, không biến “đối soát” thành phạt |

**Gate slice đầu đã được người dùng xác nhận.** Contract v1 S1 đã chốt; Backend/Frontend và Codex re-review đã có evidence trong checklist. Còn người dùng QA/done S1. Các quyết định lễ/quy đổi công/khóa/Payroll vẫn OPEN và chặn slice tương ứng, không bị đóng ngầm vì S1 hoàn thành kiểm thử tự động.

### Ranh giới pháp lý cần review

Lịch doanh nghiệp và công thức prorate phải phù hợp hợp đồng/nội quy; không có một mẫu số 22/26 dùng cho mọi tháng. [Giải đáp của Bộ LĐTBXH về Điều 54 NĐ 145/2020](https://chinhsachonline.chinhphu.vn/tinh-luong-theo-ngay-cong-the-nao-la-dung-70400.htm) giải thích mẫu số gắn số ngày làm việc bình thường theo lịch doanh nghiệp, không phải số lần chấm công.

Nghỉ lễ, nghỉ bù, phép năm, nghỉ việc riêng hưởng lương, thời gian nghỉ được tính vào giờ làm và đối tượng đặc thù cần đối chiếu quy định có hiệu lực tại kỳ. Không để HR toggle tắt quyền bắt buộc; phần cấu hình chỉ phản ánh chính sách hợp pháp/có lợi hơn phù hợp đối tượng. Đối chiếu [Bộ luật Lao động, bản gốc 45/2019/QH14](https://datafiles.chinhphu.vn/cpp/files/vbpq/2019/12/45.signed.pdf) cùng văn bản sửa đổi/hướng dẫn khi chốt contract; tài liệu này không chứng nhận tuân thủ pháp luật đầy đủ.

Cấm phạt tiền/cắt lương thay xử lý kỷ luật là ranh giới cần giữ, theo [giải thích Điều 127 trên Cổng tỉnh Quảng Trị](https://www.quangtri.gov.vn/en/tin-tuc/doanh-nghiep-co-duoc-phat-tien-nguoi-lao-dong). Tách thống kê đi muộn khỏi chế tài tiền; việc quy đổi thời gian không làm sang tiền vẫn cần căn cứ, không được tự biến thành phạt. Công nghỉ hưởng BHXH khác công được doanh nghiệp trả lương; không suy từ leaveType sang payableDays khi thiếu điều kiện.

## 9. Điểm dừng và bước tiếp theo

Backend S1 và migration additive local đã hoàn tất theo report/tests; Frontend S1 đã có và re-review PASS theo checklist, không seed/activate hoặc thay check-in/out. Bước tiếp theo là người dùng QA/done; lỗi logic tiếp tục thuộc Codex dù nằm ở frontend, chỉ lỗi thuần UI giao Anti. Không tự chuyển S2. Tests/acceptance của các slice sau vẫn là kế hoạch, không phải kết quả PASS.

Cách giải thích khi phỏng vấn sau khi đã triển khai: “Hệ thống tách chấm công thô, tính công và chốt công. Backend kết hợp lịch có hiệu lực, ngày lễ, phép hợp lệ và các điều chỉnh được duyệt; HR giải quyết bất thường trước khi khóa snapshot. Payroll đọc snapshot đó nên thay lịch hay sửa chấm công sau này không làm đổi lương lịch sử.” Hiện đây là kiến trúc dự kiến, chưa mô tả như tính năng đã hoàn thành trong CV.
