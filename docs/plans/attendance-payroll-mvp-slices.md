# Attendance → Payroll MVP — Vertical Slices & Checklist

Cập nhật22/10/2026. **S1 DONE, người dùng QA PASS/done. S2A v1.1 đã integration re-review:** Backend137 PostgreSQL/HTTP/regression tests và full build PASS; Frontend110 Vitest+5 Node tests/lint/build PASS sau sửa logic. F11 tab/toolbar/calendar trang chính đã PASS; còn FUI-01/P2 batch review table375/390 giao Anti. [Evidence mới](../codex-reports/attendance-payroll-s2a-v11-integration-review.md), [contract v1.1](../modules/work-calendar-s2a-holiday-batch.md). Chưa user QA/done S2A, chưa S2B. Nghiệp vụ: [plan](attendance-calculation-payroll-mvp.md), [S2](attendance-payroll-s2-calendar-proposal.md), [contract v1](../modules/work-calendar-s2a.md). Tài liệu này là nguồn tiến độ chính.

## 1. Gate và trách nhiệm

Mỗi slice đi hết chuỗi: **duyệt nghiệp vụ/contract → Codex Backend/API/tests → Anti Frontend/API thật/tests → Codex review tích hợp → người dùng QA localhost → người dùng xác nhận done**. Sau đó mới bắt đầu slice tiếp theo. Backend READY chỉ là mốc bàn giao, không phải slice DONE.

- Phân công mới từ re-review S1 (22/10): Codex sở hữu business/architecture/Prisma/backend/contract, mọi logic/state/data flow/validation/API integration/concurrency và tests ở cả frontend/backend; chủ động sửa lỗi logic ngay trong review. Anti chỉ nhận UI/UX, CSS/layout/responsive/visual và tests giao diện. Lỗi hỗn hợp: Codex logic trước, Anti visual sau. Các mô tả Anti theo slice bên dưới chỉ là bề mặt UI; phần logic/integration thuộc Codex theo quy tắc này, thay phân công cũ. Người dùng quyết định policy và QA. Không sửa cùng file đồng thời, không tự nhắn thread khác khi chưa được người dùng cho phép.
- Mỗi slice chỉ xử lý blocker liên quan; không dùng policy tiền/công hoặc schema S2B còn OPEN để chặn calendar DRAFT S2A. Người dùng đã chốt nghiệp vụ S2, thay chặn check-in ngày nghỉ bằng ghi raw OUT_OF_SCHEDULE không tự có công/OT. Đã cho phép Backend S2A và migration additive; lượt Backend không tự làm Frontend hoặc mở S2B.
- S1 v1 đã implement tại [work-schedule.md](../modules/work-schedule.md). S2A v1 [APPROVED/Backend READY](../modules/work-calendar-s2a.md), có endpoints thật/brief cho Anti. S2B và các slice sau vẫn PROPOSED; phải chốt exact contract trước code và Backend READY trước Anti Frontend.
- Từ S2 người dùng tự commit/push sau QA PASS; không tự stage/commit/push trong lượt chuẩn bị/triển khai/review khi chưa có yêu cầu rõ ràng mới.
- Mỗi endpoint mới dùng `/api` và ADMIN theo đề xuất hiện tại, chưa tự thêm role HR. Auth 401/403 theo middleware hiện có; lỗi business mới dự kiến `{code,message,details?}`. 400 validation, 404 nguồn không có, 409 conflict/stale/locked; mã/trường cụ thể chỉ thành contract khi được duyệt.
- Không unlock trực tiếp kỳ LOCKED. Mọi yêu cầu sai sót sau khóa chỉ được ghi nhận riêng, không tự áp vào raw/snapshot/lương hoặc tự bù kỳ sau. Không có endpoint unlock, kể cả “chưa phát hành Payroll”.

## 2. Checklist tiến độ

`[ ]` chưa hoàn tất; `[x]` chỉ khi có evidence. Cột `done` chỉ ghi theo xác nhận người dùng. Một câu `done` không tự tạo bằng chứng test chưa chạy, không vượt gate policy còn treo. Report ghi rõ ai xác nhận và ngày.

| Slice | Contract APPROVED | Codex BE + tests READY | Anti FE + tests READY | Codex integration review | Người dùng QA + done | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| S0 — Quyết định/handoff | [x] Gate/contract S1 | N/A | N/A | [x] Source/context | N/A: người dùng đã xác nhận policy S1 và yêu cầu triển khai BE | Gate S1 đã duyệt; A0 của các slice sau còn OPEN |
| S1 — Lịch draft | [x] v1 | [x] Retest 52 PASS | [x] Anti UI + Codex logic/tests | [x] Re-review PASS 22/10 | [x] Người dùng QA PASS + done 22/10 | DONE |
| S2A — Calendar Exceptions + Monthly Preview | [x] v1 duyệt; mở rộng v1.1 theo yêu cầu người dùng | [x]137 tests PostgreSQL/full build PASS, không migration mới | [ ] v1.1 có; còn FUI-01 mobile batch table | [ ] Logic đã sửa,110 Vitest+5 Node/lint/build PASS; chờ UI fix re-review | [ ] | Chưa PASS toàn slice/QA done |
| P1 — Kích hoạt lịch + gắn chấm công (gộp S2B) | [x] `POST /work-calendar/versions/:id/activate {expectedRevision}`, `GET /versions?status=ACTIVE`, cờ `Attendance.outOfSchedule` | [x] 126 tests + build PASS (2 integration DB skip) | [x] UI kích hoạt + card lịch đang áp dụng + badge "Ngoài lịch"; 113 Vitest/lint/build PASS | [x] Evidence Playwright mock `docs/evidence/p1/` | [ ] | Chờ người dùng QA localhost với PostgreSQL thật |
| P2 — Bảng công tháng tính on-demand (gộp S3–S5) | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu; đối soát dùng Attendance Adjustment có sẵn |
| P3 — Tạo bảng lương từ bảng công (gộp S6–S9 rút gọn) | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu; lương tháng nhập tay khi tạo bảng lương |

Checklist **S1 đã hoàn tất**, giữ evidence lịch sử:

- [x] Blocker S1 đã có quyết định người dùng, config demo/fixture và phạm vi không activate/tính công/lương.
- [x] Contract v1 có JSON request/response/error; report ghi API PostgreSQL/HTTP thật trước Anti code.
- [x] Backend full build PASS 19/10; re-review 22/10 `npx tsc` PASS và 52 tests PASS, gồm PostgreSQL/HTTP thật trong schema riêng và cleanup. Không chạy Prisma generate hoặc migrate public/production trong re-review.
- [x] Anti đã tích hợp API layer thật; Codex xác minh source/contract, bổ sung logic/tests: 56 Vitest + 5 Node helper = 61 tests PASS, lint/build PASS. Không đồng nhất API fixtures với QA end-to-end bằng tài khoản thật.
- [x] Vòng 1 có findings F01–F05, lịch sử giữ trong [review](../codex-reports/attendance-payroll-s1-integration-review.md). Anti đã sửa; Codex chủ động xử lý logic còn sót theo phân công mới.
- [x] Codex re-review F01–F05 PASS; Chrome actual focus/state/pagination/responsive PASS; PostgreSQL CRUD/CAS/audit/rollback và CORS preflight localhost:5173 PASS. Sau save 1 refetch list. Không còn lỗi UI S1 mới cần giao Anti trong scope đã kiểm tra.
- [x] Người dùng xác nhận ngày 22/10/2026: “Tôi đã QA localhost S1 và xác nhận done.” Ghi nhận QA tổng thể PASS, không tự bổ sung log/case/device mà người dùng chưa cung cấp. S1 DONE; không suy thành duyệt policy S2.

Checklist hiện tại **S2A**, Backend có [implementation evidence](../codex-reports/attendance-payroll-s2a-backend.md), Frontend có [review tích hợp](../codex-reports/attendance-payroll-s2a-integration-review.md), chưa user QA/done:

- [x] Người dùng chốt nghiệp vụ S2, sửa S2-04: cho chấm công ngày nghỉ/ngoài lịch và đánh dấu OUT_OF_SCHEDULE, không tự tính công/OT.
- [x] Source compatibility review status/dashboard/report đã ghi tại [plan S2 mục 7](attendance-payroll-s2-calendar-proposal.md); chưa chọn schema Attendance, không lấy đây làm blocker S2A.
- [x] Chuẩn bị [Exact Contract S2A v1](../modules/work-calendar-s2a.md): 6 endpoints, payload/DTO/query/errors/null/revision, atomic SWAP, preview đủ tháng và edge cases.
- [x] Người dùng review/duyệt Exact Contract v1 và cho phép triển khai Backend/logic S2A + migration additive.
- [x] Codex Backend S2A: 6 API thật, strict validation, parent CAS/audit, resolver/preview; 115 tests PASS, 0 fail/skip, gồm PostgreSQL/HTTP thật và regression S1/Attendance/report/dashboard; build/Prisma validate PASS.
- [x] Migration additive S2A đã áp localhost/hrm_db/public, migrate status up to date và schema diff không lệch. Không seed/reset/đổi Attendance/Payroll hoặc production migration.
- [x] Chuẩn bị [brief Anti](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) và contract thực tế. Chưa tự nhắn/giao agent triển khai hoặc làm Frontend thay Anti.
- [x] Anti đã implement Frontend S2A; Codex đối chiếu6 API, DTO,4 loại ngoại lệ, preview và sửa logic/state/validation/concurrency/cache;100 frontend tests/lint/build PASS.
- [x] Review v1 trước đó:115 Backend/PostgreSQL/HTTP tests và tsc PASS, full build lúc đó bị khóa DLL. V1.1 đã xác minh lại full build PASS và137 tests; không migration/reset/seed public trong hai lượt.
- [x] Browser API thật: ADMIN, preview tháng partial/complete, đổi tháng, dirty discard/cancel/focus; dialog thấp và desktop/tablet. Không suy automated CRUD thành browser E2E.
- [x] Anti sửa F11 tab/toolbar/grid; Codex browser re-review375/390/768/1440 đo bounds thực tế PASS. Không đồng nghĩa batch table mới cũng PASS.
- [x] Người dùng đã dừng backend; full Backend build Prisma generate+tsc PASS ở lượt mở rộng presets/batch. Block DLL vòng review trước đã được xử lý, không tự dừng process.
- [x] Backend v1.1: catalog có nguồn, phân loại HOLIDAY, batch-preview/commit atomic/CAS/fingerprint/audit, dedup/compensation và legacy compatibility;137 tests thật PASS. Reuse payload/audit Json, không migration.
- [x] [Brief Anti cập nhật](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) gộp cải thiện form nghiệp vụ và F11; frontend application không đổi trong lượt Backend v1.1.
- [x] Anti triển khai UIv1.1; Codex review/sửa fresh snapshot, payload company, preview/commit/race,409/dirty/focus, phân loại/catalog/year và test envelope.110 Vitest+5 Node/lint/build PASS;137 Backend tests/full build PASS.
- [x] FUI-01/P2 (Claude, 23/11/2026): batch preview dùng bảng từ `sm` trở lên, danh sách gọn trên mobile; dùng chung `DayTypeBadge`/`DayDetails`/`DayStatus`, không đổi logic. `tsc -b`, eslint, 54 Vitest work-calendar PASS. Playwright với API giả lập bằng planner thuần của backend (chưa phải API/PostgreSQL thật): 375/390/390x560/768/1440 không tràn ngang (375px: 275/275), footer hiển thị, Escape mở xác nhận bỏ thay đổi, Hủy giữ dialog.
- [ ] Người dùng QA localhost và xác nhận done S2A trước mở S2B.

## 3. Localhost và bộ dữ liệu QA

Base QA dự kiến: UI `http://localhost:5173`, API `http://localhost:3000/api`, health `http://localhost:3000/health`. CORS source hiện chỉ cho phép localhost:5173 và production, không phải mọi host/port. Không tự đổi env/deployment/CORS hoặc dừng server người dùng. URL **mới** trong từng slice chỉ dùng được sau Anti thêm route; hiện không cam kết route đó mở được.

Codex bàn giao dữ liệu QA local được người dùng cho phép, không dùng payroll thật để thử ghi. Cần nhân viên đủ nguồn, thiếu punch, phép được duyệt, ngày lễ/ngoại lệ và kỳ draft/locked theo slice. Fixture trong automated tests không thay cho QA với API thật. Không tự seed hoặc migrate trong task lập kế hoạch này.

## 4. Chi tiết từng slice

### S0 — Review A0 và handoff

- **Scope:** xác nhận các mục đã chốt/chưa chốt ở mục 8 của plan; duyệt schema/contract S1. S0 đã nhận xác nhận gate draft và ủy quyền implement Backend S1, không đóng toàn bộ A0 của các slice sau.
- **Contract:** S1 v1 đã chốt theo ủy quyền Codex; các contract sau vẫn PROPOSED. Artifact là danh sách quyết định và S1 request/response/errors thực tế, không tự tạo giá trị policy mặc định.
- **Codex:** source audit, context Anti, chia slices, ghi blockers và nhận quyết định; **Anti:** đọc context/source và nêu thiếu thông tin frontend, chưa implement; **người dùng:** xác nhận policy/gate.
- **Test/acceptance:** cả ba thống nhất state/version/date/unit, quyền và expected fixtures; điểm chưa chốt ghi OPEN, không đánh resolved bằng đề xuất của agent.
- **QA URL hiện có để tham khảo:** `http://localhost:5173/admin/attendance`, `http://localhost:5173/admin/attendance/report`, `http://localhost:5173/admin/payroll`; không có UI mới hoặc QA runtime trong task docs này.

### S1 — Xem/tạo/sửa bản nháp lịch làm việc

- **Scope:** WorkScheduleVersion draft + UI cấu hình một lịch chung. Chọn ngày tuần, giờ vào/ra, khoảng nghỉ và effectiveFrom; nút dùng mẫu demo điền form rồi lưu bằng API. **Không activate**, không đổi check-in/PRESENT/LATE hiện tại, không tính công hưởng lương, không tự backdate/seed lịch active.
- **Gate đã xác nhận:** Asia/Ho_Chi_Minh, YYYY-MM-DD/HH:mm/ISO 1–7, đúng một nghỉ giữa ca (demo 12–13 không tính làm việc), chỉ ADMIN và một lịch công ty; effectiveFrom draft chưa làm thay nguồn. Giới hạn áp dụng trước activate và policy lương còn thuộc gate S2 trở đi.
- **Contract v1 IMPLEMENTED:** `GET/POST /work-calendar/versions`, `GET/PATCH /work-calendar/versions/:id`. Full body/DTO/validation/errors/concurrency tại [contract chính thức S1](../modules/work-schedule.md); không lấy đề xuất trước làm source of truth. DRAFT only, partial PATCH + expectedRevision, breaks array đúng một interval, list page/limit + meta; không nhận công/tiền từ FE.
- **Codex:** migration local được duyệt cho đúng scope, validation/repository/API/audit draft; tests role/invalid/cas/reload và example responses. Không xây sẵn toàn period/payroll engine.
- **Anti:** page/form RHF/Zod, date picker, weekday controls/time inputs, list draft và edit; API/query/mutation thật, invalidate lịch; disable double-save, lỗi giữ form. Không hiển thị active giả.
- **Test/QA acceptance:** dùng mẫu demo → lưu → reload vẫn đúng; sửa draft → revision tăng; payload sai bị server từ chối; stale 409 không ghi đè; Employee không được sửa; desktop/mobile/keyboard và loading/error/retry đạt. QA không cần chọn chính sách prorate/lễ để lưu draft.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/settings`.

### S2A — Calendar Exceptions + Monthly Preview

- **Scope:** HOLIDAY/COMPENSATORY_OFF/SWAP/WORK_OVERRIDE trên DRAFT, một cặp swap atomic, CRUD + revision/audit và preview tháng. Không activate, Attendance integration, công/lương/OT.
- **Contract:** [Exact v1 APPROVED / Backend IMPLEMENTED](../modules/work-calendar-s2a.md), thay shape sơ bộ S2 trước đây. List/detail/create/replace/delete ngoại lệ theo version; GET preview bắt buộc versionId DRAFT. Giữ S1 API/envelope; thiếu nguồn dùng null/issues, không lấp bằng lịch demo.
- **Owner/workflow:** Codex Backend/logic/tests → Backend READY/brief được phép → Anti Frontend/UI → Codex review/sửa logic → người dùng QA/done S2A. Không backend S2B trước frontend/QA S2A.
- **Acceptance có evidence:** leap/year boundary, SWAP/cross-month, dependencies/null/blockers, CAS/audit/repeatable snapshots; preset/classification/batch atomic/dedup/rollback theo [v1.1](../modules/work-calendar-s2a-holiday-batch.md).137 Backend tests/full build PASS,110 Vitest+5 Node/lint/build Frontend PASS. Browser API thật preview/focus và trang chính responsive PASS; còn FUI-01 mobile review table giao Anti. Chờ re-review/UI và người dùng QA/done.
- **QA URL đã có:** `http://localhost:5173/admin/attendance/settings?tab=calendar`; steps và giới hạn kiểm thử tại report review.

> **23/11/2026 — người dùng duyệt gộp S2B–S9 thành P1–P3** theo [roadmap portfolio](frontend-portfolio-roadmap.md). Các mục S2B–S9 bên dưới chỉ giữ làm tham chiếu nghiệp vụ; phạm vi thực hiện theo P1–P3.

### S2B — Schedule Activation + Attendance Integration

- **Đã chốt:** ADMIN, lịch chung/ca ban ngày; activate từ ngày mai, không hồi tố, ACTIVE bất biến; chưa có ACTIVE giữ legacy. Đi muộn theo giờ bắt đầu lịch ngày đó, chưa grace. **Ngày nghỉ/ngoài lịch vẫn check-in/out + OUT_OF_SCHEDULE**, không tự có công/OT.
- **Trước code/schema:** compatibility review status/dashboard/report đã có; Codex phải chốt representation và cách đếm raw total/punctuality/ngoài lịch, snapshot/approve/filter/Excel/DTO theo nguồn, không thêm enum rồi bỏ rơi consumers cũ. Đây là gate S2B, không phải blocker S2A.
- **Contract còn đề xuất:** timeline/activate expectedRevision + fingerprint/reason/snapshot và additive employee context; chưa được implement. Chưa đổi enum/nullability Attendance, chưa mở activation trong S2A.
- **Acceptance dự kiến:** race/stale/midnight/hiệu lực, snapshot lịch sử, raw ngoài lịch vẫn được lưu/checkout/hiển thị/tổng hợp, không cấp công/OT hoặc PRESENT/LATE giả; regression S1/Attendance/dashboard/report. Đi đủ Backend/logic → Anti UI → Codex review → người dùng QA/done S2B.

### S3 — Preview công của một nhân viên/tháng

- **Scope:** engine công thuần + API preview kết hợp lịch/Attendance/phép/điều chỉnh, chưa lưu kỳ và chưa chuyển Payroll. Một màn hình xem breakdown/issues cho nhân viên được chọn; engine backend được dùng lại ở S4, không viết bản thứ hai trong FE.
- **Gate:** mẫu số lễ/nghỉ bù, công partial/grace/rounding, phép hợp lệ/quota/phạm vi ngày, dữ liệu employment và timezone đã có fixture được duyệt. Policy version đầu tiên phải truy vết được; nếu cần policy editor vượt scope thì tách task và duyệt trước, không bí mật hardcode business rule.
- **Contract PROPOSED:** `POST /attendance-periods/preview` `{employeeId,year,month,policyVersionId}` → `{data:{employee,period,days,summary,issues,policyVersionId,engineVersion,sourceFingerprint}}`; `GET /attendance-calculation-policies` trả policy versions đã duyệt để chọn/hiển thị. Công Decimal string hoặc null theo contract; issue có code/severity/date; metadata/read-only preview chưa tạo period/Payroll. 400 period/policy sai, 404 nguồn, nguồn thiếu trả issue/null theo contract chứ không giả 0.
- **Codex:** engine/day aggregation, source adapters theo lô và preview contract/tests; policy được duyệt lưu version theo schema tối thiểu cần thiết. **Anti:** chọn người/kỳ/policy, hiển thị preview/read-only issues/nguồn; request explicit, không gọi engine frontend hoặc ngầm lưu Payroll; hỗ trợ cancel request/thay lựa chọn không hiện sai kết quả cũ.
- **Test/QA acceptance:** người đủ công/không punch/thiếu checkout/phép trùng/lễ/giờ ngoài ca/người vào giữa kỳ; số 0 khác null, ngày tương lai không thành vắng; điều chỉnh approved không cộng hai lần; kết quả khớp fixtures. Màn hình chỉ ghi “tạm tính”, không cho khóa hay trả lương.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/calculation`.

### S4 — Bảng công nháp toàn kỳ

- **Scope:** lưu AttendancePeriod/Employee/Day, tính toàn tháng bằng engine S3; list/summary/detail với tất cả nhân viên thuộc kỳ. Chưa confirm/lock hoặc ghi Payroll.
- **Contract PROPOSED:** `POST /attendance-periods` `{year,month}`; `POST /attendance-periods/:id/calculate` `{expectedRevision}`; `GET /attendance-periods`, `GET /attendance-periods/:id`, `GET .../:id/employees`, `GET .../:id/employees/:employeeId`. Header `{data:{id,year,month,status,revision,sourceFingerprint,calculatedAt,totals,issues}}`; employee list `{data,meta}`. 409 stale/wrong state; totals là toàn kỳ không theo trang; exact filters/nullable fields chốt trước Anti code.
- **Codex:** lưu kết quả/fingerprint transaction, batch queries, stale detector và snapshot provenance; tests list/count/rights/calculation. **Anti:** page kỳ, employee table/mobile cards, filter issue/search/pagination, detail ngày; manual calculate khác refetch, rõ trạng thái nguồn đã thay đổi.
- **Test/QA acceptance:** cả người không punch xuất hiện; phân trang không đổi tổng; reload đọc kết quả lưu; GET không tính lại; source insert/delete làm stale; duplicate calculate không nhân đôi ngày; loading/refetch giữ layout và lỗi có retry.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/periods` và `http://localhost:5173/admin/attendance/periods/{periodId}`; placeholder phải thay id local thật khi handoff.

### S5 — Đối soát từng ngày có lý do/audit

- **Scope:** resolution whitelist, giữ calculated và resolved riêng, audit/căn cứ; dùng lại flow duyệt điều chỉnh raw hiện có, không cho nhập tổng tháng tùy ý.
- **Contract PROPOSED:** `POST /attendance-periods/:id/days/:dayId/reconciliations` `{expectedRevision,resolutionType,values,reason,evidence?}` → `{data:{day,employeeSummary,periodRevision}}`; GET detail S4 mở rộng audit. Whitelist values/bằng chứng/giới hạn quyền cần duyệt; 400 reason/values sai, 409 source đổi. Không dùng API này cấp quyền nghỉ có lương thiếu căn cứ hoặc sửa raw ngầm.
- **Codex:** reconciliation log + source guard/recalculate totals và test stale/immutability. **Anti:** modal day detail/resolution với RHF/Zod, dữ liệu gốc/kết quả/lý do, error giữ input, mutation pending, cập nhật đúng summary/list; liên kết điều chỉnh hiện có.
- **Test/QA acceptance:** chưa đủ căn cứ thì issue còn mở; không bypass tất cả; sửa có before/after và actor/time; recalculate không xóa audit/không giữ override stale như hợp lệ; approval hiện có vẫn hoạt động. Không tự trừ công phút khi policy chưa duyệt.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/periods/{periodId}` (modal chọn ngày); regression `http://localhost:5173/admin/attendance/adjustments`.

### S6 — Xác nhận/khóa và tiếp nhận sai sót sau khóa

- **Scope:** DRAFT → CONFIRMED → LOCKED, snapshot bất biến, guard mọi source writer. Cùng slice cung cấp đường ghi nhận correction request sau khóa, không mở khóa hoặc tự áp tiền; không release lock UI mà không có lối ghi nhận sai sót.
- **Gate:** ai confirm/lock, khóa cả tháng hay từng người, thời điểm/cutoff/pending requests, ai được ghi nhận yêu cầu sau khóa và ai tiếp nhận. **Không unlock đã chốt**, không hỏi lại việc cho unlock trước publish. Luồng xử lý tiếp theo/kỳ bù chưa được tự quyết.
- **Contract PROPOSED:** `POST /attendance-periods/:id/confirm`, `POST .../:id/lock` `{expectedRevision}` → metadata/revision/snapshot reference; 409 blocker/source-changed/locked. Thêm `GET/POST .../:id/correction-requests`; tạo `{employeeId,date?,reason,requestedChange,evidence?}` → `{data:{id,periodId,status:'RECORDED',...}}` theo đề xuất, giữ snapshot reference + actor/time/audit. Role/scope/lifecycle cuối cùng cần duyệt; RECORDED chỉ là đã tiếp nhận, không đồng nghĩa đã approved/applied. Không endpoint unlock hoặc apply vào snapshot.
- **Codex:** schema receipt/audit, atomic lock/CAS/fingerprint, guard các write Attendance/Leave/calendar/employee và tests concurrency; lưu receipt không update nguồn lịch sử. **Anti:** confirmation rõ hậu quả, read-only locked UI/history, form ghi nhận sai sót/danh sách trạng thái; xử lý 409 tiếng Việt, không optimistic unlock hoặc tính lại.
- **Test/QA acceptance:** race lock vs sửa nguồn không lọt; thiếu nguồn/blocker chặn lock; double-submit không khóa lặp; sau LOCKED không có nút/route unlock; request có lý do/audit và reload còn; raw/snapshot/Payroll không đổi sau ghi nhận. Yêu cầu cắt qua kỳ kiểm tra atomic mọi kỳ liên quan. Không tự bù tiền kỳ sau.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/periods/{periodId}` (tab audit/corrections trong cùng page); regression tại admin/employee attendance và leave pages liên quan.

### S7 — Salary Template có cấu trúc và preview thử

- **Scope:** mẫu demo/system clone thành draft, bật/tắt/thêm/bớt optional lines, version/activate, backend engine MONTHLY dùng chung. Preview dữ liệu thử ghi nhãn, chưa ghi Payroll hoặc bịa công thật.
- **Gate:** rule types/base/whitelist, validation/rounding, thuế/BH và rate/effective scope được duyệt; không đưa auto tax/OT/free formula vào MVP.
- **Contract PROPOSED:** `GET/POST /salary-templates` (POST clone có sourceVersionId), `GET /salary-templates/:id`, `POST /salary-templates/:id/versions`, `PATCH /salary-template-versions/:id`, `POST /salary-template-versions/:id/activate`, `POST /salary-template-versions/:id/preview`. Preview thử `{inputs,expectedRevision}` → `{data:{lines,totals,issues,templateVersion,engineVersion,inputMode:'DEMO'}}`. Exact rule discriminators/Decimal strings và field nullable phải có examples; 409 active immutable/stale. Không chấp nhận expression tùy ý.
- **Codex:** versioned config, pure Payroll Engine, validate/dependency order, Decimal/tests; **Anti:** editor structured/RHF field arrays, optional lines, preview API, confirmation activate, UI không tự evaluate bằng Number.
- **Test/QA acceptance:** clone không sửa system, khoản tắt không xuất hiện, active bất biến, demo preview có nhãn, preview/save sau này cùng engine; negative/overflow/cycle/unknown source bị từ chối; không lưu thử vào Payroll thật.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/payroll/templates`.

### S8 — Gán lương và preview từ kỳ công khóa

- **Scope:** gán template version + monthlySalary có hiệu lực; preview nhân viên/kỳ từ snapshot LOCKED, không nhập tay công trong luồng mới và chưa phát hành.
- **Contract PROPOSED:** `GET/POST /employees/:id/salary-assignments`; `POST /payrolls/preview-calculation` `{employeeId,year,month,assignmentId,expectedRevision}` → `{data:{attendanceSnapshotRef,assignmentVersion,lines,totals,issues,previewFingerprint}}`. Rate/config/công reload server, không nhận client netSalary; 409 assignment overlap/stale/unlocked, 400 standardDays=0, 404 nguồn/rate. Source revision và preview expiry semantics chốt cụ thể trước code.
- **Codex:** assignment history/no-overlap, load/validate snapshot và engine integration; **Anti:** assignment UI trong flow payroll, preview/breakdown/căn cứ/nghĩa vụ chưa đủ, không deep redesign Employee module.
- **Test/QA acceptance:** đúng người/tháng/snapshot; chưa khóa hoặc rate chưa có bị chặn; nhân viên vào/nghỉ giữa kỳ theo fixture; nghỉ hưởng lương tính đủ, unpaid không trừ lần hai; refresh cache không tự tính/lưu tiền.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/payroll` (dialog gán/preview trong phạm vi slice; không đổi route hiện có thành /payrolls).

### S9 — Lưu nháp, phát hành và PDF từ snapshot

- **Scope:** lưu CONFIGURED Payroll, review/publish atomic, Employee/PDF đọc snapshot; legacy được giữ. Không unlock kỳ công khi payroll còn draft, không tự recalculate Published.
- **Contract PROPOSED:** `POST /payrolls/calculate` `{employeeId,year,month,assignmentId,previewFingerprint}`; versioned DTO/conditional revision cho flow publish hiện hữu `PATCH /payrolls/:id/publish`; đọc list/PDF theo tương thích legacy đã duyệt. Trả lines/totals/snapshot refs/calculationMode; mapping cột cũ không tự gán mọi cộng thêm là bonus. 409 stale/already published/duplicate period; không tự đổi contract publish cũ trước review.
- **Codex:** snapshot write/publish guards, legacy compatibility/PDF/tax-BH gate/tests; **Anti:** tích hợp dialog create/detail/publish và Employee display/PDF download, render LEGACY/CONFIGURED theo response, không ghi đè form cũ ngoài scope.
- **Test/QA acceptance:** preview/save khớp Decimal/làm tròn; concurrent edit/publish an toàn; đổi lịch/tên/rate không đổi chứng từ đã phát hành; ownership PDF; nghĩa vụ còn thiếu không hiển thị như net hoàn chỉnh; old/new payroll vẫn dùng được.
- **QA URL hiện có:** `http://localhost:5173/admin/payroll`, `http://localhost:5173/employee/payrolls`.

## 5. Chốt slice và evidence

Report từng slice đặt tại `docs/codex-reports/attendance-payroll-s<N>-<topic>.md` khi thực sự bắt đầu; đây là quy ước tên dự kiến, chưa tạo report rỗng hàng loạt. Chứa contract approved/version, backend/frontend changed files, test commands/results, integration findings, URL local thật + test data ids, manual steps/expected, QA result và user done. Không lưu token/credential/PII thật trong report.

Backend chưa có npm script lint/test: Codex ghi build và `node --test` file liên quan thực chạy; Anti ghi `npm run test`, `npm run lint`, `npm run build` trong frontend. Test mock/Playwright giả API không thay bằng chứng QA API thật. Task chỉ tài liệu thì không báo application PASS; S2A Backend hiện có evidence thực chạy tại report, không thay QA UI người dùng.

**Bước tiếp theo:** giao [brief FUI-01](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) để Anti sửa riêng mobile batch review → Codex re-review → người dùng QA/done S2A. Logic/API hiện PASS, S2A chưa slice DONE, không tự chuyển S2B hoặc commit/push.
