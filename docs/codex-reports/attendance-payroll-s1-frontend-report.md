# S1 — Frontend Work Schedule Drafts Report

Ngày: 22/10/2026.
Tác giả: Anti (Frontend Agent).
Trạng thái mới nhất sau Codex re-review 22/10: **F01–F05 PASS sau Anti fixes và Codex bổ sung logic; tests/lint/build và PostgreSQL integration PASS. Chờ người dùng QA/done.** Nội dung bàn giao/vòng review đầu giữ lịch sử; kết luận mới nhất ở mục 7 và [review mục 5](attendance-payroll-s1-integration-review.md#5-re-review-sau-anti-fixes--22102026).

---

## 1. Scope & Kiến trúc thực hiện

Đã triển khai giao diện và tích hợp API cho Slice 1 (S1 — Work Schedule Drafts) theo đúng [API Contract v1](../modules/work-schedule.md) và handoff [brief S1](attendance-payroll-s1-work-schedule-drafts.md):

- **Route & Điều hướng:**
  - Route mới: `/admin/attendance/settings` (Role ADMIN-only qua `RoleGuard` + `ProtectedRoute`).
  - Nút điều hướng "Cài đặt lịch làm việc" trong header của `/admin/attendance`.
  - Link quay lại "Quay lại danh sách chấm công" từ trang settings về `/admin/attendance`.
- **Feature Layer (`src/features/work-schedule/`):**
  - `types/work-schedule.types.ts`: DTO, Config, Pagination, Create/Update payload types theo đúng contract.
  - `api/work-schedule.api.ts`: 4 API endpoints unwrap đúng envelope (`list` giữ `meta`, `detail`/`create`/`update` unwrap `data`).
  - `hooks/useWorkScheduleQuery.ts`: Query keys chuẩn, `useWorkScheduleListQuery` (`keepPreviousData`), `useWorkScheduleDetailQuery`, mutations create và update có cache invalidation.
  - `lib/work-schedule.ts`: Formatters, weekdays labels (T2–CN), demo template constants, và error parser phân loại 409 conflict, 400 validation, 404 not found, 409 not draft.
  - `lib/work-schedule.schema.ts`: Zod schema chặt chẽ kiểm tra cấu trúc giờ HH:mm, ngày YYYY-MM-DD, ISO weekdays 1..7, và logic ràng buộc `startTime < breakStartTime < breakEndTime < endTime`.
- **Presentational & Dialogs (`src/pages/admin/attendance/`):**
  - `WorkScheduleSettingsPage.tsx`: Danh sách bản nháp dạng bảng (Desktop) và thẻ card (Mobile); phân biệt initial loading (skeleton) và background refetch; xử lý empty state, error retry, phân trang; chừa padding phải tránh floating HR assistant.
  - `components/WorkScheduleFormDialog.tsx`: Dialog tạo mới và chỉnh sửa bản nháp:
    - Nút "Dùng mẫu demo" điền T2–T6, 08:00–17:00, nghỉ 12:00–13:00, giữ nguyên `effectiveFrom`.
    - Input múi giờ read-only: `Asia/Ho_Chi_Minh`.
    - Ràng buộc 1 khoảng nghỉ duy nhất.
    - Xử lý 409 Revision Conflict: hiển thị cảnh báo tiếng Việt rõ ràng, cung cấp nút "Tải lại dữ liệu mới nhất" cập nhật in-place, không tự động ghi đè hoặc tự tăng revision.
    - Khóa submit / disable form khi mutation pending chống double-click.
  - `components/WorkScheduleDetailDialog.tsx`: Dialog xem đầy đủ chi tiết bản nháp (phiên bản, revision, ngày hiệu lực, ngày làm việc, giờ làm việc, giờ nghỉ, audit timestamps) và nút chuyển sang chế độ chỉnh sửa.

---

## 2. Danh sách Files đã thay đổi

- `frontend/src/app/router.tsx`: Đăng ký route `/admin/attendance/settings` với `WorkScheduleSettingsPage`.
- `frontend/src/pages/admin/attendance/AttendanceListPage.tsx`: Thêm nút điều hướng "Cài đặt lịch làm việc".
- `frontend/src/features/work-schedule/types/work-schedule.types.ts`: Khai báo types và payloads.
- `frontend/src/features/work-schedule/api/work-schedule.api.ts`: Tích hợp 4 API endpoint `/api/work-calendar/versions`.
- `frontend/src/features/work-schedule/hooks/useWorkScheduleQuery.ts`: TanStack Query hooks.
- `frontend/src/features/work-schedule/lib/work-schedule.ts`: Helpers, formatters, error parsing.
- `frontend/src/features/work-schedule/lib/work-schedule.schema.ts`: Zod validation schema.
- `frontend/src/features/work-schedule/index.ts`: Barrel export.
- `frontend/src/pages/admin/attendance/WorkScheduleSettingsPage.tsx`: Trang quản lý bản nháp chính.
- `frontend/src/pages/admin/attendance/components/WorkScheduleFormDialog.tsx`: Dialog Form tạo / sửa bản nháp.
- `frontend/src/pages/admin/attendance/components/WorkScheduleDetailDialog.tsx`: Dialog xem chi tiết bản nháp.
- `frontend/tests/work-schedule-drafts.test.tsx`: Test suite 6 test case cho S1.
- `docs/plans/attendance-payroll-mvp-slices.md`: Cập nhật checklist Anti FE + tests READY.

---

## 3. Kết quả Kiểm tra (Verification Evidence)

1. **Frontend Tests (`npm run test`):**
   - 9 test files, **49 tests PASS, 0 fail**.
   - `tests/work-schedule-drafts.test.tsx` (6 tests PASS):
     - Renders settings page, lists draft versions and provides back link to attendance.
     - Shows empty state when no draft exists and triggers create dialog.
     - Applies demo template, keeps effectiveFrom untouched, validates and submits create draft.
     - Opens edit dialog with prefilled data and submits with `expectedRevision`.
     - Handles 409 revision conflict gracefully, shows alert, keeps form open and allows reloading latest.
     - Opens detail dialog, shows full schedule breakdown, and transitions to edit mode.
2. **ESLint (`npm run lint`):**
   - **0 errors, 0 warnings**.
   - Tương thích hoàn toàn React 19 / React Compiler (sử dụng `useWatch` và mount form theo key thay vì `setState` trong `useEffect`).
3. **Build Production (`npm run build`):**
   - `tsc -b && vite build`: **PASS** không có lỗi typecheck hoặc build.
4. **Backend Local:**
   - Server backend đang chạy tại `http://localhost:3000`, `/health` trả về `{"message":"HRM backend is running"}`.

---

## 4. URL và Các bước QA localhost (Dành cho Codex và Người dùng)

- **URL giao diện:** `http://localhost:5173/admin/attendance/settings` (hoặc từ `http://localhost:5173/admin/attendance` nhấn nút "Cài đặt lịch làm việc").
- **Tài khoản test:** Đăng nhập bằng tài khoản ADMIN local.
- **Kịch bản kiểm thử đề xuất:**
  1. *Trạng thái rỗng / Danh sách:* Truy cập trang, nếu chưa có draft sẽ thấy EmptyState rõ ràng.
  2. *Tạo bản nháp mới:* Nhấn "Tạo bản nháp mới", nhấn "Dùng mẫu demo" kiểm tra các trường giờ (08:00–17:00, 12:00–13:00, T2–T6) được điền tự động; ngày hiệu lực vẫn để trống. Chọn ngày hiệu lực hợp lệ và lưu -> Bản nháp v1 xuất hiện trong danh sách.
  3. *Xem chi tiết:* Nhấn nút "Chi tiết" trên hàng hoặc thẻ card để mở modal xem thông tin ca làm việc.
  4. *Chỉnh sửa bản nháp:* Nhấn "Sửa", thay đổi giờ ra hoặc thêm ngày T7, lưu thành công -> Revision tăng lên và danh sách tự cập nhật.
  5. *Kiểm tra xung đột 409 (Stale Revision):* Giả lập gửi revision cũ hoặc mở 2 tab cùng sửa một bản nháp; tab lưu sau sẽ nhận thông báo lỗi 409 tiếng Việt, form không bị đóng/mất dữ liệu, có nút tải lại dữ liệu mới nhất.
  6. *Responsive:* Kiểm tra hiển thị bảng trên desktop và thẻ card trên mobile viewport (375px/390px).

---

## 5. Giới hạn đã biết (Known Limitations)

- S1 chỉ dừng ở các bản nháp (DRAFT). Không có chức năng activate, delete, hoặc tác động vào Attendance hiện tại hay tính công/lương.
- Cần Codex review tích hợp trước khi Người dùng tiến hành QA và xác nhận hoàn tất (done).

## 6. Codex Integration Review — 22/10/2026

Chi tiết evidence, file/line, owner và steps: [S1 integration review](attendance-payroll-s1-integration-review.md).

- **FAIL acceptance**, owner sửa: **Anti / Frontend**. F01 reload sau 409 có thể reset phần vừa nhập; F02 rapid pagination vượt trang cuối và mất pager; F03 parent nuốt lỗi reload; F04 raw English network error; F05 đóng dialog không phục hồi focus. Không sửa application code thay Anti trong lượt review.
- API URL/envelope/payload/expectedRevision cơ bản đúng. Có refetch list trùng (2 GET sau PATCH thành công); cần giữ một luồng invalidation/refetch. GET detail hiện chỉ dùng khi reload 409, dialog Chi tiết dùng DTO từ list.
- Xác minh lại frontend: **49 Vitest + 5 Node helper tests PASS**, lint PASS, production build PASS (còn cảnh báo bundle lớn). Suite S1 mock API functions/DatePicker nên không đủ chứng minh các tình huống trên.
- Backend: **51 unit/HTTP/regression PASS**, TypeScript noEmit PASS. Test DB thật hiện **BLOCKED/FAIL do localhost:5432 không kết nối được**, chưa xác minh lại successful CRUD/CORS bằng tài khoản thật. `/health` 200 và 4 endpoint trả 401 khi thiếu token không chứng minh DB sẵn sàng.
- Browser production bundle với API fixtures đã kiểm tra payload, 409, retry, pending, ADMIN guard, DatePicker thật và 1440/768/375/390px; không thay thế QA Backend/PostgreSQL thật.
- Gate tiếp theo: Anti sửa → Codex review lại và DB integration retest → người dùng QA localhost → xác nhận `done`. **Chưa chuyển S2.**

## 7. Codex Re-review Sau Anti Fixes — 22/10/2026

- **F01–F05 PASS**. Codex đã sửa thêm logic recovery/cache sau 409 và Unicode English fallback, bổ sung regression tests; không thay UI layout hoặc Backend contract. Chi tiết tại [integration review, mục 5](attendance-payroll-s1-integration-review.md).
- Frontend: **56 Vitest + 5 Node tests = 61 PASS**, gồm 13 S1; lint/build PASS, còn bundle size warning đã biết. Backend compile `npx tsc` PASS và **52 tests PASS**, gồm PostgreSQL + HTTP thật/CAS/audit/rollback/schema cleanup. DB blocker trước đã hết.
- Chrome production bundle với controlled API fixtures xác minh focus/transition, reload pending/error/retry, pagination, role guard và 1440/768/375/390px; 1 list refetch sau save. Local API health/UI 200, CORS preflight Origin localhost:5173 trả 204 đúng allow-origin.
- Workflow mới: Codex chủ động sửa logic/state/API/validation/concurrency cả trong frontend; Anti chỉ nhận lỗi thuần UI/UX/CSS/layout/responsive/visual. Người dùng vẫn QA và xác nhận `done`.
- **Chờ QA localhost, chưa DONE, chưa chuyển S2.**
