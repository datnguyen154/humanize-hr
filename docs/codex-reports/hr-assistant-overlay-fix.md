# Trợ lý HR: tránh che thao tác trang

## Phương án cuối: giữ hàng ngang, chừa bên phải

Thay thế cả phương án header và căn trái bên dưới:
- Khôi phục footer phân trang `sm:flex-row sm:justify-between`: tổng số bên trái,
  điều khiển bên phải cùng hàng. Thêm `sm:pr-40` (10rem) để cụm nút lùi khỏi chatbot.
- Mobile giữ bố cục xếp dọc trước đây, chừa `pr-16`; launcher chỉ hiện icon 48px
  với aria-label/title tiếng Việt, tránh chiếm nhiều chiều ngang.
- Xóa padding-bottom 5rem khỏi cả hai layout, không còn khoảng trắng bù cuối trang.
- Chỉ thay class layout, không đổi logic phân trang hoặc API.
- Chưa xác nhận visual manual test sau chỉnh sửa; cần kiểm tra footer desktop/mobile
  và chatbot mở/đóng. Các phương án phía dưới là lịch sử review, không phải trạng thái cuối.

## Cập nhật theo review: giữ chatbot bên dưới

Phương án header bên dưới đã được thay thế theo yêu cầu người dùng:
- Khôi phục chatbot floating ở góc dưới phải cho Admin/Employee; popover mở lên trên.
- Căn trái cụm phân trang, đặt dưới dòng tổng số ở Employee List, Department List,
  Department Detail (danh sách nhân viên), Attendance, Leave Request, Payroll của Admin;
  Attendance History, Leave Request và Payroll của Employee.
- Hai layout có khoảng cuộn cuối nội dung 5rem cộng safe-area-inset-bottom.
  Đây là khoảng trống để đưa nội dung cuối trang lên khỏi launcher 3rem, không phải
  bảo đảm launcher không phủ bất kỳ nội dung nào tại mọi vị trí cuộn.
- Giữ nguyên API, query, mutation, bộ lọc và handler phân trang.
- Phần rà soát nguy cơ và giới hạn manual test phía dưới vẫn áp dụng.
- Cần manual test desktop/mobile: cuộn hết trang, bấm phân trang trái, mở/đóng chat,
  nút lưu cuối form và màn hình có safe area. Chưa xác nhận visual PASS sau thay đổi này.

## Phương án trước review (đã thay thế)

## Nguyên nhân và phạm vi rà soát

HrAssistantWidget dùng wrapper fixed bottom/right với z-40, nằm ngoài luồng layout.
Ảnh manual test xác nhận che phân trang Employee List. Rà soát code cho thấy cùng
widget được mount trong cả AdminLayout và EmployeeLayout nên nguy cơ không giới hạn
ở trang này. Các vị trí có nguy cơ tương tự:

- Admin: phân trang nhân viên, phòng ban, nhân viên trong chi tiết phòng ban,
  chấm công, nghỉ phép, bảng lương.
- Employee: phân trang lịch sử chấm công, nghỉ phép, bảng lương.
- Nút submit cuối form tạo/sửa nhân viên, phòng ban, tạo nghỉ phép, đổi mật khẩu.

Đây là đánh giá nguy cơ từ cấu trúc code, không khẳng định từng trang đã tái hiện
trực tiếp trên trình duyệt. Dialog vốn dùng lớp overlay riêng, không cần vá từng dialog.

## Giải pháp

Đặt nút Trợ lý HR trong nhóm thao tác header, cạnh thông báo, cho cả hai vai trò.
Không dùng fixed launcher, không thêm padding bù hay sửa z-index phân trang.
Nút dùng outline và icon, chữ chỉ hiện từ lg để tiết kiệm chiều ngang trên mobile/tablet.
Popover mở xuống dưới header; giữ portal, collision padding và giới hạn chiều cao,
scroll body, đóng bằng X/Escape/click ngoài theo Radix hiện có.

Khung chat khi chủ động mở vẫn là popover phủ nội dung; đóng chat để tiếp tục thao tác
phần nội dung bên dưới. Không phải giải pháp hiển thị chat và toàn bộ trang song song.

## File sửa

- widgets/hr-assistant/HrAssistantWidget.tsx: bỏ fixed, nút header responsive, popover bottom.
- widgets/layouts/admin-layout/AdminLayout.tsx: bỏ instance ở cuối layout.
- widgets/layouts/admin-layout/AdminHeader.tsx: mount một instance audience admin.
- widgets/layouts/employee-layout/EmployeeLayout.tsx: bỏ instance ở cuối layout.
- widgets/layouts/employee-layout/EmployeeHeader.tsx: mount một instance employee.

Không thay API, query, mutation, hội thoại, dữ liệu nghiệp vụ hoặc route.

## Verification

- Browser local mở được login; dùng nút tài khoản demo Admin rồi đăng nhập thất bại.
  Chưa manual test trang protected hoặc viewport desktop/tablet/375/390 sau đăng nhập.
- Checklist còn lại: cuộn cuối các list/form; phân trang/submit không bị nút chat che;
  mở/đóng chat; Escape trả focus; mobile header không tràn; menu, thông báo và dialog
  không bị chat giành tương tác; giữ đúng câu hỏi theo vai trò.
- Frontend `npm run lint`: PASS. `npm run build`: PASS; còn cảnh báo bundle trên 500 kB.
- `git diff --check`: PASS.

## Luồng và giải thích phỏng vấn

Header render widget -> người dùng mở popover -> query câu hỏi hiện có chạy -> chọn
câu hỏi và nhận trả lời như trước. Khi đóng, chỉ nút trong header chiếm chỗ layout.
Lỗi được xử lý ở shared widget và hai header thay vì thêm khoảng trống vào từng trang,
giúp cả trang hiện tại và trang mới không bị floating launcher che thao tác cuối trang.

Task tiếp theo theo roadmap vẫn là kiểm thử các tương tác quan trọng; sửa này không
thay đổi thứ tự roadmap.
