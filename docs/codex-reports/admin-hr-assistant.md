# Trợ lý HR cho Admin

## Phạm vi

Thêm widget vào AdminLayout, dùng chung giao diện HrAssistantWidget với Employee.
Bản đầu hỗ trợ 9 câu hỏi định sẵn theo 4 nhóm: nhân viên, phòng ban, chấm công,
nghỉ phép. Đây là tra cứu dữ liệu theo câu hỏi có sẵn, chưa có nhập câu hỏi tự do.

## Nguồn dữ liệu

Backend `/hr-assistant/questions` và `/hr-assistant/query` hiện chỉ cho EMPLOYEE.
Admin dùng các API GET đã có qua API functions của từng feature:

- `/employees`: tổng nhân viên, ACTIVE, INACTIVE.
- `/departments`: tổng phòng ban và ACTIVE.
- `/attendance`: từ ngày đến ngày cùng là hôm nay; câu đi muộn thêm LATE.
- `/leave-requests`: tổng đơn và PENDING trong hệ thống.

Mỗi lần chọn câu hỏi lấy dữ liệu mới. Dùng page=1, limit=1 và đọc meta.totalItems,
không dùng độ dài data để suy ra tổng. Ngày chấm công theo Asia/Bangkok như backend.
Không thay endpoint, quyền truy cập, backend hay thực hiện thao tác ghi dữ liệu.

## File thay đổi

- `frontend/src/features/hr-assistant/lib/adminHrAssistant.ts`: danh sách câu hỏi và hàm chuyển dữ liệu thật thành câu trả lời tiếng Việt.
- `frontend/src/features/hr-assistant/types/hrAssistant.types.ts`: kiểu audience.
- `frontend/src/features/hr-assistant/hooks/useHrAssistantQuestionsQuery.ts`: nguồn câu hỏi riêng theo audience, query key tách biệt.
- `frontend/src/features/hr-assistant/hooks/useHrAssistantQueryMutation.ts`: chọn resolver Admin hoặc API Employee.
- `frontend/src/features/hr-assistant/index.ts`: export kiểu audience.
- `frontend/src/widgets/hr-assistant/HrAssistantWidget.tsx`: chủ đề và nội dung phù hợp Admin; giữ panel, hội thoại, retry; khóa gửi trùng đồng bộ.
- `frontend/src/widgets/layouts/admin-layout/AdminLayout.tsx`: gắn widget audience admin.

## Kiểm tra

- npm run lint: PASS.
- npm run build: PASS; vẫn có cảnh báo bundle lớn hơn 500 kB.
- Kiểm tra UI bằng trang tạm sử dụng Axios adapter mô phỏng, đã xóa trang tạm sau kiểm tra.
- Desktop 1280x720, tablet 768x1024, mobile 375x667: panel hiển thị trong viewport.
- Mobile và tablet: document.scrollWidth bằng viewport width, không tràn ngang.
- Chọn tổng nhân viên: GET /employees với page=1, limit=1; data rỗng nhưng meta.totalItems=120 hiển thị đúng 120.
- Chấm công hôm nay: GET /attendance với fromDate/toDate bằng ngày công ty.
- Đơn chờ duyệt: GET /leave-requests với status=PENDING.
- Mô phỏng lỗi mạng: thông báo tiếng Việt; retry thành công, không lặp lại tin nhắn câu hỏi.
- Escape: đóng panel và trả focus về nút mở.
- Chưa xác nhận end-to-end với backend thật; cần đăng nhập Admin và đối chiếu các số đếm với trang danh sách tương ứng, kiểm tra ACTIVE/INACTIVE, phòng ban, LATE và dữ liệu rỗng. Đăng nhập Employee để xác nhận các câu hỏi cá nhân vẫn dùng endpoint cũ.
