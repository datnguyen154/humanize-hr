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
3. **3A đã hoàn thành:** test tương tác URL/debounce/Back-Forward, query pending/error/retry
   và auth/role bằng Vitest + React Testing Library (11 test), giữ 5 test URL helper.
   **3B đã hoàn thành:** 15 test import preview/partial success, chọn lại file, invalidation,
   khóa submit pending và multipart API; tổng bộ test 31 PASS. Native picker/boundary thực tế vẫn cần manual test.
4. **Đã implement, chờ deploy/manual test dữ liệu thật:** báo cáo chấm công tháng và export Excel.
   Backend tổng hợp toàn kỳ bằng Prisma groupBy, ADMIN-only; frontend có chọn kỳ,
   cache/làm mới, desktop table/mobile cards và xuất Excel. Không suy diễn ngày công/vắng mặt.
   7 test frontend và 7 test backend mới, kiểm tra responsive bằng Playwright với API giả lập.
5. **Đã implement, chờ migration/deploy và manual test dữ liệu thật:** nhân viên gửi
   yêu cầu sửa giờ hoặc bổ sung ngày quên chấm công; Admin duyệt/từ chối có lịch sử.
   Backend kiểm tra ownership, chống duyệt lặp và dữ liệu gốc thay đổi; frontend
   có danh sách, form, chi tiết và trạng thái tiếng Việt.
6. Admin tạo thông báo nội bộ.
7. Quản lý tài khoản và danh mục chức vụ.

README, ảnh/video demo và cách mô tả CV được cập nhật theo milestone.
Tăng ca, hợp đồng, phân quyền động, tự động chốt lương, email/real-time và AI trả phí
để sau khi các luồng hiện tại ổn định.

## Quy ước sau mỗi task

- Cập nhật trạng thái thật và các bước manual test còn lại.
- Giải thích luồng từ thao tác UI đến API, xử lý dữ liệu và cập nhật màn hình.
- Viết ví dụ trả lời phỏng vấn ngắn, đúng với code đã làm.
- Nhắc task tiếp theo; bắt đầu khi người dùng yêu cầu hoặc nhắn "done".
- "done" là tín hiệu chuyển sang task tiếp theo trong lộ trình, không tự coi là kết quả manual test PASS.
