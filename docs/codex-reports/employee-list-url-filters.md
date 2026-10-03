# Employee List: URL filters và debounce

## Scope và file thay đổi

- `frontend/src/features/employee/lib/employee-list.params.ts`: đọc/ghi URL có type,
  fallback page/status/sort không hợp lệ, hằng số page size và debounce.
- `frontend/src/features/employee/hooks/useEmployeeListFilters.ts`: URL là nguồn dữ liệu
  bộ lọc; draft tìm kiếm riêng, debounce 350 ms, hủy timer khi điều hướng/unmount.
- `frontend/src/pages/admin/employees/EmployeeListPage.tsx`: sử dụng hook, giữ table/card,
  hiển thị trạng thái cập nhật trong vùng có chiều cao cố định, retry, khóa phân trang
  và export trong khi cập nhật, empty state theo bộ lọc và nút về trang đầu khi trang rỗng.
- `frontend/tests/employee-list.params.test.mjs`: năm test parser/serializer.
- Roadmap và báo cáo này.

Không sửa backend, API, mutation, query key, import hoặc EmployeeDetailDialog.
Reuse `keepPreviousData` của useEmployeesQuery, không tạo hook debounce generic khi
chưa có nhu cầu chung. Không thêm dependency.

## Luồng hoạt động

1. Mở trang: đọc page/search/status/departmentId/sortBy/sortOrder từ URL.
2. Gõ tìm kiếm: ô input đổi ngay; sau 350 ms không gõ nữa mới cập nhật URL và page=1.
3. Đổi trạng thái/phòng ban/sort: cập nhật một lần cùng page=1, áp dụng draft đang gõ.
4. Query key thay đổi -> TanStack Query gọi API hiện có; giữ dữ liệu trước trong lúc chờ.
5. Dòng phân trang dùng meta của dữ liệu đang hiển thị, không gắn số trang mới cho hàng cũ.
6. Có kết quả -> thay dữ liệu, mở lại phân trang/export.

Search dùng replace để tránh một history entry cho mỗi đợt gõ; filter/sort/page dùng push.
Back/Forward khôi phục URL và bỏ draft cũ, tránh timer ghi đè điều hướng mới.
Reload hoặc mở URL đã copy khôi phục cùng bộ lọc. Không lưu localStorage.
Điều hướng bằng link `/admin/employees` không có query vẫn là danh sách mặc định;
giữ bộ lọc khi quay lại ở đây nghĩa là Browser Back/Forward hoặc URL có query.
URL search có thể chứa tên/email, không đưa dữ liệu nhạy cảm vào link chia sẻ công khai.

## Verification

- `node --test tests/employee-list.params.test.mjs`: PASS 5/5 trên Node 22.22.2.
- `npm run lint`: PASS. `npm run build`: PASS; còn cảnh báo bundle lớn đã tồn tại.
- Test tự động hiện kiểm tra helper, chưa kiểm tra hook bằng môi trường DOM.
- Chưa chạy manual test trình duyệt với tài khoản/backend thật; không coi static review là manual PASS.

## Manual checklist

- Search nhanh: chỉ request sau khi ngừng gõ; đổi filter trong lúc gõ không mất search.
- Status/department/sort reset page=1, export dùng đúng bộ lọc đã áp dụng.
- Chuyển trang dưới mạng chậm: giữ hàng cũ, có thông báo đang cập nhật, không bấm Next liên tục.
- Reload và Back/Forward: URL, input, bộ lọc và dữ liệu đồng bộ.
- Back trong 350 ms chờ search không bị timer đưa trở lại bộ lọc cũ.
- URL sai page/sort/status không gây request sai enum; trang vượt dữ liệu có nút về đầu.
- Kiểm tra desktop/mobile, detail dialog, import và export không regression.

## Giải thích phỏng vấn

"Em đưa bộ lọc lên URL để reload, chia sẻ đường dẫn và browser history giữ đúng trạng thái.
Input cập nhật ngay nhưng query chỉ chạy sau debounce. TanStack Query giữ dữ liệu trước
khi tải bộ lọc mới; em khóa phân trang và dùng metadata của dữ liệu đang hiển thị để
tránh người dùng thao tác dựa trên kết quả cũ."

Tiếp theo: manual test milestone này, sau đó bổ sung test tương tác cho URL/debounce/
Back-Forward và các luồng quan trọng auth/import theo roadmap; chưa nhân rộng module khác.
