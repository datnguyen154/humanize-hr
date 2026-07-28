---
description: Load project learnings có liên quan trước khi thực hiện task.
trigger: always_on
---

# Load Relevant Learnings

Trước task:

1. Liệt kê tên file trực tiếp trong `.agents/learnings/`.
2. Xác định file liên quan tới task dựa trên feature/domain.
3. Chỉ đọc file liên quan.
4. Không đọc toàn bộ learnings nếu không cần.
5. Không đọc lại learning đã được load trong cùng task/session.

Ví dụ:

Task Payroll:

- payroll.md → đọc
- attendance.md → chỉ đọc nếu task có dependency Attendance

Nếu không có learning phù hợp → tiếp tục bằng codebase hiện tại.

Learnings là context bổ trợ.

Code hiện tại và Backend contract mới nhất có độ ưu tiên cao hơn learning cũ nếu xảy ra mâu thuẫn.
