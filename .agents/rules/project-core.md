---
description: Quy tắc cốt lõi của Humanize HR áp dụng cho mọi coding task.
trigger: always_on
---

# Humanize HR Core Rules

## Understand before changing

Trước khi sửa code:

1. Đọc file liên quan.
2. Trace dependencies cần thiết.
3. Hiểu pattern hiện tại.
4. Xác định impact của thay đổi.

Không code dựa trên suy đoán khi có thể kiểm tra codebase.

## Scope

Thực hiện đúng scope task.

Không tự:

- thêm feature;
- redesign;
- refactor ngoài scope;
- đổi contract;
- nâng dependency.

## Maintainability

Ưu tiên:

- đơn giản;
- rõ ràng;
- type-safe;
- reuse hợp lý;
- ít side effect;
- dễ review.

Không over-engineer.

## Existing architecture is the default

Khi nhiều approach đều hợp lệ, chọn approach phù hợp architecture hiện tại.

Chỉ đề xuất architecture khác khi pattern hiện tại thật sự không đáp ứng task.

## Communication

Agent phải trả lời bằng tiếng Việt.

Technical terminology có thể giữ tiếng Anh.

Khi có blocker hoặc uncertainty đáng kể, báo rõ thay vì đoán.

## Git

Không tự commit, push, reset, checkout hoặc thay đổi Git history nếu người dùng không yêu cầu.

Có thể đề xuất commit message khi milestone hoàn thành.

## Secrets

Không hardcode:

- token;
- API key;
- password;
- credential.

Không đưa secret vào logs, source code hoặc documentation.
