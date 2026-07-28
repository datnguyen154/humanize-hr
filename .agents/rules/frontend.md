---
description: Quy tắc frontend bắt buộc cho Humanize HR.
globs: "**/*.{ts,tsx,css}"
trigger: always_on
---

# Humanize HR Frontend Rules

## 1. Core principle

Ưu tiên theo thứ tự:

1. Existing project architecture
2. Existing design system
3. Existing feature patterns
4. Shared components
5. Library best practices
6. Agent preference

Không tạo pattern mới chỉ vì có thể viết "đẹp hơn".

Consistency quan trọng hơn novelty.

---

## 2. Stack

Frontend sử dụng:

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Zustand
- shadcn/ui
- TailwindCSS
- lucide-react

Không thêm dependency nếu không thực sự cần thiết.

Không thay library hiện có bằng library khác nếu task không yêu cầu.

---

## 3. Architecture

Trước khi implement:

1. Đọc feature hiện tại.
2. Tìm feature tương tự trong project.
3. Tìm shared component/hook/helper/API abstraction có thể reuse.
4. Giữ naming và file structure đang tồn tại.

Không refactor unrelated code.

Không tạo abstraction khi mới chỉ có một use case trừ khi abstraction đó đã tồn tại trong architecture.

---

## 4. Backend contract

Backend API là source of truth.

Không:

- tự đoán endpoint;
- tự đổi payload;
- tự rename API fields;
- tự giả định response;
- tự thêm frontend workaround để che lỗi contract.

Nếu contract không rõ → dừng và báo blocker.

---

## 5. TanStack Query

Giữ query key convention hiện có.

Mutation phải xử lý đúng:

- pending state;
- success;
- error;
- cache invalidation/update.

Các list có search/filter/sort/pagination phải giữ data cũ khi refetch nếu pattern hiện tại đang dùng:

`placeholderData: keepPreviousData`

Không dùng:

- opacity;
- artificial loading animation;
- setTimeout;

để che layout shift.

---

## 6. Forms

Form sử dụng pattern hiện tại với:

- React Hook Form
- Zod

Schema phải tương thích version Zod hiện tại.

Không duplicate validation giữa component nếu có schema phù hợp để reuse.

Server error và validation error phải được phân biệt khi cần.

---

## 7. UI system

Đây là HRM application UI, không phải marketing website.

Ưu tiên:

- rõ ràng;
- nhất quán;
- compact nhưng dễ đọc;
- predictable;
- accessible;
- responsive.

Reuse shadcn/ui và components hiện tại trước khi tạo component mới.

Không tự ý:

- thêm gradient;
- glassmorphism;
- glow;
- animation trang trí;
- redesign layout;
- đổi typography;
- đổi color system.

Không thêm animation để "làm UI sống động" nếu không cải thiện UX.

---

## 8. Existing UI patterns

Feature mới phải tham khảo các module production hiện tại.

Không chỉ copy module gần nhất.

Xác định pattern chung từ nhiều feature khi cần:

- Employee
- Department
- Leave Request
- Attendance
- Payroll

Nếu pattern giữa các module khác nhau, ưu tiên implementation mới nhất đã được review/manual-test, nhưng không tự kết luận khi khác biệt ảnh hưởng nghiệp vụ.

---

## 9. Tables

Tables phải giữ layout ổn định trong lúc refetch.

Đảm bảo:

- search;
- filter;
- sort;
- pagination;

không gây layout shift không cần thiết.

Loading initial và background refetch là hai trạng thái UX khác nhau.

---

## 10. Dialogs

Dialog phải:

- có title rõ;
- action rõ;
- disable action trong mutation nếu cần;
- tránh double submit;
- responsive;
- keyboard accessible;
- đóng/reset đúng lifecycle hiện tại của project.

Destructive hoặc irreversible action cần confirmation nếu business flow yêu cầu.

---

## 11. Responsive

Kiểm tra tối thiểu:

- desktop;
- tablet;
- mobile.

Không để horizontal overflow ngoài các vùng chủ động cho phép scroll.

Không phá table/mobile pattern đang tồn tại.

---

## 12. Text

Toàn bộ text hiển thị cho người dùng phải bằng tiếng Việt.

Tên code, API field, type và technical identifiers giữ tiếng Anh theo convention project.

---

## 13. Scope discipline

Không:

- sửa code ngoài scope;
- format toàn project;
- rename hàng loạt;
- refactor unrelated feature;
- thay architecture khi task chỉ yêu cầu feature nhỏ.

Nếu phát hiện technical debt ngoài scope, báo lại thay vì tự sửa.

---

## 14. Completion

Sau implementation, báo:

- file đã thay đổi;
- behavior đã thêm;
- assumptions nếu có;
- manual test cần thực hiện.

Lint/build chỉ bắt buộc khi milestone hoàn thành hoặc thay đổi có rủi ro build/type/config đáng kể.
