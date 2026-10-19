# Task 5 - Điều chỉnh chấm công

## Luồng đã triển khai

- Employee vào Lịch sử chấm công -> Yêu cầu điều chỉnh -> Gửi yêu cầu. Chọn ngày,
  xem giờ hiện có (nếu có), nhập giờ đề xuất và lý do. Backend lấy employee từ JWT.
- Yêu cầu ở trạng thái PENDING; Employee chỉ thấy yêu cầu của mình. Admin vào
  Chấm công -> Yêu cầu điều chỉnh, xem dữ liệu gốc/đề xuất và duyệt hoặc từ chối.
- Duyệt cập nhật/tạo Attendance trong cùng transaction với kết quả duyệt; từ chối
  không sửa Attendance. Lịch sử giữ người duyệt, thời điểm và ghi chú.
- Backend chống duplicate pending cùng ngày bằng partial unique index; so sánh
  `updatedAt` trước khi ghi để tránh ghi đè check-out mới; chỉ claim PENDING một lần.
- Frontend invalidates attendance queries và dashboard sau duyệt; không polling.

## File chính

- Backend: Prisma schema/migration, `attendance-adjustment.repository.ts`,
  `attendance-adjustment.service.ts`, `attendance-adjustment.controller.ts`,
  `attendance.routes.ts`, `attendance.service.ts` (tái sử dụng cutoff giờ).
- Frontend: `features/attendance` API/types/hooks/lib, ba trang chung trong
  `pages/attendance-adjustments`, router, link từ Admin/Employee Attendance.
- Test: `backend/tests/attendance-adjustment.test.cjs`,
  `frontend/tests/attendance-adjustments.test.tsx`.

## Giới hạn và manual test còn lại

- Chưa chạy migration trên PostgreSQL production; phải deploy migration trước khi
  mở UI để tránh lỗi thiếu bảng. Không có thao tác ghi database thật trong test.
- Chưa có chính sách khóa kỳ công/bảng lương, upload chứng từ, thông báo tự động
  hoặc ca qua đêm. Admin cần đối chiếu thủ công trước khi duyệt kỳ đã chốt.
- Manual test hai tài khoản: sửa bản ghi hiện có, ngày quên check-in, từ chối,
  hai Admin duyệt gần đồng thời, bản ghi thay đổi khi đang chờ, lọc/phân trang,
  mobile và lịch sử sau khi refresh. Kiểm tra migration partial unique index.

## Kiểm tra tự động và giao diện

- Backend: build Prisma/TypeScript PASS; 8 test service/HTTP PASS với mock database.
- Frontend: lint, build và test PASS (36 Vitest, 5 URL helper). Build có cảnh báo
  bundle chính trên 500 kB, đã tồn tại trong ứng dụng; chưa tách chunk ở task này.
- Playwright smoke với API giả lập: danh sách Employee 390px và Admin desktop
  render đúng, không tràn ngang. Ảnh `task5-employee-smoke.png` và
  `task5-admin-smoke.png`. Đây không thay thế manual test API/PostgreSQL thật.

## Local manual test bug fix - migration

- Ngày 04/10/2026, `GET` danh sách và `POST` gửi yêu cầu trên backend local trả
  500 vì migration `20261004150000_add_attendance_adjustment_requests` chưa được
  áp dụng vào PostgreSQL `localhost:5432/hrm_db`. Lệnh `prisma migrate status`
  xác nhận migration đang pending.
- Đã chạy `prisma migrate deploy` trên **database local**. Sau đó `migrate status`
  báo schema up to date và Prisma `attendanceAdjustmentRequest.count()` chạy được.
- HTTP smoke: `GET /api/attendance/adjustment-requests?page=1&limit=10` với
  Employee token trả 200, có `data` và `meta`. POST với ngày cố ý sai trả 400
  validation, không còn 500. Chưa gửi POST hợp lệ vì sẽ tạo dữ liệu thật; cần
  người dùng thử lại trên UI.
- `npm run dev` của backend không tự chạy migration; `npm start` có bước
  `prisma migrate deploy`. Môi trường khác phải kiểm tra và áp migration riêng.

## Bổ sung thông báo Admin - 19/10/2026

- Manual test xác nhận Employee gửi và Admin duyệt được, nhưng chuông không có
  thông báo. Nguyên nhân: service tạo yêu cầu chưa ghi Notification và frontend
  chỉ ánh xạ icon/đường dẫn cho LEAVE_REQUEST.
- Thêm enum ATTENDANCE_ADJUSTMENT_CREATED và entity ATTENDANCE_ADJUSTMENT bằng
  migration `20261019100000_add_attendance_adjustment_notification`.
- Tạo yêu cầu và thông báo trong cùng Prisma transaction, theo pattern Leave.
  Notification service lấy tất cả User ADMIN/ACTIVE và ghi một batch createMany.
  Chưa có người duyệt được chỉ định nên tất cả Admin đang hoạt động nhận thông báo.
- NotificationBell hiển thị icon điều chỉnh công; bấm thông báo đánh dấu đã đọc
  và mở `/admin/attendance/adjustments/:id`. Luồng nghỉ phép giữ nguyên.
- Không thêm polling mới: unread-count dùng chu kỳ 30 giây có sẵn, dừng khi tab
  ở nền; danh sách lấy khi mở chuông. Thông báo mới không phải push real-time.
- Không backfill yêu cầu cũ. Manual test bằng yêu cầu mới sau bản sửa.
- Migration đã áp dụng ở PostgreSQL local `hrm_db`, chưa deploy production.
  Backend đã được khởi động lại ở port 3000 sau khi generate Prisma Client.
- Kiểm tra: backend build PASS, 10 test attendance adjustment PASS; frontend lint,
  build PASS, 38 Vitest và 5 URL helper PASS. Build còn cảnh báo bundle lớn có sẵn.
  Test mới kiểm tra người nhận, loại/entity, transaction lỗi và điều hướng chuông
  cho cả nghỉ phép/điều chỉnh công. Manual test luồng hai tài khoản còn cần chạy lại.

## Phỏng vấn về thông báo

"Khi nhân viên gửi yêu cầu, em lưu yêu cầu và thông báo trong cùng transaction.
Các Admin đang hoạt động nhận thông báo riêng để mỗi người có trạng thái đã đọc
độc lập. Frontend dùng Notification Center hiện có, bấm thông báo đi tới chi tiết.
Hệ thống kiểm tra số chưa đọc định kỳ, chưa dùng WebSocket."

## Admin detail modal - 19/10/2026

- Thêm link "Quay lại danh sách chấm công" ở trang yêu cầu Admin.
- Các item Admin chuyển từ Link sang button mở shadcn Dialog ngay tại danh sách;
  giữ bộ lọc, tìm kiếm, phân trang và URL khi mở/đóng. Item Employee vẫn là Link.
- Tách `components/AttendanceAdjustmentDetails.tsx` từ trang detail: dùng lại query,
  mutation, mapping, xác nhận duyệt/từ chối và error handling. Trang detail cũ vẫn
  dùng component này để không phá liên kết NotificationBell hoặc Employee.
- `components/AttendanceAdjustmentDetailDialog.tsx` quản lý shell và khóa đóng
  khi pending. Header/footer cố định, body scroll; đóng unmount component để reset
  ghi chú/error/confirmation. Khôi phục focus về item mở; nếu item biến mất sau
  duyệt thì focus về link quay lại.
- Sau duyệt, mutation hiện có invalidate query và cập nhật detail. Modal giữ mở,
  hiển thị người duyệt/kết quả, ẩn action với đơn không còn PENDING.
- Không thay API, backend, contract, route hay mutation hook.
- Verify: lint/build PASS (cảnh báo bundle lớn đã có), 40 Vitest + 5 URL helper
  PASS. Test bổ sung mở modal, duyệt với confirmation, list refetch, lỗi và reset
  ghi chú sau reopen. Playwright với API giả lập ở 375/390/768/1440px, cao 620px:
  footer luôn trong viewport, body scroll, không horizontal overflow, approve/close
  và link quay lại hoạt động. Cần manual test thêm với dữ liệu thật.

## Phỏng vấn về component dùng chung

"Em giữ state chọn đơn ở trang danh sách để mở modal mà không mất filter hay trang
hiện tại. Nội dung và xử lý duyệt được dùng chung với route detail cũ, nên không
nhân đôi nghiệp vụ. Mutation thành công cập nhật cache và invalidate danh sách,
modal tự phản ánh kết quả mà không reload trang."

## Phỏng vấn về điều chỉnh chấm công (luồng gốc)

"Em thiết kế attendance correction như một yêu cầu có audit trail, không cho
nhân viên sửa chấm công trực tiếp. API lấy danh tính từ JWT. Khi Admin duyệt,
backend xử lý trong transaction và kiểm tra optimistic concurrency để không ghi
đè dữ liệu mới. Frontend dùng TanStack Query để làm mới lịch sử và dashboard mà
không tải lại trang."

## Employee detail/create modal - 19/10/2026

- Trang danh sách Employee thêm link "Quay lại lịch sử chấm công" tới
  `/employee/attendance`. Item và nút "Gửi yêu cầu" mở modal, giữ URL/filter/page.
- `AttendanceAdjustmentDetailDialog` nhận audience, reuse nội dung detail cho
  Employee chỉ đọc; không hiện các nút duyệt/từ chối hay ô nhập ghi chú duyệt.
- Tách `AttendanceAdjustmentForm` từ trang create. Form giữ RHF/Zod, prefill giờ
  theo ngày, mapping ISO, mutation, toast và invalidation hiện có. Route create cũ
  tiếp tục dùng form với callback navigate; modal dùng callback đóng sau thành công.
- `CreateAttendanceAdjustmentDialog` có header/footer cố định, body cuộn. Pending
  khóa fieldset/submit/hủy/đóng, lỗi giữ form, đóng unmount để reset khi mở lại.
  Focus trả về nút mở modal. Không sửa API, backend hoặc business validation.
- DatePicker có hai prop tùy chọn `modal` và `popoverClassName` với default giữ
  hành vi cũ. Form trong dialog bật Radix Popover modal để Calendar không kế thừa
  pointer-events:none từ body; popover nằm trên dialog và có max-height theo vùng
  khả dụng. Không đổi Portal hay format ngày. Các consumer khác không truyền prop
  vẫn giữ hành vi hiện tại.
- Files: ListPage, DetailDialog, CreatePage, mới Form/CreateDialog, shared DatePicker,
  test `attendance-adjustments.test.tsx` và báo cáo này.
- Verify: build/lint PASS, 43 Vitest + 5 URL helper PASS. Playwright với API giả lập
  ở 375/390/768/1440px, cao 620px: Employee không có action Admin, URL giữ nguyên,
  Calendar chọn được ngày, submit/đóng/reset hoạt động, footer thấy được và không
  tràn ngang. Vẫn cần manual test dữ liệu thật trên hai tài khoản.
