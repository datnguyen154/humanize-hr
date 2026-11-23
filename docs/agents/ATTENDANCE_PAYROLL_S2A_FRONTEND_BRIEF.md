# Brief Anti — S2A Calendar Exceptions + Monthly Preview

Backend READY cập nhật22/10/2026: v1 + [Exact Contract v1.1 — presets/batch](../modules/work-calendar-s2a-holiday-batch.md). **Frontend v1.1 đã triển khai và Codex review/sửa logic; chỉ còn FUI-01/P2 dưới đây giao Anti.** Backend137 tests/full build và Frontend110 Vitest+5 Node/lint/build PASS; [evidence hiện hành](../codex-reports/attendance-payroll-s2a-v11-integration-review.md). F11 cũ đã PASS. Nội dung nghiệp vụ bên dưới giữ làm tham chiếu, không triển khai lại. Không S2B/activate/Attendance/Payroll, không commit/push hoặc QA done thay người dùng.

## Handoff hiện tại — FUI-01/P2, chỉ UI

- File `frontend/src/pages/admin/attendance/components/HolidayBatchDialog.tsx`, vùng `Calendar Days Table` khoảng dòng818. Batch preview375/390px có cột rất hẹp, lý do xuống từng từ và scroll ngang nội bộ (375px: client244/scroll255). Ảnh trong report review hiện hành.
- Desktop/tablet giữ table; mobile dùng stacked cards hoặc compact rows dễ đọc: ngày, loại ngày, policy/pay, trùng nghỉ tuần, lý do, sẽ tạo mới/đã tồn tại. Dùng dữ liệu và mapping hiện có, không tự tính target hoặc trạng thái.
- Không sửa helper/request/review inputKey/CAS/fingerprint, invalidate hooks hoặc đổi draft blocker thành khóa save. Không di chuyển confirmation ra ngoài DialogContent hoặc bỏ modal/focus/dirty guards đã được browser-test.
- Retest375/390/768/1440 và390x560 với preview nhiều ngày/lý do dài: không horizontal overflow, footer vẫn nhìn thấy, body scroll, controls keyboard và Hủy/discard/focus hoạt động. Không chỉ dùng overflow-hidden để che lỗi.
- Chạy test/lint/build, bổ sung evidence UI; bàn giao Codex re-review trước người dùng QA/done S2A. Không làm lại F11 hoặc refactor ngoài scope.

## Đọc trước

- [ANTIGRAVITY_CONTEXT](ANTIGRAVITY_CONTEXT.md), `AGENTS.md`, `.agents/rules/frontend.md` và skill dispatcher/skills phù hợp UI trên disk.
- [Exact API Contract v1 thực tế](../modules/work-calendar-s2a.md) và [Backend evidence](../codex-reports/attendance-payroll-s2a-backend.md).
- [Addendum v1.1](../modules/work-calendar-s2a-holiday-batch.md) là source of truth mới cho holidayPolicy, presets và batch. Đọc [integration review/F11](../codex-reports/attendance-payroll-s2a-integration-review.md); giữ các sửa logic/CAS/dirty form/focus đã có.
- [Checklist hiện hành](../plans/attendance-payroll-mvp-slices.md). Reuse `features/work-schedule/`, page/components S1, axiosInstance, query keys, DatePicker/RHF/Zod/Dialog/ConfirmDialog/Skeleton và theme tokens hiện có. Không tạo design pattern mới.

## UI cần làm

### Gói bàn giao hiện tại: form nghiệp vụ + mobile F11

1. Trong luồng HOLIDAY, phân biệt “Lễ pháp định” và “Ngày nghỉ bổ sung của doanh nghiệp”. Dùng control quen thuộc theo design system, không redesign phần còn lại.
2. Lễ pháp định: GET holiday-presets theo năm4 chữ số. Hiển thị nhóm/tên/optionLabel/ngày và link sourceUrls; chọn preset điền tên/căn cứ/lý do và **toàn bộ dates của phương án**. Không tự viết danh sách năm/ngày âm lịch ở frontend; không auto chọn option đầu tiên hoặc trộn các phương án Tết/Quốc khánh. Unavailable/notice phải được trình bày tiếng Việt, không gợi ý ngày chưa xác minh.
3. Nghỉ doanh nghiệp: tên/ngày/lý do/quyết định nội bộ, HR chọn isPaid rõ ràng; không mặc định paid/unpaid, không tự chèn Điều112. Với nhiều ngày, mỗi ngày chuyển thành HOLIDAY payload có policy COMPANY; UI cho kiểm tra/ngày loại trừ, không coi mọi ngày trong range là lễ pháp định.
4. Luồng nhiều ngày: chọn/xem/chỉnh nội dung → POST batch-preview → review calendarDays/toCreate/skipped/issues và tổng số định tạo → HR xác nhận → **một POST batch** cùng input+planFingerprint. Không loop POST từng ngày, không Promise.all CRUD để giả atomic. Preview không ghi; lỗi không được báo partial success. Không đóng/reset input khi request lỗi.
5. Hiển thị tách HOLIDAY/nghỉ tuần/COMPENSATORY_OFF, kể cả HOLIDAY trùng isBaseWeeklyOff. includeCompensatoryOff phải được HR xác nhận; không tự tính target/ngày nghỉ bù trên frontend. Skipped hiện “Đã tồn tại, không tạo lại”; conflict khác dữ liệu phải xử lý, không silent overwrite.
6. Sau thay đổi field/date/option/includeCompensatoryOff/version/revision, clear plan cũ và cần preview lại; disable commit trong pending/chưa có plan khớp input. Dirty close/reload/đổi loại phải có xác nhận như pattern đã sửa. 409 REVISION_CONFLICT khác PLAN_CHANGED/UNRESOLVED/conflict nghiệp vụ; giữ form và hướng người dùng xử lý đúng, không auto retry mutation.
7. Sau batch success, reuse invalidateCalendarMutation của version, đúng1 lần; không thêm refetch đồng thời. Query keys mới cho catalog có year, không invalidate Attendance/Payroll. Codex sở hữu logic/API/state/validation; không đổi Backend/contract để làm UI thuận tiện, ghi rõ điểm cần Codex xử lý trong review.
8. Detail/edit/list: hiện phân loại và nhãn hưởng lương/chưa phân loại phù hợp từ DTO. Legacy thiếu policy không được mặc định pháp định/PAID; khi reclassify cần HR xác nhận. Edit giữ policy, presetId và source đúng; không coi COMPENSATORY_OFF như thêm ngày lễ hưởng lương. Monthly Preview chưa tính payableDays/salary.
9. **F11 responsive:** sửa tại WorkScheduleSettingsPage tab strip, CalendarTabContent grid/toolbar/selector và MonthlyPreviewCard7-column grid.375/390px hiện intrinsic width≈424px, tab right440px bị che; không lấy document.scrollWidth nhỏ làm bằng chứng đạt vì layout ngoài đang clip. Dùng min-w-0/co/wrap hợp lý và day-cell compact, không che lỗi bằng overflow-hidden. Giữ desktop/tablet, test375/390/768/1280 và modal390×560 có footer cố định/body scroll. Ảnh và số đo trong integration review.
10. Modal confirmation đã sửa focus ownership (Radix khác version): không bỏ modal={confirmAction===null} hoặc chuyển confirmation ra khỏi vòng đời content mà chưa browser test. Test Hủy giữ input, discard trả focus, trang vẫn clickable sau đóng.

Phạm vi chưa làm trong lượt Backend: không có UI presets/batch mới. Anti thực hiện UI theo contract; Codex sẽ review/sửa logic tích hợp, người dùng QA/done sau cùng.

### Luồng v1 cần giữ

Trong settings hiện có, đề xuất tab `?tab=calendar`: chọn DRAFT và tháng/năm; list ngoại lệ với pagination/filter; create/edit/delete có lý do; preview tháng và issues. Không phá form/route S1.

- HOLIDAY: date/name/sourceReference/reason + holidayPolicy theo v1.1; v1 legacy vẫn đọc được nhưng không dùng làm mặc định cho form mới.
- COMPENSATORY_OFF: date/sourceHolidayDate/reason; nguồn HOLIDAY cùng DRAFT, không dựa trang list đang mở như toàn bộ nguồn. Nếu cần chọn nguồn thì dùng API đã có với pagination đầy đủ, không hardcode danh sách hoặc gọi API ngoài.
- SWAP: offDate/workDate/reason trong **một form/request**, không tách hai mutation.
- WORK_OVERRIDE: date/startTime/endTime + một break/reason theo contract.
- Date API `YYYY-MM-DD`, UI `DD/MM/YYYY`, time `HH:mm`; timezone cố định Asia/Ho_Chi_Minh. Không dùng `toISOString()` để biến civil date từ browser.

## API / state cần giữ đúng

6 API v1 giữ nguyên, bổ sung3 API v1.1: GET `/work-calendar/holiday-presets?year`, POST `/work-calendar/versions/:versionId/exceptions/batch-preview`, POST `.../exceptions/batch`. Payload/envelope/error chi tiết ở addendum, không suy từ API import Excel hoặc gọi backend ngoài contract.

- List trả `{data:[],meta,scheduleRevision}`; detail/create/PATCH trả `{data:{exception,scheduleRevision}}`; delete trả `{data:{removedExceptionId,scheduleRevision}}`; preview trả `{data:CalendarPreviewDto}`. Dùng đúng Axios envelope, không unwrap thừa.
- POST/PATCH gửi `{expectedRevision,exception}` từ snapshot form; DELETE gửi JSON `{expectedRevision,reason}`. Không nhận parent revision background mới rồi gắn vào form cũ.
- Query keys có versionId + toàn filters/page hoặc year/month. Success invalidate parent list/detail, exception list/detail và preview của version liên quan; không invalidate Attendance/Payroll hoặc gọi trùng invalidate + refetch. Không set partial mutation response đè WorkScheduleDto cache.
- 409 giữ input/revision; reload chủ động GET event detail + S1 parent detail. Chỉ áp dữ liệu mới khi hai response cùng revision và user xác nhận bỏ phần sửa. Reload lỗi/mismatch/404 phải giữ input và retry được; không tự đóng/reset hoặc đổi lỗi thành create. Cảnh báo unsaved data theo pattern S1.
- Khi đổi DRAFT/tháng/filter, không hiển thị dữ liệu cũ như thuộc lựa chọn mới; disable thao tác race khi cần, chống double submit. Pagination không vượt cuối lúc đang chờ.
- Preview đọc đủ nguồn ở server, không tự tính ngày/phút/target nghỉ bù trên frontend. `summary.isComplete` chỉ tháng đang xem; `validation.hasBlockingIssues` toàn DRAFT. Null phải hiện chưa xác định, không render 0. Có thể tháng complete nhưng tháng khác có BLOCKER.
- Empty/loading/error/retry rõ ràng, lỗi tiếng Việt, không raw English; auth interceptor giữ nguyên. Mobile và keyboard/focus/close-return-trigger theo S1. Không có nút activate hoặc label cho rằng đã tính công/lương.

## Chạy / kiểm thử / bàn giao

- DB localhost đã áp migration S2A từ task trước. Phần preset/batch không đổi schema, không migration mới. Backend đã được người dùng dừng để full build; mở lại bằng `npm run dev` tại `backend/`, base `http://localhost:3000/api`, health `/health`. Không seed/reset/migrate lại để có fixture. Dùng ADMIN local qua Login, không đưa credential/token vào report.
- Frontend `npm run dev` tại `frontend/`, URL `http://localhost:5173/admin/attendance/settings?tab=calendar` sau khi bổ sung tab. Không tự đổi env/CORS/deployment.
- Tests: payload mỗi kind/date-only/full PATCH/delete body, duplicate submit, 409/reload fail/mismatch/unsaved data, pagination/cache, null/partial/whole-DRAFT issues; UI desktop/mobile/focus/loading/error/retry. Chạy tests/lint/build frontend và báo đúng phần chưa test với API thật.
- Tests mới: chọn preset đủ dates, option exclusivity, unavailable year, company isPaid explicit, preview không ghi, thay input bỏ plan cũ, không loop CRUD, commit đúng fingerprint, all-skipped, các409 phân biệt, chống double submit, một invalidation, mobile review nhiều ngày không overflow. Không dùng mock PASS thay QA browser/API thật.
- Report frontend tại `docs/codex-reports/attendance-payroll-s2a-frontend-report.md`; không tự đánh user QA/done. Codex sở hữu logic/API/state/validation/concurrency và review/sửa; Anti sở hữu UI/UX/CSS/layout/responsive/visual. Không mở S2B, commit hoặc push.
