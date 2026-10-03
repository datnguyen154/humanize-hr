2004
nhdat# Lộ trình portfolio Frontend Humanize HR

## Mục tiêu đã thống nhất

Dự án cá nhân phục vụ ứng tuyển Frontend Developer. Ưu tiên luồng người dùng thực tế,
code type-safe dễ sửa, ít lặp, responsive, xử lý trạng thái và kiểm thử có ý nghĩa.
Tận dụng Render Free và backend hiện có; không thêm dịch vụ trả phí.

## Thứ tự thực hiện

1. **Đã implement, chờ manual test dữ liệu thật:** sửa Admin Dashboard: KPI hôm nay,
   biểu đồ đủ dữ liệu theo kỳ, trạng thái lỗi/loading và query gọn. Tổng hợp tại backend hiện có.
2. **Đã implement Employee List, chờ manual test:** chuẩn hóa bảng và form. Filter trên URL,
   debounce search, giữ bộ lọc khi reload/quay lại, không nhảy layout khi refetch.
   Sau khi pattern được xác nhận mới áp dụng cho các list khác.
3. **Tiếp theo sau manual test:** kiểm thử tương tác URL/debounce/Back-Forward và luồng quan trọng: auth/role, import preview và partial success,
   thay file, cập nhật thất bại/retry và chống submit trùng.
4. Báo cáo tổng hợp công tháng và export Excel.
5. Nhân viên yêu cầu điều chỉnh công, Admin xét duyệt có lịch sử.
6. Admin tạo thông báo nội bộ.
7. Quản lý tài khoản và danh mục chức vụ.

README, ảnh/video demo và cách mô tả CV được cập nhật theo milestone.
Tăng ca, hợp đồng, phân quyền động, tự động chốt lương, email/real-time và AI trả phí
để sau khi các luồng hiện tại ổn định.

## Quy ước sau mỗi task

- Cập nhật trạng thái thật và các bước manual test còn lại.
- Giải thích luồng từ thao tác UI đến API, xử lý dữ liệu và cập nhật màn hình.
- Viết ví dụ trả lời phỏng vấn ngắn, đúng với code đã làm.
- Nhắc task tiếp theo; không tự triển khai sang task đó.
