# Báo cáo công tháng — Review contract

## Trạng thái

Đã review targeted code Attendance và thống kê Employee Dashboard. Chưa thay đổi
runtime code vì contract báo cáo tháng chưa tồn tại và cần được xác nhận.

**Cập nhật:** người dùng đã đồng ý mở scope Backend. Implementation và contract mới
được ghi trong `monthly-attendance-report-implementation.md`; phần dưới giữ lại
kết quả review tại thời điểm chưa có API báo cáo.

## Contract hiện có

- `backend/src/modules/attendance/attendance.routes.ts`: check-in, check-out,
  employee history và admin list; không có route báo cáo tháng/export.
- `backend/src/modules/attendance/attendance.service.ts`: admin list nhận page,
  limit, search, status, employeeId, fromDate, toDate, sortBy, sortOrder.
  Limit tối đa 100. Ngày filter là YYYY-MM-DD, hai đầu bao gồm trong khoảng lọc.
- `backend/src/modules/attendance/attendance.repository.ts`: list/count bản ghi,
  chưa có tổng hợp theo nhân viên cho Admin.
- `backend/src/modules/dashboard/dashboard.repository.ts`: có đếm PRESENT/LATE
  theo tháng cho một nhân viên; không phải contract báo cáo Admin toàn công ty.
- `frontend/src/features/attendance/api/attendance.api.ts`: chỉ có list/history
  và check-in/check-out; chưa có API report/export.
- `docs/modules/attendance.md`: chưa quy định contract báo cáo/export hoặc công thức
  quy đổi ngày công, nghỉ không phép, trừ giờ nghỉ hay tăng ca.

## Phương án đề xuất, chưa phải contract đã duyệt

Ưu tiên tổng hợp tại Backend hiện có, không thêm dịch vụ/hạ tầng trả phí.
Frontend chọn tháng/năm, hiển thị tổng hợp theo nhân viên và xuất Excel toàn kỳ,
không chỉ xuất/tính trang đang hiển thị. Contract cụ thể cần chốt trước implementation.

Bản đầu nên chỉ dùng dữ kiện chấm công đã ghi nhận: mã/họ tên nhân viên,
số bản ghi, số lần đúng giờ, số lần đi muộn và số lần chưa check-out.
Không gọi số bản ghi là ngày công quy đổi; không suy diễn vắng mặt hoặc giờ công chuẩn.

Không ưu tiên tải tuần tự tất cả trang tại Frontend để tổng hợp: nhiều request tới
Render Free, tốn dữ liệu và có nguy cơ báo cáo thiếu/không nhất quán khi dữ liệu thay đổi.

## Verification

Chỉ sửa tài liệu. Không thay API, UI, business logic hay cấu hình deployment.
Không chạy lại lint/build cho thay đổi tài liệu này.
