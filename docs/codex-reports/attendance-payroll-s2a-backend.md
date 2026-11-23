# S2A — Calendar Exceptions + Monthly Preview — Backend

**Cập nhật sau handoff gốc22/10:** Frontend v1 đã review và còn F11 mobile. Người dùng yêu cầu preset/kỳ nghỉ, [Backend v1.1](attendance-payroll-s2a-holiday-batch.md) đã READY:137 tests/full build PASS, không migration mới. Nội dung dưới đây là evidence mốc Backend v1 ban đầu; không suy thành user QA/done hiện tại.

Ngày: 22/10/2026. **Backend READY, Exact Contract v1 đã được người dùng duyệt.** Chưa Frontend S2A, chưa Codex review tích hợp FE, chưa người dùng QA/done. Không commit/push, không S2B.

## 1. Scope / changed files

- `backend/prisma/schema.prisma`, migration `20261022090000_add_calendar_exceptions/migration.sql`: thêm CalendarException/4 kinds, FK actor/version, index và CHECK; thêm 3 audit actions. Không thay Attendance/Payroll schema hoặc seed lịch.
- `backend/src/modules/work-calendar/calendar-exception.{types,validation,repository,service,controller}.ts`: DTO, strict validation, list/detail/create/full-replace/delete, DRAFT-only và error envelope.
- `calendar-date.ts`: civil date/ISO weekday/month arithmetic, không Date.UTC(year<100), không timezone browser.
- `calendar-preview.engine.ts`: resolver thuần, phân bổ nghỉ bù từ nguồn lễ, kiểm tra toàn DRAFT, preview tháng/null/partial summary và canonical fingerprint.
- `work-schedule.service.ts`, `work-schedule.controller.ts`: chỉ export helper/DTO/error handler sẵn có để reuse; logic/contract S1 không đổi.
- `work-schedule.routes.ts`: thêm 6 routes dưới auth ADMIN hiện có; không activate.
- `backend/tests/calendar-exception.test.cjs`, `calendar-exception.integration.test.cjs`: tests mới. Các tests S1/Attendance/report/dashboard hiện có được chạy regression, không sửa implementation các module đó.
- Tài liệu: contract S2A, plan/checklist, context Anti và [brief S2A](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md). Những thay đổi plan/AGENTS đang có từ lượt trước được giữ; không stage hoặc gom commit.

## 2. API thực tế

Base `/api/work-calendar`, Bearer ADMIN:

| Method / suffix | Thành công |
| --- | --- |
| GET `/versions/:versionId/exceptions` | `{data:CalendarExceptionDto[],meta,scheduleRevision}` |
| GET `/versions/:versionId/exceptions/:id` | `{data:{exception,scheduleRevision}}` |
| POST `/versions/:versionId/exceptions` | 201 `{data:{exception,scheduleRevision}}` |
| PATCH `/versions/:versionId/exceptions/:id` | `{data:{exception,scheduleRevision}}` |
| DELETE `/versions/:versionId/exceptions/:id` | `{data:{removedExceptionId,scheduleRevision}}` |
| GET `/preview?versionId=<uuid>&year=2026&month=11` | `{data:CalendarPreviewDto}` |

[Exact Contract v1](../modules/work-calendar-s2a.md) là nguồn payload/DTO/query/error/null duy nhất; Backend types ở `calendar-exception.types.ts`. POST/PATCH gửi `{expectedRevision,exception}`; PATCH thay toàn payload. DELETE gửi JSON `{expectedRevision,reason}`. Không có activate/timeline/ACTIVE preview/canActivate hoặc field tiền/công hưởng lương.

## 3. Logic và findings đã xử lý

1. **CAS S1/S2A dùng chung:** mutation ngoại lệ lấy parent DRAFT/revision, CAS parent trước khi đọc/validate children; lưu toàn event/SWAP và audit trong cùng transaction. Câu UPDATE vẫn guard id/status/revision. Mọi validation/audit lỗi rollback cả revision lẫn event. Race cùng revision chỉ một thành công/loser 409, không nửa cặp.
2. **Chiếm dụng ngày:** kiểm tra cả offDate/workDate trong payload dưới parent CAS. Database không có unique(date) toàn công ty hoặc counter event riêng; nhiều DRAFT độc lập cùng ngày được phép. Không cho API ghi event overlap; preview vẫn phát hiện overlap nếu dữ liệu nguồn bất thường.
3. **Nghỉ bù:** sort nguồn HOLIDAY trùng weekly off, reserve target không trùng từ toàn nguồn, không phụ thuộc thứ tự HR thêm COMP. Loại HOLIDAY/SWAPPED_OFF, chấp nhận SWAPPED_WORKDAY, xử lý giao tháng/năm. Không tự ghi COMP. Target thiếu/sai làm ngày liên quan UNRESOLVED/null. Self-review phát hiện nguồn sau có thể chiếm ngày khi phân bổ nguồn trước còn unknown: đã chặn đoán target và thêm regression test.
4. **S1 base edit:** không xóa/dời ngoại lệ. SWAP mất hợp lệ đánh dấu cả hai ngày; WORK_OVERRIDE/COMP sai nguồn và ngoại lệ trước effectiveFrom báo BLOCKER. HR vẫn sửa/xóa để repair, không siết validation S1 ngược scope.
5. **Hai mức completeness:** summary.isComplete chỉ tháng đang xem; validation.hasBlockingIssues là toàn DRAFT. Tháng đủ dữ liệu vẫn có thể có blocker tháng khác. Không thay null bằng zero; partial totals chỉ ngày resolved.
6. **Snapshot reads:** list parent+rows+count, detail và preview dùng PostgreSQL RepeatableRead. Test cho mutation commit giữa đọc parent và children: response vẫn cùng snapshot/revision. Fingerprint hash full config/revision/events/resolver version, ổn định giữa các GET và đổi tháng; không hash trang list hoặc clock.
7. **Boundaries/validation:** date-only thật 0001–9999, HH:mm/breaks theo S1, query scalar/strict keys, preview versionId query sai UUID là 400; URL id sai/không tìm thấy là 404. Không tự thêm validation max 8h vào DRAFT; activation là S2B.

Không còn finding logic/API chưa xử lý trong phạm vi kiểm thử S2A. Compatibility OUT_OF_SCHEDULE vẫn là gate S2B; không thêm enum, không đổi Attendance/Payroll/dashboard/report contracts trong task này.

## 4. Verification đã chạy

- `npm run build` tại backend: **PASS**, Prisma Client v6.19.3 generate + TypeScript compile. Lần đầu EPERM do process backend giữ DLL; sau người dùng cho phép, xác minh và dừng đúng supervisor PID 7512 (process con 24628 đã thoát cùng supervisor). Không dừng frontend/process khác, không tự mở lại backend.
- `npx prisma validate`: **PASS**.
- PostgreSQL lần đầu không kết nối được localhost:5432; người dùng đã bật DB, chạy lại thành công. Không đổi env để né lỗi, không reset/seed.
- Integration S2A tạo schema ngẫu nhiên `hrm_s2a_test_<uuid>`, chỉ chấp nhận localhost, replay migrations, chạy full Express app trên cổng tự cấp rồi cleanup schema/server. Tương tự S1 có schema riêng, không dùng record public để test ghi.
- Chạy kết hợp cuối: **115 PASS, 0 fail, 0 skip** = 53 S2A unit/HTTP + 10 S2A PostgreSQL suite/subtests + 52 S1/regression hiện có. Các test HTTP cần quyền loopback ngoài sandbox; lỗi fetch trong sandbox trước đó không được coi là kết quả ứng dụng PASS.

```powershell
# cwd: backend/
$env:HRM_S1_DB_TEST='1'
$env:HRM_S2A_DB_TEST='1'
node --test --test-reporter=spec tests/work-schedule.test.cjs tests/work-schedule.integration.test.cjs tests/calendar-exception.test.cjs tests/calendar-exception.integration.test.cjs tests/attendance-adjustment.test.cjs tests/attendance-monthly-report.test.cjs tests/admin-dashboard.test.cjs
```

Bằng chứng PostgreSQL/HTTP thật gồm CRUD/envelopes/pagination/filter qua cả hai ngày SWAP; nghỉ bù liên tiếp qua năm và nhập COMP đảo thứ tự; referenced-source guards; base edit giữ SWAP/override/COMP để repair; shared CAS race; create/replace/delete audit rollback; snapshot nhất quán; no-op replace tăng revision; GET preview không ghi và không tạo Attendance/Leave/Payroll.

- Local `prisma migrate status` trước deploy: duy nhất migration mới S2A pending. Đã guard cả DATABASE_URL/DIRECT_URL là localhost/hrm_db/public, rồi `prisma migrate deploy`: **PASS**, chỉ áp migration additive S2A.
- `prisma migrate status` sau deploy: **up to date (12 migrations)**. `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`: **No difference detected, exit 0**.
- Backend không có npm lint script; không báo lint PASS giả. Không sửa frontend nên không chạy frontend lint/build/tests. Chưa manual QA UI hoặc production deployment.

## 5. Handoff / QA tiếp theo

Giao người dùng [brief ngắn cho Anti](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md), chưa tự nhắn agent khác. Anti đọc context/rules/skills và tích hợp contract thật; Codex review/sửa logic, người dùng QA/done rồi mới S2B.

- Backend bình thường: `cd backend` → `npm run dev`, API `http://localhost:3000/api`, health `http://localhost:3000/health`. DB local đã migration; không cần seed/reset. Server test đã đóng; port 3000 không được giả định đang chạy.
- Frontend dev ở `http://localhost:5173` theo CORS hiện có. S1 settings hiện hữu; URL đề xuất tab S2A sau Anti làm là `http://localhost:5173/admin/attendance/settings?tab=calendar`, chưa có UI S2A lúc handoff.
- QA sau Frontend: tạo DRAFT → thêm lễ/nghỉ bù hoặc cặp SWAP → preview → thử sửa lịch nền gây invalid → xem BLOCKER/null và sửa/xóa; mở hai tab để thử 409 giữ form; thử list pagination không đổi preview; kiểm tra ADMIN-only/mobile/focus/loading/retry. Chưa đánh bất kỳ case UI nào PASS thay người dùng.

**Giải thích dễ hiểu:** lịch nền và ngoại lệ là nguồn dữ liệu. Backend ghép chúng thành bản xem trước từng ngày nhưng chưa áp dụng vào chấm công. Mỗi lần sửa cần đúng revision hiện tại; lưu và audit thành công cùng nhau hoặc cùng rollback. Vì vậy hai người sửa đồng thời không âm thầm ghi đè nhau, và sửa lịch nền không làm mất bằng chứng ngoại lệ cũ.

**Trình bày khi phỏng vấn sau khi FE/QA hoàn tất:** “Em tách calendar preview khỏi dữ liệu công/lương, dùng discriminated payload cho ngoại lệ và CAS trên revision chung. Preview có issue/null thay vì trả số sai, còn transaction và audit bảo vệ các thao tác hoán đổi.” Hiện Backend READY chưa đồng nghĩa tính năng UI đã hoàn thành.
