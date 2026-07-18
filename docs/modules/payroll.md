# Payroll Module

## Mục tiêu

Module Payroll cho phép quản trị viên tạo và quản lý bảng lương của nhân viên theo từng tháng, đồng thời cho phép nhân viên xem và tải bảng lương của mình.

---

# Vai trò

## Admin

- Tạo bảng lương cho nhân viên.
- Xem danh sách bảng lương.
- Xem chi tiết bảng lương.
- Cập nhật bảng lương.
- Xóa bảng lương.
- Xuất bảng lương PDF.
- Tìm kiếm, lọc theo:
  - Nhân viên
  - Tháng
  - Năm

## Employee

- Xem bảng lương của bản thân.
- Xem chi tiết bảng lương.
- Tải bảng lương PDF.

---

# Quy trình nghiệp vụ

1. Admin chọn nhân viên.
2. Chọn tháng và năm.
3. Nhập:
   - Lương cơ bản
   - Thưởng
   - Khấu trừ
   - Ghi chú
4. Hệ thống tính:

Net Salary = Base Salary + Bonus - Deduction

5. Lưu bảng lương.

---

# Công thức tính

Net Salary = Base Salary + Bonus - Deduction

Hiện tại chưa tính:

- Thuế
- Bảo hiểm
- Tăng ca
- Phụ cấp

Các nghiệp vụ này sẽ bổ sung ở phiên bản sau.

---

# Database

Payroll

- id
- employeeId
- month
- year
- baseSalary
- bonus
- deduction
- netSalary
- note
- createdAt
- updatedAt

Quan hệ:

Employee (1) ---- (N) Payroll

---

# API Roadmap

## Phase 1

- [x] POST /api/payrolls

## Phase 2

- [ ] GET /api/payrolls

## Phase 3

- [ ] GET /api/payrolls/:id

## Phase 4

- [ ] PATCH /api/payrolls/:id

## Phase 5

- [ ] DELETE /api/payrolls/:id

## Phase 6

- [ ] GET /api/employees/me/payrolls

## Phase 7

- [ ] Export Payroll PDF

---

# Validation

- employeeId phải tồn tại.
- Một nhân viên chỉ có một bảng lương cho mỗi tháng.
- month từ 1-12.
- year > 2000.
- baseSalary >= 0.
- bonus >= 0.
- deduction >= 0.

---

# Quy ước Response

Danh sách:

- Pagination
- Search
- Sort
- Filter

Chi tiết:

Bao gồm thông tin Employee.

---

# Ghi chú

Module này chỉ hỗ trợ tạo bảng lương thủ công.

Trong tương lai sẽ bổ sung:

- Tự động tính từ Attendance.
- Tự động cộng OT.
- Tự động tính thưởng.
- Tự động tính khấu trừ.
- Tự động gửi Email.