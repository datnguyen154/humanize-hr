---
description: Phân tích task và tạo implementation plan trước khi code.
---

# Plan Workflow

Không chỉnh code trong workflow này.

## Step 1 — Understand

Đọc:

- rules liên quan;
- relevant learnings;
- feature code;
- shared dependencies cần thiết.

## Step 2 — Dependency check

Xác định:

- Backend/API contract nếu task có integration;
- component/hook/helper cần reuse;
- external dependency;
- business rule chưa rõ.

Nếu thiếu API contract hoặc requirement quan trọng → báo BLOCKER.

Không tự đoán.

## Step 3 — Impact analysis

Xác định:

- files dự kiến thay đổi;
- files dự kiến tạo mới;
- query/cache impact;
- form/state impact;
- routing impact;
- UI/responsive impact.

## Step 4 — Plan

Trình bày plan ngắn gọn theo step.

Với mỗi step:

- mục tiêu;
- file;
- cách làm;
- điểm cần lưu ý.

Không đưa nhiều architecture option nếu existing project pattern đã cho câu trả lời rõ ràng.

Chỉ trình bày alternatives khi thực sự có tradeoff đáng kể.

## Step 5 — Stop

Chờ user approve plan.

Không implement code cho đến khi user phê duyệt.
