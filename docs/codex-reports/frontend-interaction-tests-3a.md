# Milestone 3A: kiểm thử tương tác frontend

## Phạm vi

Thiết lập Vitest và React Testing Library trên jsdom cho các hook/component React.
Không gọi backend thật, không tạo dữ liệu HRM, không thay business logic ứng dụng.
Giữ test parser URL dùng Node hiện có.

## File thay đổi

- frontend/package.json và package-lock.json: dev dependencies và scripts test.
- frontend/vitest.config.ts: alias @, jsdom, file setup, chỉ chạy test TSX.
- frontend/tsconfig.test.json: kiểm tra TypeScript cho tests trước khi chạy.
- frontend/tests/setup.ts: cleanup DOM sau mỗi test.
- frontend/tests/employee-list-filters.test.tsx: 5 test URL/debounce/history.
- frontend/tests/employees-query.test.tsx: 2 test giữ data và retry.
- frontend/tests/auth-route-guards.test.tsx: 4 test anonymous/restoration/role/logout state.
- Roadmap và báo cáo này.

## Cách chạy

Trong frontend:

```bash
npm ci
npm test
npm run test:watch
```

Node 22.22.2 được dùng khi verify. `npm test` kiểm tra type của tests, chạy Vitest,
sau đó chạy 5 test parser URL bằng node:test. watch chỉ chạy nhóm Vitest.

## Các tình huống đã bảo vệ

- URL mở ban đầu khôi phục page/search/status/sort.
- Chưa đủ 350 ms thì chưa cập nhật URL; gõ tiếp reset thời gian chờ, search cuối reset page.
- Đổi status trong khi search đang chờ cập nhật cả hai trong một navigation.
- Back/Forward khôi phục URL/input; draft đang chờ không ghi đè history.
- Unmount hủy timer tìm kiếm.
- Query trang mới đang pending giữ data/meta trang cũ; không chuyển thành initial loading.
- API failure đưa query sang error; refetch thành công khôi phục data.
- Anonymous redirect login; restoration giữ loading đến khi xác nhận user.
- EMPLOYEE bị chuyển khỏi nội dung ADMIN về dashboard riêng.
- Clear auth state khi đang mở protected content redirect login ngay.

## Luồng test

Render hook/component thật trong MemoryRouter hoặc QueryClientProvider -> mô phỏng
gõ/click/navigation -> quan sát URL, state hoặc DOM. Chỉ mock API để kiểm soát
request đang chờ và lỗi; dùng fake timer cho debounce. Store được reset giữa test.

## Kết quả và giới hạn

- 11 test tương tác + 5 test parser PASS; TypeScript test PASS.
- Frontend lint/build PASS; build vẫn cảnh báo bundle lớn.
- Không thay code src; các test chưa phát hiện regression cần sửa.
- Đây là kiểm thử DOM/hook, không phải visual test hoặc E2E với backend/refresh token thật.
- Chưa kiểm thử import preview, partial success hoặc submit mutation trong milestone này.
- npm install báo 8 dependency vulnerabilities (2 moderate, 6 high); chưa chạy audit fix
  vì có thể thay dependency ngoài scope. Cần đánh giá riêng trước khi nâng cấp.

## Giải thích dễ hiểu

Test đóng vai người dùng gõ/chuyển trang và server trả kết quả. Khi sửa code sau này,
chạy npm test để phát hiện nếu debounce gọi quá sớm, Back bị ghi đè hay sai quyền.
Các test chạy trên máy nên không tốn request Render hoặc chi phí hạ tầng.

Trả lời phỏng vấn: "Em test các trạng thái chuyển tiếp thay vì chỉ happy path:
timer debounce, browser history, dữ liệu tạm khi chuyển query và auth restoration.
Em dùng Router và TanStack Query thật, mock boundary API để chủ động tạo pending/error,
và kiểm tra output mà người dùng nhận được."

## Tiếp theo

Milestone 3B: dùng cùng test setup để kiểm tra Employee Excel Import: preview toàn lỗi,
partial success, chọn lại cùng filename, điều kiện invalidation và khóa submit pending.
Sau đó mới chuyển sang milestone báo cáo công tháng của roadmap.
