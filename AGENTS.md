# Humanize HR — Agent Instructions

## Project

Humanize HR là hệ thống HRM production.

Frontend:

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

Backend:

- Node.js
- Prisma
- PostgreSQL
- JWT Access Token + Refresh Token

## Required behavior

Trước khi thực hiện task:

1. Đọc các rule liên quan trong `.agents/rules/`.
2. Xem danh sách `.agents/learnings/` và chỉ đọc learning liên quan trực tiếp tới task.
3. Đọc code hiện tại trước khi đề xuất thay đổi.
4. Tái sử dụng architecture, component và pattern hiện có.
5. Không tự tạo architecture mới nếu pattern hiện tại đã giải quyết được vấn đề.
6. Không tự đoán hoặc thay đổi Backend API contract.
7. Không redesign UI nếu task không yêu cầu.
8. UI text phải dùng tiếng Việt.
9. Ưu tiên production-ready, maintainable, type-safe và accessible.
10. Chỉ thay đổi những file cần thiết cho scope hiện tại.

## Local Skills — Chủ động lựa chọn

Nguồn skill của dự án là `.agents/skills/<skill-name>/SKILL.md`.
Agent phải chủ động chọn skill phù hợp, không chờ người dùng nhắc lại ở mỗi task.

Trước khi phân tích hoặc triển khai task:

1. Xem danh sách thư mục trong `.agents/skills/` và metadata `name`/`description`
   của các `SKILL.md` khi chưa có trong context. Danh sách thực tế trên disk là
   nguồn cập nhật; không chỉ dựa vào bảng tham khảo bên dưới.
2. Chọn bộ skill nhỏ nhất có ích cho mục tiêu và phạm vi người dùng yêu cầu.
   Đọc đầy đủ `SKILL.md` đã chọn trước khi áp dụng, kể cả task chỉ audit hoặc lập plan.
3. Nếu skill dẫn tới skill/tài liệu khác, chỉ đọc phần liên quan theo điều kiện
   của skill. Đường dẫn tương đối được tính từ thư mục chứa `SKILL.md`.
4. Thông báo ngắn bằng tiếng Việt skill đang áp dụng và mục đích trong cập nhật
   đầu tiên sau khi chọn. Không cần xin xác nhận chỉ để đọc hoặc dùng skill.
5. Không đọc lại nội dung không đổi đã có trong context cùng task. Nếu task đổi
   phạm vi hoặc xuất hiện skill mới, đánh giá lại lựa chọn.
6. Nếu không có skill phù hợp, tiếp tục theo rule và pattern hiện tại của dự án.
   Nếu skill được người dùng yêu cầu bị thiếu/không đọc được, báo rõ và không
   khẳng định đã dùng skill đó.

### Hướng chọn skill hiện tại

| Task | Skill cần xem |
| --- | --- |
| Audit, plan, thêm hoặc sửa UI | `.agents/skills/design-taste-frontend/SKILL.md` để chọn mode và skill liên quan |
| Thêm component, trạng thái UI hoặc đồng bộ shared UI | Qua dispatcher: `runtime-branding` và Minimal checklist của `web-design-guidelines`; giữ layout xung quanh |
| Redesign hoặc polish sâu UI hiện có đã được yêu cầu | Qua dispatcher: `redesign-existing-projects`, `runtime-branding`, `high-end-visual-design`, `web-design-guidelines` |
| Tạo UI/page mới | Qua dispatcher: `runtime-branding`, `high-end-visual-design`, `web-design-guidelines`; tiếp tục dùng architecture HRM hiện có |
| Animation/motion được yêu cầu hoặc cần để thể hiện chuyển trạng thái | `.agents/skills/emil-design-eng/SKILL.md`; hover/focus thông thường không tự yêu cầu motion |
| Review code, kiểm tra regression hoặc self-review thay đổi code | `.agents/skills/code-review/SKILL.md` |

Các tên rút gọn trong bảng đều trỏ tới `.agents/skills/<tên>/SKILL.md`.
Task chỉ sửa API, dữ liệu, backend hoặc tài liệu không tự kích hoạt bộ skill UI.

### Giới hạn áp dụng

- Yêu cầu người dùng và chỉ dẫn có độ ưu tiên cao hơn phải được tôn trọng.
  Skill bổ trợ cho `AGENTS.md`, `.agents/rules/`, Backend contract và architecture;
  không dùng sở thích thiết kế trong skill để mở rộng scope hoặc thay đổi nghiệp vụ.
- Audit/plan không cho phép tự sửa application. Tôn trọng workflow planning nếu
  người dùng yêu cầu review plan trước khi implement.
- Humanize HR là application UI phục vụ công việc. Reuse tokens, shadcn/ui,
  Tailwind và pattern thực tế; không tự thêm hero, hiệu ứng marketing, dependency,
  theme hoặc hệ branding mới chỉ vì skill đề cập khả năng đó.
- Xác minh bằng kiểm tra phù hợp với thay đổi. Phân biệt rõ đã đọc source, đã test,
  đã xem UI chạy thực tế và phần chưa kiểm chứng; không kết luận UI PASS chỉ từ code.

## Frontend

Khi thay đổi frontend, đọc:

`.agents/rules/frontend.md`

## Workflow

### Attendance → Payroll MVP Collaboration

Khi làm Attendance Calculation/Payroll Configuration, đọc [kế hoạch](docs/plans/attendance-calculation-payroll-mvp.md) và [checklist vertical slices](docs/plans/attendance-payroll-mvp-slices.md). Frontend agent mới bắt đầu từ [ANTIGRAVITY_CONTEXT](docs/agents/ANTIGRAVITY_CONTEXT.md). Mỗi slice phải có Backend/API thật → Frontend → Codex review → người dùng QA localhost và xác nhận `done` trước slice tiếp theo. Không implement toàn bộ backend trước frontend; policy còn OPEN không được tự chốt. Checklist là nguồn tiến độ, không tự ghi người dùng đã QA/done.

Phân công hiện hành, áp dụng từ lượt re-review S1 và các slice sau:

- **Codex:** nghiệp vụ, architecture, Prisma/Backend/API contract, mọi logic/state/data flow/validation/API integration/concurrency ở cả Backend lẫn Frontend, tests tương ứng và integration review. Phát hiện lỗi logic trong frontend thì chủ động sửa/test trong scope, không chỉ giao lại Anti vì vị trí file là frontend.
- **Anti:** React UI/UX, CSS, layout, responsive, visual và kiểm thử giao diện. Chỉ giao Anti lỗi thuần giao diện; không giao lỗi logic/API/state dưới nhãn UI.
- Lỗi có cả logic và giao diện: Codex xử lý logic trước, bàn giao rõ phần visual còn lại cho Anti. Không hai agent sửa cùng file đồng thời; không tự nhắn agent/thread khác khi chưa được người dùng cho phép.
- Người dùng quyết định chính sách còn OPEN, QA localhost và xác nhận `done`; test tự động hoặc review PASS không thay thế xác nhận này. Quy tắc trên thay thế phân công cũ chỉ dựa vào ranh giới frontend/backend trong tài liệu bàn giao lịch sử.

Task thông thường:

Plan → Review → Implement → Review → Manual Test → Lint/Build → Commit

Không implement trước khi plan đã được người dùng phê duyệt nếu task được giao theo workflow planning.

## Portfolio Direction And Task Close-Out

- Mục tiêu dự án: portfolio ứng tuyển Frontend Developer; ưu tiên trải nghiệm thực tế, code dễ bảo trì và bằng chứng kiểm thử.
- Hạ tầng hiện dùng gói miễn phí. Ưu tiên API/dịch vụ hiện có, không bổ sung dịch vụ trả phí nếu chưa được yêu cầu.
- Lộ trình và trạng thái task: `docs/plans/frontend-portfolio-roadmap.md`. Đọc khi lập kế hoạch công việc tiếp theo.
- Sau mỗi task: giải thích luồng hoạt động bằng tiếng Việt dễ hiểu, thêm cách trình bày trong phỏng vấn và nhắc task tiếp theo trong lộ trình. Chỉ bắt đầu task tiếp theo khi người dùng yêu cầu.

## Verification Commands

Không mặc định chạy lint/build sau mỗi thay đổi nhỏ.

Khi hoàn thành milestone hoặc thay đổi có ảnh hưởng đáng kể:

```bash
npm run lint
npm run build
```
