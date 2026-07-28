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

## Frontend

Khi thay đổi frontend, đọc:

`.agents/rules/frontend.md`

## Workflow

Task thông thường:

Plan → Review → Implement → Review → Manual Test → Lint/Build → Commit

Không implement trước khi plan đã được người dùng phê duyệt nếu task được giao theo workflow planning.

## Verification

Không mặc định chạy lint/build sau mỗi thay đổi nhỏ.

Khi hoàn thành milestone hoặc thay đổi có ảnh hưởng đáng kể:

```bash
npm run lint
npm run build
```

`AGENTS.md` là format dành cho repository-level agent instructions và phù hợp để truyền setup, conventions và behavior cho coding agents. :contentReference[oaicite:2]{index=2}

---

# 3. XÓA `web-design-backbone.md`

Mình chốt **xóa file hiện tại**.

Không sửa.

Nó không phù hợp HRM.

Hiện file bắt Agent:

- phải "WOW";
- Google Font;
- Hero;
- CTA glow;
- scroll animation;
- card hover lift;
- gradient;
- section 80px;
- cấu trúc HTML/CSS/JS;
- so với Apple/Stripe/Linear. :contentReference[oaicite:3]{index=3}

Đó là guideline tốt cho marketing page, nhưng HRM là application UI.

Thay bằng:

```text
.agents/rules/frontend.md
```
