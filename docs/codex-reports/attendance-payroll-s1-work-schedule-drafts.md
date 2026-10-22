# S1 — Backend Work Schedule Drafts & Anti Handoff

Ngày 19/10/2026. **Backend READY; Frontend chưa làm; integration review FE và người dùng QA/done còn chờ.** Không chuyển S2. Contract thực tế v1: [work-schedule.md](../modules/work-schedule.md).

## 1. Quyết định S0 đã nhận

Người dùng xác nhận timezone Asia/Ho_Chi_Minh; YYYY-MM-DD; weekday ISO 1–7; một khoảng nghỉ; lịch demo T2–T6 08:00–17:00, nghỉ 12:00–13:00 không tính làm việc; chỉ ADMIN, một lịch công ty; effectiveFrom trong draft chưa tác động Attendance. Câu trả lời bổ sung xác nhận **HH:mm** gồm phút, không phải HH nguyên giờ.

A0-01 đóng; A0-02/03 đóng phần S1. Các policy/hiệu lực/giới hạn áp dụng trước activate, ngày lễ/mẫu số/quy đổi công/paid leave/khóa/Payroll còn OPEN theo [plan](../plans/attendance-calculation-payroll-mvp.md). Việc Backend READY không xác nhận các policy đó hoặc hoàn tất A0 cho toàn dự án.

## 2. Files changed trong Backend S1

- `backend/prisma/schema.prisma`: WorkScheduleVersion, WorkScheduleAudit, enums và User relations.
- `backend/prisma/migrations/20261019140000_add_work_schedule_drafts/migration.sql`: migration additive, FK/index/check. Không seed/activate.
- `backend/src/modules/work-calendar/work-schedule.types.ts`: config/DTO.
- `backend/src/modules/work-calendar/work-schedule.repository.ts`: reads, list/count snapshot, CAS write và audit persistence.
- `backend/src/modules/work-calendar/work-schedule.service.ts`: validation/normalization/serializer, transaction, server-owned metadata và audit.
- `backend/src/modules/work-calendar/work-schedule.controller.ts`: envelope/status/lỗi code + tiếng Việt.
- `backend/src/modules/work-calendar/work-schedule.routes.ts`, `backend/src/app.ts`: bốn endpoint ADMIN-only dưới /api/work-calendar.
- `backend/tests/work-schedule.test.cjs`: validation/unit/HTTP auth/concurrency guards.
- `backend/tests/work-schedule.integration.test.cjs`: PostgreSQL + HTTP thật trong schema test riêng, migration/CAS/audit rollback.
- Tài liệu contract/report, context Anti và plan/checklist/roadmap cập nhật trạng thái theo bằng chứng. Không sửa file frontend, Attendance/Leave/Payroll hoặc auth middleware.

## 3. Luồng backend

ADMIN gửi config → controller → service kiểm tra cấu trúc/ngày/giờ → transaction ghi DRAFT + audit → trả DTO. Version do DB sequence cấp; revision ban đầu 1. PATCH merge config hiện tại rồi validate cả ca, CAS theo id/status/revision, tăng revision và lưu before/after. GET chỉ đọc cấu hình; không activate hoặc chạy tính công. Audit failure rollback toàn bộ write.

Giải thích phỏng vấn: “Tôi dùng optimistic concurrency với revision để hai quản trị viên không ghi đè bản nháp của nhau. Guard nằm ngay ở câu UPDATE, và dữ liệu cùng audit được lưu trong một transaction nên không có trường hợp đổi lịch nhưng mất lịch sử.” Đây là behavior đã test Backend S1, chưa phải chứng minh UI hoàn thành.

## 4. Verification evidence

- `npm.cmd run build` trong backend: **PASS**, Prisma Client generate + TypeScript compile. Lần đầu EPERM do DLL đang được backend giữ; người dùng đã dừng backend, chạy lại thành công.
- **Đã giải quyết EPERM ở lần build cuối:** xác minh supervisor ts-node-dev HRM PID 26168 và process con PID 5704 còn giữ DLL. Sau khi người dùng cho phép, kiểm tra lại command line/quan hệ cha-con rồi dừng đúng hai process, không tác động process khác. Chạy lại `npm.cmd run build`: **PASS**, Prisma generate + TypeScript compile trên source cuối. Không xóa DLL/client hay đổi cấu hình generate để né lỗi; không tự khởi động lại backend. Không còn blocker rebuild S1.
- `npx.cmd prisma migrate status`: chỉ migration S1 pending; target đã kiểm tra là `localhost:5432/hrm_db`, không remote.
- `npx.cmd prisma migrate deploy`: **PASS** trên DB local, áp riêng migration additive S1. Chưa deploy production.
- `npx.cmd prisma validate`: **PASS**; `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`: **No difference detected**, exit 0 trên DB local. Không dùng diff để ghi database.
- `node --test --test-reporter=spec tests/work-schedule.test.cjs tests/attendance-adjustment.test.cjs tests/attendance-monthly-report.test.cjs tests/admin-dashboard.test.cjs`: **51 PASS**, gồm 28 test S1 và 23 regression có sẵn. Lần đầu sandbox chặn HTTP localhost và test mock Prisma cần dùng pattern direct-assignment của repo; sau sửa test harness/chạy với quyền localhost đã PASS.
- `$env:HRM_S1_DB_TEST='1'` rồi `node --test --test-reporter=spec tests/work-schedule.integration.test.cjs`: **1 PASS** với PostgreSQL thật + full Express app/HTTP. Test tạo schema hrm_s1_test_<uuid> trên localhost, replay migrations, tạo actor test, create/list/detail/update/pagination, race hai PATCH cùng revision có đúng một 200/một 409, audit before/after, rollback khi actor FK hoặc audit lỗi, chặn non-DRAFT và không tạo Attendance/Leave/Payroll. Schema test được cleanup; không seed hoặc tạo draft trong public để làm demo.
- Lần chạy kết hợp cuối cả năm file test với HRM_S1_DB_TEST=1: **52 PASS, 0 fail, 0 skip**.
- Backend chưa có npm lint script; không báo lint PASS giả. Chưa chạy frontend tests/build vì không sửa frontend. Người dùng chưa QA giao diện/API bằng tài khoản thật cho S1; chưa đánh done.
- Kiểm tra bổ sung `npx.cmd tsc --noEmit --noUnusedLocals --noUnusedParameters` báo một lỗi có sẵn: `backend/src/app.ts:4` import env không dùng. Đây không phải cấu hình build hiện hành; không thay import/side effect ngoài scope S1. Build hiện hành PASS; không báo kiểm tra unused này PASS.

Integration test chỉ chạy DB khi HRM_S1_DB_TEST=1, chỉ chấp nhận DATABASE_URL localhost và tự dọn schema duy nhất do test tạo. Không trỏ test này vào production. Các tests mock không được dùng thay bằng chứng DB thật.

## 5. Brief giao Anti

Đọc [ANTIGRAVITY_CONTEXT](../agents/ANTIGRAVITY_CONTEXT.md), rules/skills liên quan, rồi [contract S1 v1](../modules/work-schedule.md) và source Backend nếu cần. **Chỉ frontend S1**:

1. Tạo page đề xuất `/admin/attendance/settings` và đường điều hướng trong phạm vi Attendance hiện có; GET list/detail DRAFT, tạo/sửa form RHF/Zod theo đúng contract.
2. API layer dùng axiosInstance, query keys có page/limit/id; không thêm refresh/auth client. Detail/create/update unwrap data đúng envelope; list giữ meta. Lưu gửi expectedRevision hiện nhận, không tự tăng trước khi server trả.
3. Nút dùng mẫu demo chỉ điền weekdays/hours/break vào form; effectiveFrom do người dùng chọn. Timezone cố định/read-only. Breaks đúng một khoảng. Không tự seed, activate, thêm paid/grace/payable fields hoặc tính công/lương trên FE.
4. Loading/empty/error/retry, pending chống double-save, giữ form khi lỗi; 409 hiển thị tiếng Việt và yêu cầu tải lại/đối soát, không tự overwrite. Sau save invalidate list + set/refetch detail từ response. Mobile/keyboard/DatePicker trong dialog theo pattern repo.
5. Tests frontend payload/validation/409/pending/cache/filter/page và no activate; chạy frontend test/lint/build. Bàn giao report changed files + API thật + QA URL/steps cho Codex review trước người dùng QA.

Backend local đã được chứng minh bằng server test HTTP tạm thời (port tự cấp, đã đóng sau test). Để Anti gọi thường xuyên: từ `backend/` chạy **`npm run dev`**, base `http://localhost:3000/api`, health `/health`; không cần chạy seed/reset/migrate lại trên máy local này. Người dùng đã dừng server cũ cho generate; report không giả định server port 3000 luôn đang chạy. Frontend `npm run dev` ở localhost:5173 để khớp CORS hiện tại. Nếu port bận hoặc DB/schema chưa đúng máy, báo Codex, không tự sửa env/deploy.

UI URL sau Anti implement: `http://localhost:5173/admin/attendance/settings` (**chưa tồn tại lúc Backend handoff**). Dùng ADMIN thật của local qua Login, không ghi token/password vào tài liệu. Hiện không có draft mặc định trong DB; tạo qua form/API, chọn ngày hiệu lực hợp lệ tùy QA. Không sử dụng ngày ví dụ trong contract như lịch được activate.

## 6. Acceptance còn lại

- [ ] Anti frontend + tests/lint/build và API integration thật.
- [ ] Codex review FE so contract, CORS/route/auth/DTO/date/concurrency và regression.
- [ ] Người dùng QA localhost: tạo/reload/sửa, stale conflict, role denial, responsive và trạng thái UI.
- [ ] Người dùng xác nhận done cho S1. Chỉ sau đó mới xem xét gate S2, không tự activate ngay.
