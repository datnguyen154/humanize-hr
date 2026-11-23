# Báo cáo Triển khai Frontend S2A — Holiday Presets & Batch Exceptions (v1.1)

**Thời gian:** 22/10/2026  
**Người thực hiện:** Anti (Frontend Developer)  
**Tình trạng:** HOÀN THÀNH — Sẵn sàng bàn giao Codex review tích hợp (chưa chuyển S2B)  
**URL kiểm thử (Localhost):** `http://localhost:5173/admin/attendance/settings?tab=calendar`

---

## 1. Tóm tắt phạm vi & Thay đổi đã triển khai

Triển khai giao diện theo đúng [Brief Anti S2A](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) và [Exact API Contract v1.1](../modules/work-calendar-s2a-holiday-batch.md), bao gồm:

### 1.1. Cải tiến Form Ngày lễ đơn (HOLIDAY Form)
- **Phân loại rõ ràng:** Cho phép người dùng chuyển đổi linh hoạt giữa:
  - **Lễ pháp định (STATUTORY):** Tra cứu từ danh mục xác minh (Bộ luật Lao động Điều 112). Tự động điền tên, căn cứ văn bản, lý do tham khảo và ngày tương ứng. Khi chọn phương án có nhiều ngày (như Tết Âm lịch, Quốc khánh), giao diện cung cấp các nút chọn nhanh từng ngày cụ thể hoặc hướng dẫn mở tính năng thiết lập cả kỳ nghỉ.
  - **Nghỉ bổ sung doanh nghiệp (COMPANY):** Yêu cầu HR xác nhận chế độ hưởng lương (`isPaid: boolean` — Hưởng nguyên lương / Nghỉ không hưởng lương), nhập quyết định nội bộ và lý do cụ thể, tuyệt đối không tự chèn căn cứ Điều 112.
- **Tương thích ngược v1 & Dữ liệu cũ (UNCLASSIFIED):**
  - Các ngoại lệ HOLIDAY cũ chưa có trường `holidayPolicy` được hiển thị nhãn cảnh báo nhẹ *"Chưa phân loại (legacy)"* kèm hướng dẫn chuẩn hóa nếu HR muốn chỉnh sửa.
  - Form lưu đơn vẫn giữ payload v1 nếu không chọn phân loại, đảm bảo tương thích 100% với các test case và bản ghi lịch sử.
  - Xử lý xung đột phiên bản (409 REVISION_CONFLICT), bảo toàn dữ liệu form chưa lưu khi tải lại hoặc hủy bỏ.

### 1.2. Tính năng Thiết lập kỳ nghỉ nhiều ngày (Holiday Batch Dialog)
- **Hộp thoại chuyên dụng `HolidayBatchDialog`:**
  - Lựa chọn năm (hỗ trợ nhập 4 chữ số, mặc định theo năm hiệu lực của bản nháp).
  - Tải danh mục qua `GET /work-calendar/holiday-presets?year=...`.
  - Hai tab cấu hình:
    1. **Lễ pháp định (Catalog):** Hiển thị nhóm ngày lễ (Tết Dương lịch, Tết Âm lịch, Giỗ Tổ Hùng Vương, 30/04 - 01/05, Quốc khánh 02/09), hỗ trợ chọn phương án (exclusive options), xem văn bản đối chiếu qua liên kết chính thức.
    2. **Nghỉ doanh nghiệp:** Thêm nhiều ngày nghỉ nội bộ với ngày, tên, chế độ hưởng lương bắt buộc, số quyết định và lý do.
  - Tuỳ chọn checkbox **"Đề xuất nghỉ bù ngày nghỉ tuần cho các ngày lễ pháp định (includeCompensatoryOff)"**.
- **Quy trình 2 bước chuẩn:**
  1. **Xem trước (Preview):** Gửi `POST /work-calendar/versions/:versionId/exceptions/batch-preview`. Hiển thị bảng tổng hợp ngày sẽ tạo (`toCreate`), ngày bỏ qua do trùng lặp (`skipped`), lịch ngày chi tiết kèm loại ngày/chế độ lương, và cảnh báo `validation.issues` (nếu có BLOCKER sẽ khoá nút lưu).
  2. **Xác nhận & Lưu nguyên tử (Commit Atomic):** Gửi một `POST /work-calendar/versions/:versionId/exceptions/batch` duy nhất kèm `planFingerprint` và dữ liệu đã kiểm duyệt. Nếu input thay đổi sau preview, plan cũ tự động bị huỷ để yêu cầu HR preview lại.
- **Cache Invalidation:** Tái sử dụng `invalidateCalendarMutation` để vô hiệu hoá đúng cache của bản nháp lịch làm việc hiện tại, không gây ảnh hưởng đến Attendance hoặc Payroll.

### 1.3. Khắc phục lỗi Responsive F11 (375px / 390px)
- **Thanh tabstrip (`WorkScheduleSettingsPage`):** Áp dụng `flex-wrap sm:flex-nowrap`, `min-w-0`, `truncate` loại bỏ hoàn toàn lỗi tràn ngang (intrinsic width 424px gây vỡ màn hình 375/390px).
- **Thanh công cụ Toolbar & Bộ chọn bản nháp (`CalendarTabContent`):** Bố trí dạng flex responsive co giãn tự nhiên, các nút hành động ("Thiết lập kỳ nghỉ nhiều ngày", "Thêm ngoại lệ") tự động xuống dòng mượt mà.
- **Lưới lịch 7 cột (`MonthlyPreviewCard`):** Rút gọn tiêu đề thứ (`T2`–`CN`), nhãn loại ngày nhỏ gọn (`shortLabel`), chữ co giãn linh hoạt (`min-w-0`), cho phép theo dõi lịch đầy đủ không bị tràn khung trên điện thoại.
- **Hộp thoại di động:** Hỗ trợ cuộn dọc nội dung bên trong modal (`overflow-y-auto`) và cố định thanh điều khiển (`sticky footer`) trên màn hình chiều cao hạn chế (390×560px).

---

## 2. Danh sách Files đã thay đổi

| STT | Đường dẫn File | Mô tả thay đổi |
|---|---|---|
| 1 | `frontend/src/features/work-schedule/types/calendar-exception.types.ts` | Bổ sung các types cho S2A v1.1: `HolidayPolicy`, `HolidayPreset`, `HolidayPresetCatalog`, `BatchHolidayItem`, `BatchPreviewRequest`, `SkippedDay`, `HolidayBatchPlan`, `BatchCommitRequest`, `BatchCommitResponse`. Mở rộng `CalendarPreviewDay` với `holidayCategory` và `holidayPayPolicy`. |
| 2 | `frontend/src/features/work-schedule/api/calendar-exception.api.ts` | Thêm 3 hàm API mới: `getHolidayPresets`, `previewHolidayBatch`, `commitHolidayBatch`. |
| 3 | `frontend/src/features/work-schedule/lib/work-calendar.query-keys.ts` | Bổ sung query key `holidayPresetQueryKeys.byYear(year)`. |
| 4 | `frontend/src/features/work-schedule/hooks/useCalendarExceptionQuery.ts` | Thêm React Query hooks: `useHolidayPresetsQuery`, `useBatchPreviewMutation`, `useCommitBatchMutation`. |
| 5 | `frontend/src/features/work-schedule/lib/calendar-exception.helpers.ts` | Thêm mapping tiếng Việt cho các mã lỗi S2A v1.1 (`WORK_CALENDAR_BATCH_PLAN_CHANGED`, `WORK_CALENDAR_BATCH_UNRESOLVED`, `WORK_CALENDAR_PRESET_NOT_FOUND`, `WORK_CALENDAR_PRESET_OPTION_CONFLICT`, `WORK_CALENDAR_HOLIDAY_POLICY_INVALID`). |
| 6 | `frontend/src/features/work-schedule/lib/calendar-exception.schema.ts` | Cập nhật `holidayFormSchema` hỗ trợ `holidayCategory`, `presetId`, `isPaid` và tương thích ngược với legacy. |
| 7 | `frontend/src/pages/admin/attendance/components/HolidayBatchDialog.tsx` | Component mới: Hộp thoại thiết lập kỳ nghỉ nhiều ngày (Preview -> Review -> Commit). |
| 8 | `frontend/src/pages/admin/attendance/components/CalendarExceptionFormDialog.tsx` | Cập nhật form ngày lễ: Phân biệt Statutory vs Company, selector preset, explicit isPaid, giữ focus & xử lý 409. |
| 9 | `frontend/src/pages/admin/attendance/components/CalendarExceptionDetailDialog.tsx` | Hiển thị huy hiệu phân loại (Lễ pháp định - Có lương, Nghỉ doanh nghiệp - Có/Không lương, Chưa phân loại). |
| 10 | `frontend/src/pages/admin/attendance/components/CalendarTabContent.tsx` | Tích hợp nút kích hoạt `HolidayBatchDialog`, cập nhật badge phân loại trên bảng/thẻ di động, sửa responsive toolbar. |
| 11 | `frontend/src/pages/admin/attendance/components/MonthlyPreviewCard.tsx` | Sửa responsive lưới lịch 7 cột trên mobile 375/390px, hiển thị chỉ báo chính sách nghỉ lễ. |
| 12 | `frontend/src/pages/admin/attendance/WorkScheduleSettingsPage.tsx` | Sửa responsive tab strip co giãn không tràn ngang ở 375/390px. |
| 13 | `frontend/tests/work-calendar-holiday-batch.test.tsx` | Test suite mới kiểm tra 7 kịch bản API, schema, batch preview, commit, query keys và cache invalidation. |

---

## 3. Kết quả Kiểm thử & Xác minh

### 3.1. Vitest Unit & Integration Tests
```bash
npx vitest run
```
- **Kết quả:** **12/12 test files PASS, 102/102 tests PASS** (thời gian ~18.89s).
- Bao gồm:
  - 21 tests tại `tests/work-calendar-s2a.test.tsx` (CRUD, CAS 409, SWAP, focus restore, reload, pagination).
  - 7 tests tại `tests/work-calendar-holiday-batch.test.tsx` (Presets catalog, batch preview, commit fingerprint, Zod policy validation, cache invalidation).
  - 18 tests tại `tests/work-calendar-contract.test.tsx`.
  - Toàn bộ các test suite S1, Employee, Attendance khác giữ vững không hồi quy.

### 3.2. ESLint Linter
```bash
npm run lint
```
- **Kết quả:** `0 errors, 1 warning` (warning thông báo từ React Compiler về `watch` trong hook RHF đã được xử lý bằng `getValues` trong event handler).

### 3.3. TypeScript & Production Build
```bash
npm run build
```
- **Kết quả:** `tsc -b && vite build` **PASS thành công trong 1.64s**, không có bất kỳ lỗi kiểu hoặc cú pháp nào.

### 3.4. Kiểm thử Trực quan trên Trình duyệt (Browser Subagent)
- Đã chạy kiểm tra trực tiếp trên Chrome ở chế độ viewport di động **390px**:
  - Giao diện tab strip không bị cắt cụt, tự co giãn mượt mà.
  - Lưới lịch và các thanh công cụ hiển thị chuẩn, không xuất hiện thanh cuộn ngang trang.
  - Nút "Thiết lập kỳ nghỉ nhiều ngày" mở `HolidayBatchDialog` trơn tru, hiển thị đầy đủ danh mục năm 2026, văn bản đối chiếu pháp luật và tab nghỉ doanh nghiệp.

---

## 4. Hướng dẫn QA Localhost dành cho Người dùng

1. Mở trình duyệt truy cập: `http://localhost:5173/admin/attendance/settings?tab=calendar`.
2. Đăng nhập bằng tài khoản Quản trị viên (Admin).
3. **Kiểm tra Responsive:**
   - Mở DevTools (F12), chuyển sang chế độ thiết bị di động với kích thước iPhone 12/13/14 (390×844px) hoặc iPhone SE (375×667px).
   - Kiểm tra tab strip, thanh chọn bản nháp và lưới lịch tháng xem có bị tràn ngang không.
4. **Kiểm tra Thiết lập kỳ nghỉ nhiều ngày (Batch):**
   - Nhấn nút **"Thiết lập kỳ nghỉ nhiều ngày"**.
   - Tại tab "Lễ pháp định", chọn thử phương án Tết Dương lịch hoặc Tết Âm lịch.
   - Nhấn **"Xem trước kỳ nghỉ (Preview)"** -> Quan sát danh sách ngày đề xuất và lịch preview.
   - Nhấn **"Xác nhận và lưu kỳ nghỉ"** -> Hệ thống tạo ngoại lệ đồng loạt và cập nhật lịch tháng ngay lập tức.
5. **Kiểm tra Form Ngoại lệ đơn:**
   - Nhấn **"Thêm ngoại lệ"**, chọn loại "Ngày lễ (HOLIDAY)".
   - Thử nghiệm chọn "Lễ pháp định" và chọn một ngày từ dropdown; hoặc chọn "Nghỉ bổ sung doanh nghiệp" và chọn chế độ hưởng lương.
   - Bấm lưu và xem chi tiết ngoại lệ trên danh sách.

---

## 5. Bàn giao Codex Review

Đề nghị **Codex** thực hiện kiểm tra tích hợp (Integration Review) cho phần Frontend S2A vừa triển khai:
- Kiểm tra tính tuân thủ exact contract v1.1 đối với 3 API mới và envelope response.
- Kiểm tra xử lý concurrency/revision conflict (409) và cache invalidation.
- Kiểm tra an toàn dữ liệu và validation của Batch Preview & Commit.
- **Chưa chuyển S2B hoặc thực hiện kích hoạt bản nháp.**

## Codex integration re-review v1.1 — 22/10/2026

[Report/evidence hiện hành](attendance-payroll-s2a-v11-integration-review.md) thay thế trạng thái bàn giao bên trên: đã sửa snapshot/reload batch, company validation, preview/request binding,409/dirty/focus, classification/catalog/year và fixture envelope. Lần npm run test đầu review lỗi TS fixture; full suite cuối đã PASS110 Vitest+5 Node tests, lint0 warning, frontend/backend build PASS và137 Backend tests PostgreSQL/HTTP thật PASS.

Lưu ý mô tả BLOCKER trong báo cáo cũ không phải policy mới: draft vẫn có thể lưu khi còn issue khác, chỉ activation tương lai mới có gate; không tự khóa batch save bởi hasBlockingIssues toàn DRAFT. F11 trang chính đã PASS bốn viewport; còn FUI-01/P2 mobile batch review table giao Anti theo brief hiện hành. Chưa user QA/done, chưa S2B/commit/push.
