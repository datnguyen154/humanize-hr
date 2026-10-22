# Attendance → Payroll MVP — Vertical Slices & Checklist

Cập nhật sau re-review 22/10/2026. **S1 Codex integration review PASS F01–F05**, Anti đã sửa và Codex bổ sung logic/tests theo phân công mới; xem [review mục 5](../codex-reports/attendance-payroll-s1-integration-review.md). Frontend 61 tests/lint/build PASS, Backend 52 tests (gồm PostgreSQL thật) PASS; DB blocker trước đã hết. **Chờ người dùng QA/done, chưa chuyển S2.** Nghiệp vụ/schema tổng quan: [plan](attendance-calculation-payroll-mvp.md). Handoff frontend: [Anti context](../agents/ANTIGRAVITY_CONTEXT.md). Tài liệu này là nguồn tiến độ chính, thay cách triển khai hết backend rồi mới làm UI.

## 1. Gate và trách nhiệm

Mỗi slice đi hết chuỗi: **duyệt nghiệp vụ/contract → Codex Backend/API/tests → Anti Frontend/API thật/tests → Codex review tích hợp → người dùng QA localhost → người dùng xác nhận done**. Sau đó mới bắt đầu slice tiếp theo. Backend READY chỉ là mốc bàn giao, không phải slice DONE.

- Phân công mới từ re-review S1 (22/10): Codex sở hữu business/architecture/Prisma/backend/contract, mọi logic/state/data flow/validation/API integration/concurrency và tests ở cả frontend/backend; chủ động sửa lỗi logic ngay trong review. Anti chỉ nhận UI/UX, CSS/layout/responsive/visual và tests giao diện. Lỗi hỗn hợp: Codex logic trước, Anti visual sau. Các mô tả Anti theo slice bên dưới chỉ là bề mặt UI; phần logic/integration thuộc Codex theo quy tắc này, thay phân công cũ. Người dùng quyết định policy và QA. Không sửa cùng file đồng thời, không tự nhắn thread khác khi chưa được người dùng cho phép.
- Mỗi slice chỉ xử lý blocker liên quan đã được duyệt; blocker của phần tính lương không mặc nhiên cấm làm UI draft lịch, nhưng không được áp policy chưa duyệt. Người dùng đã xác nhận gate S0 liên quan draft và ủy quyền Codex chốt contract/implement Backend S1; chưa cho làm S2.
- Contract S1 v1 đã chốt/implement tại [work-schedule.md](../modules/work-schedule.md). API/URL mới của **các slice còn lại** vẫn PROPOSED. Trước code Codex phải chốt exact request/response/examples/errors/null/date/Decimal/revision; người dùng duyệt nghiệp vụ. Trước Anti code cần contract APPROVED + backend chạy được, không chỉ có interface/mock.
- Mỗi endpoint mới dùng `/api` và ADMIN theo đề xuất hiện tại, chưa tự thêm role HR. Auth 401/403 theo middleware hiện có; lỗi business mới dự kiến `{code,message,details?}`. 400 validation, 404 nguồn không có, 409 conflict/stale/locked; mã/trường cụ thể chỉ thành contract khi được duyệt.
- Không unlock trực tiếp kỳ LOCKED. Mọi yêu cầu sai sót sau khóa chỉ được ghi nhận riêng, không tự áp vào raw/snapshot/lương hoặc tự bù kỳ sau. Không có endpoint unlock, kể cả “chưa phát hành Payroll”.

## 2. Checklist tiến độ

`[ ]` chưa hoàn tất; `[x]` chỉ khi có evidence. Cột `done` chỉ ghi theo xác nhận người dùng. Một câu `done` không tự tạo bằng chứng test chưa chạy, không vượt gate policy còn treo. Report ghi rõ ai xác nhận và ngày.

| Slice | Contract APPROVED | Codex BE + tests READY | Anti FE + tests READY | Codex integration review | Người dùng QA + done | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| S0 — Quyết định/handoff | [x] Gate/contract S1 | N/A | N/A | [x] Source/context | N/A: người dùng đã xác nhận policy S1 và yêu cầu triển khai BE | Gate S1 đã duyệt; A0 của các slice sau còn OPEN |
| S1 — Lịch draft | [x] v1 | [x] Retest 52 PASS | [x] Anti UI + Codex logic/tests | [x] Re-review PASS 22/10 | [ ] | 61 FE tests/lint/build PASS, 52 BE tests PASS; chờ người dùng QA/done |
| S2 — Lễ/ngoại lệ + kích hoạt lịch | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S3 — Preview công một nhân viên/tháng | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S4 — Bảng công nháp toàn kỳ | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S5 — Đối soát từng ngày | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S6 — Khóa kỳ + ghi nhận sai sót sau khóa | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S7 — Template và preview cấu hình | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu; chờ S6 |
| S8 — Gán lương + preview từ công khóa | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |
| S9 — Lưu nháp/phát hành/PDF snapshot | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa bắt đầu |

Checklist bàn giao cho **slice hiện tại S1**, không tạo nhiều nguồn tiến độ:

- [x] Blocker S1 đã có quyết định người dùng, config demo/fixture và phạm vi không activate/tính công/lương.
- [x] Contract v1 có JSON request/response/error; report ghi API PostgreSQL/HTTP thật trước Anti code.
- [x] Backend full build PASS 19/10; re-review 22/10 `npx tsc` PASS và 52 tests PASS, gồm PostgreSQL/HTTP thật trong schema riêng và cleanup. Không chạy Prisma generate hoặc migrate public/production trong re-review.
- [x] Anti đã tích hợp API layer thật; Codex xác minh source/contract, bổ sung logic/tests: 56 Vitest + 5 Node helper = 61 tests PASS, lint/build PASS. Không đồng nhất API fixtures với QA end-to-end bằng tài khoản thật.
- [x] Vòng 1 có findings F01–F05, lịch sử giữ trong [review](../codex-reports/attendance-payroll-s1-integration-review.md). Anti đã sửa; Codex chủ động xử lý logic còn sót theo phân công mới.
- [x] Codex re-review F01–F05 PASS; Chrome actual focus/state/pagination/responsive PASS; PostgreSQL CRUD/CAS/audit/rollback và CORS preflight localhost:5173 PASS. Sau save 1 refetch list. Không còn lỗi UI S1 mới cần giao Anti trong scope đã kiểm tra.
- [ ] Người dùng có URL + dữ liệu/steps QA + expected results; ghi kết quả QA thật và nhận `done`.

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

### S2 — Ngày lễ/ngoại lệ, preview lịch và kích hoạt version

- **Scope:** cấu hình ngày lễ/nghỉ bù/hoán đổi/đổi giờ; calendar preview theo tháng và activate lịch đã validate. Chưa tính payableDays. Khi tích hợp cutoff lịch với check-in/điều chỉnh phải dùng ngày hiệu lực, không sửa status lịch sử hàng loạt.
- **Gate:** lịch lễ/nghỉ bù hợp lệ, nguồn/người xác nhận, semantics breaks, timezone, hạn mức thời giờ/nghỉ bắt buộc, phạm vi hiệu lực và cách xử lý ngày chưa có lịch phải được duyệt. Không tự coi lịch nghỉ khối nhà nước là lịch mọi doanh nghiệp.
- **Contract PROPOSED:** `GET/POST /work-calendar/exceptions`, `PATCH .../:id`; `GET /work-calendar/preview?year&month&versionId`; `POST /work-calendar/versions/:id/activate` có expectedRevision. Exception body `{date,kind,details,replacementForDate?,reason}`/PATCH thêm expectedRevision. Preview `{data:{days,requiredWorkingMinutes,issues,sourceFingerprint}}` chưa phải số công lương; các kind/date/replacement/error cases phải có examples. 409 hiệu lực trùng/nguồn stale; phần bảo vệ kỳ LOCKED sẽ dùng guard ở S6 trước khi có capability khóa.
- **Codex:** lịch hiệu lực/ngoại lệ/audit, preview toàn tháng, activate transaction; regressions check-in/out/approve adjustment. **Anti:** cùng settings page: preview tháng, dialog ngoại lệ, confirm activate, hiển thị effect/warning, query invalidation đúng lịch.
- **Test/QA acceptance:** tháng nhuận, lễ tuần/nghỉ tuần/nghỉ bù/hoán đổi, không double-count; breaks sai bị chặn; đổi version chỉ ảnh hưởng ngày đúng hiệu lực. Preview/activate dùng API thật; snapshot sources để test chống thay đổi cũ ở S6.
- **QA URL mới đề xuất:** `http://localhost:5173/admin/attendance/settings?tab=calendar`; regression tại `http://localhost:5173/employee/attendance`.

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

Backend chưa có npm script lint/test: Codex ghi build và `node --test` file liên quan thực chạy; Anti ghi `npm run test`, `npm run lint`, `npm run build` trong frontend. Test mock/Playwright giả API không thay bằng chứng QA API thật. Task tài liệu hiện tại chỉ kiểm tra tài liệu/liên kết/whitespace, không báo application PASS.

**Bước tiếp theo:** người dùng QA S1 tại http://localhost:5173/admin/attendance/settings theo [review mục 5](../codex-reports/attendance-payroll-s1-integration-review.md). Nếu phát hiện lỗi logic, Codex sửa/test trực tiếp; chỉ bàn giao lỗi visual thuần UI cho Anti. Chưa tự gửi message agent khác; chờ người dùng xác nhận `done`, không chuyển S2.
