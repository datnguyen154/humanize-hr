# Task 3B: kiểm thử Employee Excel Import

## File mới

- `frontend/tests/employee-import.test.tsx`: 13 tình huống tương tác dialog, sử dụng
  Dialog/Radix, TanStack Query và mutation hook thật; chỉ mock API và toast.
- `frontend/tests/employee-import-api.test.tsx`: 2 tình huống kiểm tra API preview/import
  đi qua Axios và request interceptor thật, dùng adapter giả để không gửi HTTP.
- Báo cáo này và trạng thái roadmap.

Không sửa source ứng dụng, backend hoặc contract. Giữ nguyên thay đổi chưa commit của 3A.
Không thêm dependency.

## Coverage mới

1. Chặn file sai extension hoặc trên 5 MB trước khi gọi preview.
2. Preview toàn hợp lệ, một phần lỗi và toàn lỗi: input vẫn mounted, nút thay file hoạt động;
   validCount=0 khóa confirm, không khóa thay file.
3. Picker reset value trước click; chọn File mới cùng filename xóa preview, có thể preview lại.
4. Import thành công hoàn toàn, partial success và toàn lỗi: giữ result, không còn confirm
   cho file vừa xử lý. Chọn file mới xóa result/errors cũ.
5. Cache employee chỉ invalidated khi successCount>0; department cache không bị ảnh hưởng.
6. Pending preview/import khóa đổi file, confirm/cancel liên quan; bấm nút pending không gửi thêm request.
7. Preview error được xóa khi chọn lại file.
8. Import error giữ preview và cho retry; thất bại không invalidate cache.
9. Đóng/mở dialog reset file và preview.
10. Template download gọi API hiện có, tạo URL tải và revoke sau sử dụng.
11. Hai endpoint preview/import gửi POST, đúng field `file`, payload giữ FormData,
    token attached, không có JSON Content-Type, response được unwrap đúng.

## Verification

- `npm test`: PASS 31 tests (26 Vitest + 5 Node parser), gồm TypeScript test check.
- 15 test mới của 3B PASS; 16 test 3A vẫn PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS; còn cảnh báo bundle trên 500 kB đã có trước.
- Không gọi Render, database hoặc upload dữ liệu thật.

## Giới hạn

jsdom không mở native file picker. Test xác nhận input còn mounted, reset value/click
và xử lý File mới cùng tên; behavior của OS picker vẫn cần manual test.
Adapter giả xác nhận FormData/token/headers trước gửi HTTP, không chứng minh boundary
trên mạng hoặc Multer nhận req.file. Cần giữ manual test DevTools/backend cho phần đó.
Fixture workbook là File giả phục vụ frontend; không kiểm tra parse Excel ở backend.
Chưa thực hiện visual test desktop/mobile hoặc request retry do token refresh trong task này.
Test chống submit trùng ở đây kiểm tra nút khi mutation pending, không chứng minh
idempotency phía server hoặc xử lý mất response sau khi server đã tạo bản ghi.

## Luồng dễ hiểu

Test chọn file -> gọi preview giả -> dialog nhận số dòng hợp lệ/lỗi -> test bấm confirm
-> mutation nhận kết quả giả -> dialog hiển thị result -> kiểm tra cache bị đánh dấu cũ
đúng điều kiện. Request đang chờ được giữ bằng Promise chưa resolve để kiểm tra khóa nút.

Khi phỏng vấn: "Em test luồng import nhiều bước bằng dialog và mutation thật, mock API
để chủ động tạo partial success, toàn lỗi và request pending. Em kiểm tra cache chỉ bị
invalidate khi có dữ liệu được tạo và chặn import lại file đã xử lý. Multipart có test
ở API boundary, còn native picker và backend parse được kiểm tra manual riêng."

## Task tiếp theo

Theo roadmap: báo cáo tổng hợp công tháng và export Excel. Bắt đầu bằng targeted review
contract/API attendance-report hiện có và dữ liệu có thể dùng; chưa tự giả định endpoint
hoặc công thức tính ngày công.
