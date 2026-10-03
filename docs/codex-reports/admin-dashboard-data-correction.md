# Admin Dashboard: sửa dữ liệu tổng hợp

## Vấn đề trước đây

- Dashboard gọi bốn API danh sách, mỗi API lấy trang đầu với 10 bản ghi.
- Biểu đồ chỉ tổng hợp 10 lượt chấm công, không đại diện cho cả kỳ.
- KPI chấm công hôm nay đọc totalItems của toàn bộ lịch sử.
- Khi lỗi, fallback 0 dễ khiến người dùng hiểu nhầm là dữ liệu thật.

## Thay đổi

- Backend: thêm `admin-dashboard.repository.ts`, `admin-dashboard.service.ts` trong
  module dashboard; nối controller và route ADMIN. Không đổi API danh sách hoặc Employee Dashboard.
- `GET /api/dashboard/admin?days=7`: chỉ ADMIN, chấp nhận 7 hoặc 30, mặc định 7.
- Repository dùng count/groupBy trong cùng transaction RepeatableRead. Chỉ lấy
  tối đa 10 sự kiện mỗi nguồn, không tải toàn bộ lịch sử về frontend.
- Service tạo đủ ngày trong kỳ bao gồm hôm nay, dùng ngày công ty từ helper attendance
  hiện có; ngày không phát sinh có giá trị 0. KPI hôm nay chỉ lấy đúng ngày hiện tại.
- Hoạt động gần đây gộp ba nguồn, sắp xếp mới nhất, lấy 10; độc lập với kỳ biểu đồ.
  Đây là sự kiện tạo bản ghi, không phải audit log cho mọi chỉnh sửa.
- Frontend: thêm API/hook/config Admin Dashboard; thay hook bốn list bằng một query,
  cập nhật types và activity mapper. KPI được mô tả bằng cấu hình có key type-safe.
- AdminDashboardPage giữ bố cục, thêm chọn 7/30 ngày, làm mới và retry.
  Lỗi chưa có dữ liệu hiển thị `--`, không giả lập 0. Refetch lỗi có cache thì giữ
  dữ liệu trước đó và báo rõ. Ngày toàn 0 mới hiển thị empty state biểu đồ.
- Query key bao gồm kỳ; staleTime 5 phút, gcTime 10 phút, không refetch khi focus.
  Vào lại trang luôn refetch để cập nhật tổng hợp sau thao tác ở module khác.
- AGENTS.md và roadmap ghi lại ưu tiên portfolio, giải thích phỏng vấn và nhắc task sau.

## Contract mới

Response `{ data: { generatedAt, period, summary, attendanceTrend, recentActivities } }`.

- period: `{ days, fromDate, toDate }`, ngày dạng YYYY-MM-DD.
- summary: `{ totalEmployees, totalDepartments, totalLeaveRequests, todayAttendance }`.
  Ba tổng đầu là toàn bộ bản ghi, không chỉ ACTIVE hoặc PENDING.
- attendanceTrend: `{ date, total, present, late }[]`, tăng dần theo ngày.
- recentActivities: `{ id, type, subject, createdAt }[]`.
  type là attendance, leave-request hoặc department. Frontend tạo câu tiếng Việt.
- days không hợp lệ: 400. Quyền sử dụng middleware authenticate/requireRole hiện tại.

## Kiểm tra

- Frontend `npm run lint`: PASS.
- Frontend `npm run build`: PASS; còn cảnh báo chunk trên 500 kB, chưa xử lý ở scope này.
- Backend `npm run build`: PASS, không cần migration.
- `node --test tests/admin-dashboard.test.cjs` sau backend build: kiểm tra ngày công ty,
  kỳ không hợp lệ, đổi năm, nhóm dữ liệu trên 10 bản ghi, ngày trống, KPI hôm nay,
  top 10 hoạt động, snapshot rỗng và lỗi database.
- Unit test service mock repository; chưa xác minh endpoint với database thật hoặc
  manual test trình duyệt desktop/mobile. Không coi unit test là E2E.

## Manual test tiếp theo

1. Deploy backend trước frontend vì frontend cần endpoint mới.
2. Đăng nhập ADMIN, đối chiếu tổng nhân viên/phòng ban/đơn với dữ liệu thật.
3. Kiểm tra KPI hôm nay, kỳ 7/30 ngày có hơn 10 lượt và ngày trống.
4. Kiểm tra làm mới, retry khi mất kết nối, cache cũ không biến thành 0.
5. Kiểm tra màn hình 375px và desktop, dropdown, tooltip, loading, empty state.
6. EMPLOYEE không được gọi endpoint ADMIN; Employee Dashboard vẫn hoạt động.

## Giải thích dễ hiểu và phỏng vấn

UI chọn kỳ -> query key theo kỳ -> Axios gửi token -> middleware kiểm tra quyền ->
database đếm và nhóm toàn bộ dữ liệu đúng kỳ -> service tạo dữ liệu biểu đồ ->
TanStack Query cache kết quả -> React render KPI, biểu đồ và hoạt động.

Có thể trả lời: "Em phát hiện dashboard tổng hợp từ trang đầu của API phân trang nên
số liệu biểu đồ không đầy đủ. Em chuyển phép tổng hợp về database, dùng ngày theo
múi giờ công ty và một query riêng có cache theo kỳ. Em tách lỗi tải dữ liệu khỏi
giá trị 0, đồng thời viết test cho ngày biên và dữ liệu vượt kích thước trang."

Task tiếp theo sau khi manual test PASS: Employee List filter trên URL, debounce
search và giữ trạng thái khi quay lại trang. Chưa tự implement task tiếp theo.
