# Task 5 - Review yêu cầu điều chỉnh chấm công

## Đã kiểm tra

- `backend/prisma/schema.prisma`: Attendance có một bản ghi duy nhất cho mỗi
  employeeId + attendanceDate; lưu checkInTime, checkOutTime, PRESENT/LATE.
- `backend/src/modules/attendance/attendance.routes.ts`, controller, service và
  repository: chỉ có check-in/out, lịch sử Employee, danh sách Admin và báo cáo tháng.
  Chưa có bảng yêu cầu điều chỉnh, API gửi yêu cầu, duyệt hoặc lịch sử duyệt.
- `backend/src/modules/leave-request`: pattern phân quyền và transaction cho duyệt
  đơn, người duyệt và thời điểm duyệt.
- `frontend/src/pages/employee/attendance/AttendanceHistoryPage.tsx` và trang
  Admin Attendance: đều có list phân trang, loading/error/empty và badge tiếng Việt.
- `frontend/src/shared/components/DatePicker.tsx`: chọn ngày YYYY-MM-DD, hiển thị
  DD/MM/YYYY. React Hook Form + Zod và TanStack Query mutation có pattern ở Leave.

## Quyết định nghiệp vụ

Người dùng đã giao chọn phương án phù hợp thực tế doanh nghiệp: hỗ trợ cả sửa giờ
trên bản ghi hiện có và bổ sung ngày quên chấm công. Employee gửi giờ đề xuất và
lý do; Admin duyệt/từ chối với lịch sử. Chỉ duyệt mới tạo/cập nhật Attendance.

## Phương án đã triển khai

1. Thêm migration Prisma lưu yêu cầu, trạng thái PENDING/APPROVED/REJECTED, nhân viên,
   ngày chấm công, giờ đề xuất, lý do, bản ghi/giờ gốc, người duyệt, thời điểm và
   ghi chú. Chặn nhiều yêu cầu PENDING cho cùng nhân viên/ngày ở DB.
2. Employee chỉ được tạo/xem yêu cầu của mình; employeeId lấy từ token.
   Admin xem hàng đợi, chi tiết và duyệt/từ chối. Danh sách phân trang.
3. Duyệt APPROVED áp dụng giờ mới vào Attendance trong cùng transaction với kết quả
   duyệt. Tính lại PRESENT/LATE theo cutoff 08:00 Asia/Bangkok hiện có.
   REJECTED không sửa Attendance. Cả hai giữ lịch sử và thông tin người duyệt.
4. Kiểm tra dữ liệu có thay đổi từ lúc gửi để tránh ghi đè check-out mới.
   Duyệt lặp/hai Admin cùng duyệt phải cho một kết quả 409 có thể hiểu được.
5. Frontend dùng API/types/query key/mutation theo module Attendance, giao diện
   Employee và Admin trong layout hiện có, loading/error/empty và thông báo tiếng Việt.
   Invalidate lịch sử/danh sách/báo cáo/dashboard tương ứng sau khi duyệt.
6. Kiểm thử phân quyền, ownership, validation, transaction, cạnh tranh duyệt,
   ngày qua tháng/năm, dữ liệu đổi sau khi gửi và luồng UI.

Không tự đổi hợp đồng chấm công/bảng lương hiện tại. Điều chỉnh chấm công được
duyệt không tự tính lại bảng lương đã phát hành.

## Giới hạn nghiệp vụ

- Chưa có chính sách chốt kỳ công hoặc giới hạn ngày quá khứ; chỉ từ chối ngày/giờ
  tương lai. Admin cần kiểm tra kỳ lương đã phát hành trước khi duyệt.
- Không hỗ trợ ca qua đêm: giờ vào/ra phải thuộc cùng ngày công ty
  (Asia/Bangkok), phù hợp với cách chấm công hiện tại.
- Chưa có upload chứng từ hay thông báo tự động; lý do và ghi chú được lưu trong
  lịch sử để đối chiếu.
