# Báo cáo chấm công tháng và xuất Excel

## Phạm vi đã được duyệt

Người dùng đồng ý bổ sung Backend hiện có để báo cáo không phải tải từng trang
chấm công ở Frontend. Không thêm dependency, dịch vụ trả phí, migration hoặc cấu hình deploy.

## Contract mới

- `GET /api/attendance/monthly-report?year=2026&month=10`
- `GET /api/attendance/monthly-report/export?year=2026&month=10`
- Cả hai yêu cầu Bearer token và ADMIN. Không thay contract endpoint Attendance cũ.
- Month/year bắt buộc, là số nguyên dạng chuỗi; month 1–12, year 1–9999.
  Đây là phạm vi biểu diễn năm, không đặt năm bắt đầu dữ liệu hay giới hạn lịch sử HRM.
- Query thiếu, sai, array hoặc object trả 400. Không tự dùng tháng hiện tại ở Backend.
- API JSON trả `{ data: { period, employees, totals } }`.
- `employees`: employeeId, employeeCode, fullName, totalRecords, present, late,
  missingCheckOut. Sắp xếp theo employeeCode tăng dần.
- `totals`: totalEmployees và tổng bốn chỉ số trên.
- Excel trả XLSX binary và Content-Disposition với filename `attendance-YYYY-MM.xlsx`.

## Định nghĩa dữ liệu

- Lọc theo attendanceDate: đầu tháng bao gồm, đầu tháng tiếp theo không bao gồm.
- Attendance hiện lưu attendanceDate là ngày lịch công ty Asia/Bangkok tại UTC midnight.
  Chọn kỳ mặc định ở Frontend cũng dùng Asia/Bangkok, không phụ thuộc timezone thiết bị.
- totalRecords = PRESENT + LATE; present/late là số bản ghi tương ứng.
- missingCheckOut = số bản ghi có checkOutTime null, bao gồm cả bản ghi đang làm hôm nay.
- Chỉ có nhân viên có bản ghi trong kỳ; không đưa nhân viên không chấm công vào báo cáo như nghỉ không phép.
- Không tính ngày công quy đổi, giờ công chuẩn, giờ nghỉ trưa, vắng mặt hoặc tăng ca.

## File và trách nhiệm

Backend:
- `attendance-report.types.ts`: kiểu kỳ báo cáo, dòng và tổng số liệu.
- `attendance.repository.ts`: hai groupBy và một truy vấn thông tin nhân viên trong
  transaction RepeatableRead; không đọc toàn bộ bản ghi, không N+1, không skip/take.
- `attendance-report.service.ts`: validation kỳ, ranh giới tháng, tổng số liệu và orchestration export.
- `attendance-report-excel.generator.ts`: ExcelJS đang có, cột tiếng Việt, ô số numeric,
  frozen header, auto-filter, bảo vệ text có prefix công thức theo pattern export Employee.
- `attendance.controller.ts`, `attendance.routes.ts`: JSON/binary response và middleware auth/role.
- `backend/tests/attendance-monthly-report.test.cjs`: 7 test bổ sung.

Frontend:
- `attendance-report.types.ts`: contract dùng bởi API và UI.
- `attendance.api.ts`: đọc data.data; export dạng blob, dùng Axios/auth hiện tại.
- `useAttendanceHistoryQuery.ts`: thêm monthlyReport key vào namespace attendance hiện có.
- `useAttendanceMonthlyReportQuery.ts`: query theo kỳ, AbortSignal, staleTime 5 phút,
  gcTime 10 phút, không refetch khi focus, vẫn refetch thủ công.
- `useExportAttendanceReportMutation.ts`: pending/error cho thao tác tải Excel.
- `shared/lib/download-blob.ts`: object URL, anchor download và cleanup theo pattern có sẵn.
- `AttendanceMonthlyReportPage.tsx`: container query/mutation và rendering KPI, bảng,
  mobile cards, loading/error/retry/empty. Dùng một metrics config cho KPI/cột/field mobile.
- `AttendanceListPage.tsx`: thêm link Tổng hợp tháng, giữ search/filter/pagination cũ.
- `app/router.tsx`: route `/admin/attendance/report` trong ProtectedRoute + ADMIN RoleGuard hiện có.
- `frontend/tests/attendance-monthly-report.test.tsx`: 7 test bổ sung.
- `docs/modules/attendance.md`: cập nhật contract API báo cáo/export mới.

## Luồng hoạt động

1. Admin mở Chấm công → Tổng hợp tháng. Query tải kỳ hiện tại theo timezone công ty.
2. Chọn tháng/năm và bấm Xem báo cáo mới áp dụng kỳ; chỉnh input không gửi request mỗi ký tự.
3. Backend đếm dữ liệu toàn tháng trong DB, trả mỗi nhân viên một dòng và totals.
4. React Query lưu cache theo month/year; Làm mới chỉ refetch, không reload trang.
5. Xuất Excel gửi một request riêng cho kỳ đang áp dụng, không cho submit lặp trong pending.
6. Backend gọi chung getMonthlyReport rồi tạo workbook; Frontend tải blob và giải phóng object URL.

Export lấy snapshot mới ở thời điểm bấm, không phải snapshot của cache màn hình.
Nếu có chấm công mới sau khi tải trang, Excel có thể mới hơn UI; bấm Làm mới để đối chiếu.
Không invalidate query sau export vì đây là thao tác chỉ đọc.

## Verification

- Frontend `npm run lint`: PASS.
- Frontend `npm run build`: PASS, vẫn có cảnh báo bundle >500 kB đã tồn tại.
- Frontend `npm test`: 33 Vitest + 5 Node helper test = 38 PASS.
- Backend `npm run build`: PASS.
- Backend `node --test tests/attendance-monthly-report.test.cjs tests/admin-dashboard.test.cjs`:
  13 PASS (7 mới + 6 regression).
- Backend tests: query validation, ranh giới tháng nhuận/qua năm/năm <100, số liệu >100
  không bị phân trang, transaction, totals/zero/error, đọc lại workbook thật, chống text formula,
  HTTP 401/403/400/200, response JSON và header/XLSX binary.
- Frontend tests: loading, số liệu thật, desktop/mobile markup, apply kỳ, năm sai, retry,
  empty, khóa export và period controls, export đúng kỳ áp dụng, toast tiếng Việt khi lỗi.
- Playwright Chromium trên production preview, API giả lập: 1440/768/390/375px PASS;
  table chỉ hiện từ md, mobile cards hiện đúng, scrollWidth không vượt viewport,
  đổi kỳ tới 12/2020 hoạt động, không có pageerror. Đã xem screenshot desktop/mobile.
- `git diff --check`: PASS. Không commit/push.

Test DB sử dụng mock repository/transaction; HTTP chạy router và middleware thật với dữ liệu giả lập.
Chưa chạy truy vấn trên PostgreSQL production, chưa deploy lên Render/Vercel, chưa manual test WPS/Excel.

Vite dev dependency optimizer bị chờ lâu trong môi trường kiểm tra; đã dừng và dùng production
preview trên localhost:5173 để kiểm tra browser. Không sửa config hoặc dependency để xử lý ngoài scope.

## Manual test sau deploy

1. Deploy Backend có hai endpoint mới trước khi test Frontend mới.
2. ADMIN mở Chấm công → Tổng hợp tháng; đối chiếu từng nhân viên và totals với bản ghi toàn kỳ.
3. Thử tháng rỗng, tháng có >100 bản ghi, tháng 2 nhuận và tháng 12.
4. Check-in/check-out ở tài khoản Employee rồi Làm mới báo cáo Admin; kiểm tra thiếu check-out giảm.
5. Chọn kỳ nhưng chưa bấm Xem báo cáo: export vẫn thuộc kỳ báo cáo đang hiển thị.
6. Xuất Excel, mở WPS/Excel, kiểm tra kỳ/tên/số liệu numeric và tất cả nhân viên trong kỳ.
7. Chưa đăng nhập hoặc dùng EMPLOYEE không truy cập được API/route report của Admin.
8. Render cold start/lỗi mạng: loading/error/retry, không hiển thị raw English hoặc tổng 0 giả.

## Cách giải thích khi phỏng vấn

“Em để DB tổng hợp dữ liệu toàn tháng, không cộng từ trang list nên không bị thiếu số liệu.
React Query cache riêng từng kỳ và cho làm mới thủ công để giảm request tới Render Free.
Excel và màn hình dùng chung logic Backend. Em kiểm thử ranh giới tháng, phân quyền,
trạng thái UI và file Excel, đồng thời không coi việc thiếu chấm công là nghỉ không phép.”

## Task tiếp theo

Yêu cầu điều chỉnh công của Employee và luồng Admin xét duyệt có lịch sử.
Review contract trước implementation; bắt đầu khi người dùng nhắn “done” hoặc yêu cầu tiếp tục.
