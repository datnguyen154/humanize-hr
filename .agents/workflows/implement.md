---
description: Implement task đã có plan được approve.
---

# Implement Workflow

## Preconditions

Chỉ chạy khi:

- requirement đủ rõ;
- API dependency đã xác nhận nếu cần;
- implementation plan đã approve.

## Step 1 — Re-read scope

Đọc plan được approve.

Không mở rộng scope.

## Step 2 — Context audit

Trước mỗi thay đổi:

- kiểm tra implementation hiện tại;
- kiểm tra dependency;
- tìm shared abstraction;
- kiểm tra impact.

## Step 3 — Implement

Thực hiện theo plan.

Ưu tiên reuse.

Không redesign hoặc refactor ngoài scope.

## Step 4 — Self review

Kiểm tra:

- logic;
- TypeScript;
- state;
- error handling;
- edge cases;
- accessibility;
- responsive;
- consistency với feature hiện tại.

## Step 5 — Report

Không tự tuyên bố manual test PASS.

Báo:

1. Files thay đổi.
2. Behavior đã implement.
3. Điểm cần user manual test.
4. Lint/build có cần chạy ngay hay đợi milestone.

Sau đó dừng để user review.
