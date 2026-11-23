# Lộ trình portfolio Humanize HR (bản dựng lại 23/11/2026)

> **Trạng thái: người dùng đã duyệt 23/11/2026** việc gộp S2B–S9 thành P1–P3 và chọn lương tháng
> nhập tay khi tạo bảng lương. Checklist [attendance-payroll-mvp-slices.md](attendance-payroll-mvp-slices.md)
> đã được đồng bộ. Các quyết định đã chốt nằm ở mục 5.

## Tiến độ (cập nhật 23/11/2026)

| Hạng mục | Trạng thái |
| --- | --- |
| FUI-01 (S2A mobile batch preview) | Xong code + evidence; chờ người dùng QA S2A |
| P1 Kích hoạt lịch + chấm công | Xong code, test (gồm integration PostgreSQL), evidence `docs/evidence/p1/`; chờ QA |
| P2 Bảng công tháng | Xong code, test, evidence `docs/evidence/p2/`; chờ QA |
| P3 Bảng lương từ bảng công | Xong code, test, evidence `docs/evidence/p3/`; chờ QA |
| Cold-start UX | Xong, evidence `docs/evidence/cold-start/` |
| Seed demo | Xong (lịch ACTIVE từ 01/10/2026 + chấm công 01/10–20/11), đã thử 2 lần trên schema tạm |
| README | Đã cập nhật luồng Lịch → Công → Lương, kiểm thử, API |
| Nội dung CV | Bản nháp tại `docs/cv/humanize-hr-cv-entry.md` |
| Production | Vercel đã có frontend mới; **backend Render vẫn chạy bản cũ** (route `/api/work-calendar/*` trả 404). Cần người dùng kiểm tra Render: auto-deploy và log build/migrate |

## 1. Mục tiêu và ràng buộc

- Đây là dự án cá nhân, dùng để ứng tuyển **Frontend Developer Intern**. Nhà tuyển dụng thường chỉ mở
  demo vài phút và đọc 5–6 dòng mô tả trên CV. Vì vậy ưu tiên **luồng hoàn chỉnh, demo được ngay**
  hơn là độ phủ nghiệp vụ pháp lý.
- Hạ tầng đều dùng gói miễn phí và không bổ sung dịch vụ trả phí:
  - **Vercel Hobby**: frontend tĩnh, không giới hạn đáng kể với quy mô này.
  - **Render Free**: service ngủ sau ~15 phút không có request, cold start 30–60 giây,
    RAM 512MB, **không có cron/background worker**.
  - **Neon Free**: dung lượng 0.5GB, compute tự ngủ khi idle.
- Hệ quả thiết kế:
  - Mọi phép tính (bảng công, lương) chạy **on-demand trong một request**, không dùng job định kỳ.
  - Dữ liệu demo nhỏ (khoảng 10–20 nhân viên, vài tháng chấm công).
  - Không lưu snapshot nặng hoặc lịch sử dư thừa.
  - Frontend phải xử lý tốt cold start, và đây cũng là điểm cộng có thể đưa vào CV.

## 2. Đánh giá kế hoạch cũ

- Phần còn lại của kế hoạch cũ gồm **8 slice (S2B–S9)**. Mỗi slice có quy mô tương đương S2A:
  hơn 100 test backend, contract và addendum, brief, nhiều vòng review.
  Ước tính phải mất nhiều tháng mới tới được màn hình bảng lương.
- Các phần như khóa kỳ không unlock, request sai sót sau khóa, salary template/rule engine,
  phân loại BHXH/thuế, DAILY/HOURLY **không tăng điểm cho một CV frontend**,
  nhưng lại làm tăng rủi ro dự án dừng giữa chừng mà không demo được gì.
- Những nguyên tắc tốt vẫn giữ: engine tính thuần ở backend, không hardcode 22/26 công,
  không phạt tiền khi đi muộn, ngày nghỉ vẫn được chấm công nhưng không tự cấp công hay OT.

## 3. Lộ trình mới

### Giai đoạn 0 — Đóng S2A và kiểm tra production (làm ngay)

1. Anti sửa **FUI-01** (bảng preview batch trên mobile 375/390px), sau đó Codex re-review và người dùng QA để chốt S2A done.
2. Kiểm tra log deploy Render: migration `20261022090000_add_calendar_exceptions` đã chạy trên Neon
   (code đã được push lên `main` ngày 23/11). Smoke test trang Lịch làm việc trên production.
3. Manual test trên production các mục đang chờ từ roadmap cũ: Admin Dashboard, Employee List lọc theo URL,
   báo cáo chấm công tháng và Excel, yêu cầu điều chỉnh chấm công.

### Giai đoạn 1 — Luồng Lịch → Công → Lương, gộp từ 8 slice còn 3

| Slice mới | Gộp từ | Phạm vi tối thiểu | Tái sử dụng |
| --- | --- | --- | --- |
| **P1 — Kích hoạt lịch và gắn vào chấm công** | S2B | ADMIN kích hoạt bản nháp (hiệu lực từ ngày mai, ACTIVE không sửa). Check-in tính `LATE` theo giờ bắt đầu của lịch ACTIVE trong ngày; ngày nghỉ hoặc ngoài lịch vẫn lưu, gắn cờ ngoài lịch | `WorkScheduleVersion`, `calendar-preview.engine.ts`, enum `AttendanceStatus` hiện có |
| **P2 — Bảng công tháng (tính khi xem)** | S3 + S4 + S5 | Admin xem bảng công cả công ty theo tháng: ngày công yêu cầu, có mặt, nghỉ phép đã duyệt, đi muộn, ngày thiếu dữ liệu. Có drill-down lịch tháng của từng nhân viên. Nhân viên xem bảng công của chính mình. **Không lưu kỳ công.** Việc đối soát dùng luồng **Attendance Adjustment** đã có, không tạo modal mới | Preview engine S2A, báo cáo tháng hiện có, Adjustment request |
| **P3 — Tạo bảng lương từ bảng công** | S6 + S7 + S8 + S9 (rút gọn) | Admin chọn nhân viên và tháng, **nhập tay lương tháng** trên form tạo bảng lương. Backend tính `lương tháng × ngày công hưởng lương / ngày công chuẩn` từ bảng công rồi lưu vào **Payroll DRAFT có sẵn** (bonus/deduction vẫn nhập tay). Không thêm field lương vào Employee. Publish dùng `PayrollStatus.PUBLISHED`; bản đã publish thì không sửa được, đây chính là phần "khóa" của MVP. PDF dùng generator hiện có | Model `Payroll`, `generatePayrollPdf`, trang payroll Admin/Employee |

**Loại khỏi phạm vi CV (có thể ghi vào mục "Hướng phát triển"):** salary template/rule engine,
snapshot kỳ công riêng, request sai sót sau khóa, BHXH/thuế, DAILY/HOURLY, ca đêm/ca xoay/OT,
Admin tạo thông báo nội bộ, quản lý tài khoản/chức vụ.

### Giai đoạn 2 — Hoàn thiện portfolio (làm xen kẽ, ưu tiên sau P1)

1. **UX cho cold start**: trang đăng nhập gọi `/health` ngay khi mở. Nếu chậm thì hiển thị
   "Đang khởi động máy chủ (~30–60 giây)", có tiến trình và nút thử lại. Không chặn người dùng nhập form.
   Đây là chi tiết frontend nên có trên CV.
2. **Seed dữ liệu demo đẹp** cho Neon: lịch ACTIVE, ngày lễ, 2–3 tháng chấm công có đi muộn, nghỉ phép,
   điều chỉnh, và bảng lương đã publish. Mục tiêu là tài khoản demo mở ra màn hình nào cũng có dữ liệu.
3. **README**: cập nhật danh sách tính năng còn thiếu (thông báo, HR assistant, import/export Excel,
   điều chỉnh chấm công, lịch làm việc), ảnh mới, 1 GIF luồng chính, số lượng test, và mục "Hướng phát triển".
4. Bổ sung test cho P1–P3 theo mức vừa đủ: engine thuần và luồng UI chính. Không cần đạt mức 137 test mỗi slice.

### Giai đoạn 3 — Cập nhật CV

- File slide CV hiện tại vẫn là nội dung mẫu của người khác. Cần thay bằng thông tin của bạn và thêm mục
  **Humanize HR** theo đúng format của mẫu: tên dự án | stack, link demo và GitHub, 5–6 bullet,
  mỗi bullet là "kỹ thuật + kết quả".
- **Chỉ ghi tính năng đã DONE và đã chạy trên production.** P1–P3 chỉ thêm vào CV sau khi người dùng QA xong.
- Bullet nháp từ các phần đã có:
  - Xây dựng HRM full-stack (React 19, TypeScript, TanStack Query, React Hook Form + Zod, shadcn/ui;
    Express, Prisma, PostgreSQL) với phân quyền Admin/Employee, JWT access/refresh token và protected routes.
  - Đồng bộ bộ lọc danh sách với URL, debounce search, giữ trạng thái khi reload hoặc Back/Forward,
    không nhảy layout khi refetch.
  - Import Excel có bước preview, hỗ trợ thành công một phần, kéo thả file; export Excel theo bộ lọc.
  - Lịch làm việc: ngày lễ, nghỉ bù, hoán đổi ngày, preview tháng, thêm ngày lễ hàng loạt.
    Xử lý cập nhật đồng thời (revision, lỗi 409) và cảnh báo khi rời form chưa lưu.
  - Trung tâm thông báo, luồng gửi và duyệt yêu cầu điều chỉnh chấm công.
  - Kiểm thử bằng Vitest + React Testing Library và node:test có test tích hợp PostgreSQL thật.
    Deploy Vercel + Render + Neon. Số liệu test lấy từ lần chạy mới nhất trước khi ghi.

## 4. Quy trình gọn hơn cho mỗi slice

- Giữ phân công: Codex làm logic/backend, Anti làm UI. Giữ gate người dùng QA và xác nhận done.
- Mỗi slice chỉ cần **1 contract ngắn (≤ 1 trang)** và **1 report ngắn**, thay cho bộ contract + addendum
  + brief + nhiều report. Mục tiêu là giảm thời gian viết tài liệu để dành cho sản phẩm.
- Chạy lint, build và test ở cuối slice. Sau khi QA PASS thì push để Vercel/Render deploy, rồi smoke test production.

## 5. Quyết định người dùng cần chốt trước P1/P3

1. ~~Gộp 8 slice thành P1–P3~~ — **ĐÃ DUYỆT 23/11/2026.**
2. ~~Nguồn "lương tháng" cho P3~~ — **ĐÃ CHỐT: nhập tay trên form tạo bảng lương**, không thêm field vào Employee.
3. **ĐÃ CHỐT:** ngày công chuẩn = số ngày làm việc yêu cầu của tháng theo lịch ACTIVE (preview S2A đã tính được).
4. **ĐÃ CHỐT:** trong bản demo, ANNUAL và OTHER đã duyệt thì có lương; SICK và UNPAID thì không.
   README sẽ ghi rõ đây là quy ước demo, không phải tư vấn pháp lý.
5. **ĐÃ CHỐT:** cold start chỉ xử lý bằng UX trong frontend, không thêm dịch vụ ping bên ngoài.

Tất cả quyết định đã chốt ngày 23/11/2026.
