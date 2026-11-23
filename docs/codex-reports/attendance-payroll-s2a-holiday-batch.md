# S2A — Preset ngày lễ và thiết lập kỳ nghỉ atomic

Ngày22/10/2026. **Backend/contract READY để bàn giao UI**, chưa Frontend v1.1, chưa QA/done, chưa S2B. Theo yêu cầu mới, không sửa UI/CSS hoặc commit/push. F11 responsive375/390 từ [review trước](attendance-payroll-s2a-integration-review.md) còn OPEN, gộp trong brief Anti.

## Phương án đã triển khai

- Reuse Prisma CalendarException.payload Json, WorkScheduleAudit Json,4 kinds và resolver hiện có; không migration/schema/dependency/service trả phí mới.
- Preset là dữ liệu gợi ý có version/id/ngày/nguồn, không remote sync hoặc engine pháp luật. HR xem và xác nhận. Backend giữ catalog dùng chung và kiểm tra presetId/date; frontend chỉ hiển thị/chọn/điền form, không tự tạo bảng ngày âm lịch.
- Phân loại HOLIDAY thêm holidayPolicy STATUTORY(presetId) hoặc COMPANY(isPaid do HR xác nhận). Legacy thiếu metadata không bị backfill thành pháp định/hưởng lương; PATCH clientv1 không làm mất policy đã lưu.
- Backend cần sửa thật cho atomic nhiều ngày, CAS/revision/audit, chống trùng/nghỉ bù lần hai, policy/preview metadata. Không thể bảo đảm atomic bằng frontend loop6 API cũ.
- Batch đi2 bước: preview từ toàn DRAFT → HR xem toCreate/skipped/calendarDays/issues → POST cùng input+fingerprint. Backend dựng lại plan trong transaction; sai một row, stale, fingerprint sai hoặc audit lỗi đều không lưu phần nào.
- Nghỉ tuần không sinh row ngoại lệ. Nghỉ bù tính theo lịch chung/resolver, không hardcode T7/CN hoặc chép hoán đổi khối công. COMPANY không tự kéo theo nghỉ bù pháp định; STATUTORY và legacy-v1 giữ hành vi riêng rõ ràng.
- Sau commit thực sự: revision tăng1,1 audit bao trọn batch. Toàn bộ đã có đúng dữ liệu: skip/no-op, không đổi revision/updatedAt/audit. Cấu hình khác cùng date trả conflict, không overwrite.

## Contract thực tế

[Exact Addendum v1.1](../modules/work-calendar-s2a-holiday-batch.md) là source of truth. Giữ6 API v1, thêm3 API ADMIN:

1. GET `/api/work-calendar/holiday-presets?year=2026`.
2. POST `/api/work-calendar/versions/:versionId/exceptions/batch-preview`.
3. POST `/api/work-calendar/versions/:versionId/exceptions/batch`.

Preview body `{expectedRevision,holidays:[HOLIDAY+holidayPolicy],includeCompensatoryOff:boolean}`. Commit thêm planFingerprint; không nhận client-calculated targets/toCreate/tiền/công. Giới hạn1–31 ngày, khoảng review≤366 ngày. Response bọc data. Các error400/404/409 tiếng Việt, phân biệt stale revision/plan changed/unresolved/conflict nguồn.

Monthly Preview additive holidayCategory/holidayPayPolicy, chỉ resolved HOLIDAY có phân loại; COMPENSATORY_OFF không được coi thêm ngày lễ PAID. Resolver fingerprint version2. Chưa tính standardDays/payableDays/salary; isPaid COMPANY chỉ ghi nhận cấu hình HR, không tự trừ lương hoặc xác nhận đủ căn cứ pháp lý.

## Dữ liệu preset và giới hạn thật

-2026 đủ6 nhóm: Dương lịch, Tết, Giỗ Tổ,30/04,01/05,Quốc khánh.2027 có các nhóm trừ Giỗ Tổ; riêng ngày Giỗ Tổ2027 chưa xác minh trong catalog nên unavailable. Năm khác chưa có dữ liệu, không fallback nhầm năm.
- Tết có3 options doanh nghiệp, mỗi option đúng5 ngày HOLIDAY; Quốc khánh có2 options. Không tự chọn/trộn option. Backend chặn pha options cùng năm/nhóm kể cả CRUD đơn.
- Nguồn chính thức và phạm vi áp dụng ghi tại [contract mục1](../modules/work-calendar-s2a-holiday-batch.md). Không coi preset6 nhóm là toàn bộ hệ thống pháp luật; dữ liệu/lịch đặc thù chưa hỗ trợ phải được cập nhật có nguồn, không gán COMPANY chỉ để vượt validation.
- Ví dụ kiểm thử Tết2027 option2+3:04–08/02 là5 HOLIDAY; theo lịch demo T2–T6,09–10/02 là2 COMPENSATORY_OFF. Không lưu7 HOLIDAY và không sinh lại2 nghỉ bù khi gửi lại.
- Không thay raw Attendance, check-in/out, Leave, Payroll hoặc ACTIVE; không sửa lịch sử lương đã phát hành.

## Files thay đổi trong lượt này

Backend:

- Tạo `backend/src/modules/work-calendar/holiday-presets.ts`: catalog versioned/nguồn/availability.
- Tạo `backend/src/modules/work-calendar/calendar-holiday-batch.service.ts`: strict parser, pure planner, preview snapshot, CAS transaction/atomic/audit.
- `calendar-exception.types.ts`: HolidayPolicy và preview classification.
- `calendar-exception.validation.ts`: strict policy/preset/date validation, legacy compatibility.
- `calendar-exception.service.ts`: reuse event validation, option exclusivity, giữ policy khi PATCHv1, bảo vệ nguồn nghỉ bù khi đổi sang COMPANY.
- `calendar-preview.engine.ts`: COMPANY không tự yêu cầu bù theo luật, phân loại/pay metadata, fingerprintv2; giữ4 kinds/null/issues.
- `calendar-exception.controller.ts`, `work-schedule.routes.ts`:3 endpoints/admin/query validation/envelopes.
- Tạo `backend/tests/calendar-holiday-batch.test.cjs`; mở rộng `backend/tests/calendar-exception.integration.test.cjs`.

Docs: addendum/report này; cập nhật main contract, brief Anti, context link, checklist/plan và note bổ sung review/Backend report trước. Không có frontend application file được sửa trong lượt này.

## Test/build evidence

| Kiểm tra | Kết quả |
| --- | --- |
| Backend npm run build (`prisma generate && tsc`) | PASS; người dùng đã dừng backend nhả DLL. Không cần đổi schema/migration |
| Backend8 test files dưới đây, có2 DB flags | **137 PASS,0 fail/skip**, gồm real PostgreSQL/HTTP trong schema random riêng và cleanup |
| Frontend npm run test | **100 PASS** (95 Vitest+5 Node helper), baseline UIv1 không sửa |
| Frontend npm run lint | PASS |
| Frontend npm run build | PASS; warning chunk lớn≈1.52MB hiện có, không mở refactor bundle |

```powershell
# backend/
$env:HRM_S1_DB_TEST='1'
$env:HRM_S2A_DB_TEST='1'
node --test --test-reporter=spec tests/work-schedule.test.cjs tests/work-schedule.integration.test.cjs tests/calendar-exception.test.cjs tests/calendar-holiday-batch.test.cjs tests/calendar-exception.integration.test.cjs tests/attendance-adjustment.test.cjs tests/attendance-monthly-report.test.cjs tests/admin-dashboard.test.cjs
```

Đã kiểm tra nguồn/policy/preset giả/ngày lệch/option xung đột; năm thiếu dữ liệu;5 HOLIDAY/2 nghỉ bù; COMPANY paid/unpaid không auto-comp; legacy unclassified; validation row index; lịch không nghỉ T7/CN; qua tháng/năm; preview không ghi; trùng/skip/no-op timestamp; lỗi row cuối, lỗi insert thứ2 và audit rollback; stale/fingerprint/input đổi; batch-vs-batch/S1 CAS chỉ1 winner; CRUDv1 giữ policy; ADMIN401/403 và regression Attendance/report/dashboard.

Vòng test đầu sandbox chặn localhost fetch EACCES; chạy lại ngoài sandbox. PostgreSQL concurrency phát hiện assertion cũ cho rằng S1 PATCH luôn thắng POST (chỉ chấp nhận200/409). Đã sửa để chấp nhận đúng winner200 hoặc201 theo endpoint, vẫn bắt buộc1 conflict409, revision/audit và số rows chính xác; không làm yếu CAS assertion. Kết quả bảng là lần chạy cuối sau sửa.

Không migrate/reset/seed public. Migration trong automated tests chỉ áp schema disposable tự tạo, không schema người dùng. HTTP thật dùng app/router chạy cổng localhost tạm trong test, không phải manual QA UI mới. Chưa browser test UI presets/batch vì chưa triển khai; không đánh PASS responsive thay Anti.

## Bàn giao Anti và QA

[Brief Anti đã gộp](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md): form preset/nghỉ doanh nghiệp, review/confirm nhiều ngày, unavailable, dirty/409/cache/focus và F11 CSS375/390. Không loop CRUD để giả atomic; không frontend tính nghỉ bù; không bỏ sửa focus ownership đã kiểm chứng.

Backend hiện đã dừng theo xác nhận người dùng để build. Mở lại `npm run dev` trong backend; frontend local hiện có `http://localhost:5173/admin/attendance/settings?tab=calendar`, API `http://localhost:3000/api`. UI mới chỉ khả dụng sau Anti tích hợp.

QA sau Anti: chọn DRAFT effectiveFrom trước kỳ demo → chọn Tết2027 option2+3 → kiểm tra preview5 lễ/2 bù → xác nhận → list/preview tự cập nhật; preview lại cùng data thấy skip7, không sinh trùng. Thử COMPANY trên Chủ nhật không tự sinh nghỉ bù; hai tab CAS409 giữ input; thay field sau preview phải preview lại; API lỗi không mất form;375/390 không clip,768/1280 và modal thấp không regression.

## Luồng dễ hiểu

Preset giống bộ mẫu có nguồn: HR chọn mẫu rồi kiểm tra. Backend thử ghép mẫu với lịch và ngoại lệ đã có, trả danh sách sẽ tạo/đã tồn tại/nghỉ tuần/nghỉ bù. Chỉ sau HR xác nhận Backend mới lưu tất cả trong cùng transaction; nếu một bước lỗi thì không có ngày nào được lưu lẻ. Nhờ revision và fingerprint, dữ liệu người khác vừa sửa không bị ghi đè bằng preview cũ.

Phỏng vấn: “Em để frontend hướng dẫn nhập liệu bằng preset, còn Backend sở hữu resolver, optimistic concurrency và atomic batch. Metadata phân biệt căn cứ nghỉ với kết quả công/lương; phần gợi ý không trở thành engine pháp luật hoặc tự tác động lịch sử.”

Bước tiếp theo: người dùng giao brief cho Anti → Codex review logic/UI tích hợp → người dùng QA/done S2A. Chưa S2B, chưa commit/push.
