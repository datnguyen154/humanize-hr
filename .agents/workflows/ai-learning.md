---
description: Lưu kiến thức tái sử dụng của feature sau milestone.
---

# Save Feature Learning

Chỉ chạy khi:

- milestone đã hoàn thành;
- implementation đã được review;
- manual test PASS;
- thông tin có giá trị cho task tương lai.

## Destination

`.agents/learnings/<feature>.md`

Ví dụ:

`payroll.md`

## Sections

### Architecture

Quyết định kiến trúc hoặc flow lâu dài.

### Patterns

Pattern cụ thể của project nên reuse.

### Bugs & Solutions

Bug có khả năng lặp lại và root cause.

### API / Contract Notes

Contract hoặc business rule ổn định cần biết cho feature.

## Rules

Không lưu:

- temporary workaround;
- thông tin đã lỗi thời;
- logs;
- giá trị test;
- conversation summary;
- nội dung dễ tìm trực tiếp trong code.

Mỗi entry phải ngắn và có giá trị tái sử dụng.

Nếu file tồn tại:

- merge;
- update outdated entry;
- không duplicate.
