# S1 — Frontend–Backend Integration Review

Ngày: 22/10/2026. Reviewer: Codex.

**Kết luận hiện tại sau re-review: PASS F01–F05 và kiểm thử tích hợp tự động; sẵn sàng người dùng QA localhost.** Codex đã sửa bổ sung logic theo phân công mới; không đổi contract/Backend/Attendance nghiệp vụ, không chuyển S2, chưa người dùng QA/done. Chi tiết mới nhất ở mục 5.

Lịch sử vòng 1: FAIL acceptance, chỉ review/tài liệu và giao Anti sửa. Findings và evidence vòng 1 ở mục 1–4 được giữ để truy vết; không dùng trạng thái DB/lỗi cũ làm kết luận hiện tại.

Nguồn đối chiếu: [Exact API Contract v1](../modules/work-schedule.md), [report Anti](attendance-payroll-s1-frontend-report.md), [Backend evidence ngày 19/10](attendance-payroll-s1-work-schedule-drafts.md), [checklist chính](../plans/attendance-payroll-mvp-slices.md).

## 1. Findings vòng 1 và owner tại thời điểm đó

### F01 — P2 / Frontend: tải lại sau 409 có thể ghi đè dữ liệu vừa nhập

- File: `frontend/src/pages/admin/attendance/components/WorkScheduleFormDialog.tsx:52`, `:130`, `:136`, `:272`.
- `isPending` chỉ gồm hai mutation, không gồm `isReloading`. Trong lúc GET bản mới đang chờ, input và nút lưu vẫn enabled; khi GET hoàn tất, `reset()` ghi đè input mới.
- Đã tái hiện bằng Chrome: sửa giờ ra thành `17:30` → PATCH 409 (form vẫn giữ đúng `17:30`) → tải lại, trì hoãn GET 1.2 giây → nhập `19:00` → GET trả giờ `18:00`, revision 2 → input bị thay thành `18:00`. Nút lưu cũng enabled trong khoảng chờ nên có thể gửi revision cũ.
- Giao Anti: thống nhất busy state cho mutation/reload; khóa sửa/lưu và xử lý đóng dialog trong khi reload, hoặc bảo vệ dirty state bằng cơ chế tương đương. Không tự retry PATCH với revision mới; không âm thầm ghi đè phần nhập mới. Việc thay dữ liệu trước khi reload phải là lựa chọn rõ ràng của người dùng.
- Test bổ sung: deferred GET sau 409, không nhập/lưu chồng request; lỗi giữ dữ liệu; revision chỉ thay khi reload thành công.

### F02 — P2 / Frontend: phân trang vượt trang cuối và mất đường quay lại

- File: `frontend/src/pages/admin/attendance/WorkScheduleSettingsPage.tsx:49`, `:233`, `:401`, `:430`; hook `frontend/src/features/work-schedule/hooks/useWorkScheduleQuery.ts:29`.
- Hook dùng `keepPreviousData` nhưng nút Next dựa hoàn toàn vào meta cũ, không xét placeholder/pending. Pager chỉ tồn tại khi `schedules.length > 0`.
- Đã tái hiện với 11 bản nháp, limit 10, hai trang: bấm Next hai lần khi trang 2 đang tải → request lần lượt page 1/2/3 → page 3 trả rỗng → thông báo sai “Hệ thống chưa có bản nháp nào”, cả pager biến mất. Không còn nút Previous để quay lại dù hệ thống có 11 bản ghi.
- Giao Anti: chặn chuyển trang dựa trên meta placeholder, bảo vệ giới hạn trang; vẫn có đường phục hồi khi trang hiện tại rỗng nhưng tổng bản ghi > 0. Giữ nguyên page/limit và Backend contract.
- Test bổ sung: rapid Next trên mạng chậm, page vượt cuối/trang rỗng và Previous phục hồi.

### F03 — P2 / Frontend: nuốt lỗi tải lại bản nháp

- File: `frontend/src/pages/admin/attendance/WorkScheduleSettingsPage.tsx:85`; caller `components/WorkScheduleFormDialog.tsx:130`.
- Parent `catch { return null }` khiến `catch` hiển thị lỗi reload trong form không chạy. Nếu GET trả 500/network/404, UI chỉ còn thông báo 409 cũ, không cho biết thao tác tải lại vừa thất bại.
- Đã tái hiện: sau PATCH 409, GET detail trả 500 → nút hết loading, alert vẫn chỉ là xung đột phiên bản, không có thông báo tải lại thất bại.
- Giao Anti: propagate lỗi về caller hoặc trả discriminated result và xử lý đầy đủ; thông báo tiếng Việt, giữ giá trị/revision đang có khi thất bại và cho retry. Không đổi auth interceptor.
- Test bổ sung: reload 500/network/404, giá trị form không bị reset, có thông báo và retry hoạt động.

### F04 — P2 / Frontend: lỗi chưa localize được đưa thẳng ra UI

- File: `frontend/src/features/work-schedule/lib/work-schedule.ts:106`, `:116`.
- Parser trả trực tiếp `data.message` cho lỗi không biết và `error.message` cho lỗi client. PATCH bị ngắt mạng hiển thị đúng nguyên văn `Network Error` trên form (đã tái hiện bằng browser route abort).
- Giao Anti: giữ mapping theo code/error details tiếng Việt trong contract; lỗi không nhận diện/network dùng fallback tiếng Việt của operation. Không sửa hành vi refresh/logout/401 hoặc hợp đồng 403 hiện có.
- Test bổ sung: network, timeout và response không có code đã biết không lộ raw English message; các code 400/404/409 vẫn giữ mapping.

### F05 — P3 / Frontend: mất vị trí focus khi đóng dialog

- File: `frontend/src/pages/admin/attendance/components/WorkScheduleFormDialog.tsx:249`, `WorkScheduleDetailDialog.tsx:41`; wiring `WorkScheduleSettingsPage.tsx:448`.
- Hai dialog luôn `preventDefault()` tại `onCloseAutoFocus`, nhưng page không truyền callback `onRestoreFocus` và không có DialogTrigger tương ứng để phục hồi.
- Đã tái hiện: mở Chi tiết bằng nút của hàng → bấm Đóng → `document.activeElement` là `BODY`, không phải nút đã mở dialog. Người dùng bàn phím mất vị trí trên danh sách.
- Giao Anti: truyền ref/callback phục hồi focus về đúng trigger đang tồn tại; xử lý cả chuyển Detail → Edit và Create/Edit đóng sau lưu/Hủy/Escape. Không focus ra ngoài khi dialog kế tiếp đang mở.
- Test bổ sung: keyboard open/Tab/close, focus quay đúng trigger; chuyển hai dialog vẫn giữ focus trap.

## 2. Đối chiếu contract và luồng dữ liệu

| API | Kết quả đọc source và browser fixture |
| --- | --- |
| GET `/api/work-calendar/versions?page=1&limit=10` | Đúng URL/params, giữ `{data,meta}`; query key gồm page/limit và truyền AbortSignal. Pagination có lỗi F02. |
| GET `/api/work-calendar/versions/:id` | Unwrap `response.data.data`, AbortSignal hỗ trợ. Hiện chỉ gọi khi phục hồi 409; dialog Chi tiết lấy full DTO từ list, không gọi detail query. Đây là giới hạn coverage/freshness, không phải sai envelope. |
| POST `/api/work-calendar/versions` | Đúng đủ 6 config fields, không gửi actor/status/version/revision; unwrap DTO. Demo giữ ngày do người dùng chọn. |
| PATCH `/api/work-calendar/versions/:id` | Gửi JSON number `expectedRevision` đang giữ, full config là PATCH hợp lệ; unwrap DTO. 409 không tự tăng revision/ghi đè ngay. Reload có lỗi F01/F03. |

- Bearer token dùng authStorage/axiosInstance hiện có. Route nằm trong ProtectedRoute/ADMIN RoleGuard; EMPLOYEE bị chuyển về `/employee/dashboard`, không phát request work-calendar trong browser fixture. Backend middleware/tests chặn EMPLOYEE trước service.
- Mutation success `setQueryData(detail(id), DTO)` và invalidate list prefix: đúng contract, không invalidation Attendance/Payroll. Tuy nhiên page còn gọi `refetch()` trong `onSuccess`: browser quan sát **2 GET list sau một PATCH thành công**. Giao Anti bỏ đường refetch trùng nếu không cần và thêm assertion số request; không phải lỗi Backend.
- `effectiveFrom` giữ date-only, không qua `toISOString()`; UI DatePicker thật chọn `15/11/2026` gửi `2026-11-15`. Timezone literal `Asia/Ho_Chi_Minh`; HH:mm, ISO weekdays, đúng một break, thứ tự `start < breakStart < breakEnd < end` khớp BE. Không thêm luật giờ/ngày công hoặc activate.
- FE Zod kiểm tra date bằng regex; BE còn kiểm tra ngày có thật/năm khác 0000. DatePicker bình thường không sinh ngày vô hiệu; vẫn thiếu test parity `2026-02-30`/`0000-01-01` ở schema FE. Không coi việc Backend từ chối dữ liệu sai là lỗi Backend.
- Initial skeleton, list error tiếng Việt/retry, empty state, mutation pending đã có. Browser kiểm tra retry từ list 500 về success; PATCH pending khóa input/submit đúng. Chưa đạt toàn bộ recovery do F01/F03/F04.
- Desktop 1440, tablet 768, mobile 375/390 (cao 620): form/list không horizontal overflow; dialog body scroll, footer ở y=603 trong viewport 620. DatePicker thật trong dialog mobile mở, chọn tháng/năm/ngày và submit được. Đây là browser fixture evidence, không thay QA device thật.
- Accessibility: nhãn input, weekday `aria-pressed`, dialog title/description, pagination aria-label có; còn F05. Shared Calendar hiện có aria-label điều hướng tiếng Anh (`Choose the Month`, `Go to the Next Month`): ghi nhận từ shared component có sẵn, không quy thành regression riêng S1 và không sửa shared UI trong review này. Chưa chạy audit screen reader đầy đủ.

## 3. Verification thực tế ngày 22/10

| Kiểm tra | Kết quả |
| --- | --- |
| Frontend `npm.cmd run test` | **PASS: 49 Vitest tests/9 files + 5 Node helper tests = 54**. Riêng S1 6 tests; API functions và DatePicker đều mock trong suite S1. |
| Frontend `npm.cmd run lint` | **PASS**, không lỗi/cảnh báo lint. |
| Frontend `npm.cmd run build` | **PASS** (`tsc -b && vite build`); có cảnh báo bundle >500 kB, không phải type/build failure. |
| Backend `npx.cmd tsc --noEmit` | **PASS**. Không chạy lại full `npm run build`/Prisma generate, không dừng backend người dùng. Full build PASS 19/10 là evidence lịch sử, không gán cho lượt này. |
| Backend unit/HTTP/regression | **51 PASS, 0 fail**: 28 S1 + 23 Attendance adjustment/monthly report/Admin dashboard. |
| PostgreSQL integration `HRM_S1_DB_TEST=1` | **FAIL do môi trường / BLOCKED retest**: không kết nối được `localhost:5432`, thất bại tại CREATE SCHEMA trước khi tạo schema test. Chưa chạy được CRUD/race/audit trên DB thật trong lượt này. |
| HTTP server thật localhost:3000 | `/health` 200; cả 4 endpoint S1 đều trả **401** khi không có token. Health không kiểm tra PostgreSQL. Không gửi POST/PATCH đã auth vào dữ liệu thật trong review. |
| Chrome headless / preview localhost:5182 | Chạy actual production bundle/API layer/DatePicker/RoleGuard với controlled HTTP fixtures; tái hiện F01–F05 và kiểm tra payload/409/retry/responsive. Không chứng minh CORS/CRUD thành công qua Backend thật. |

Frontend tests được chạy với TEMP/TMP trỏ thư mục test tạm trong node_modules, không sửa env/config dự án. Browser harness và screenshots ở thư mục visualization local ngoài application; preview tạm chỉ dùng review và được dừng sau kiểm tra.

Regression source: thay đổi router chỉ thêm route settings; AttendanceListPage chỉ thêm Link tới settings. Không thay API/query params/check-in/out/Leave/Payroll. Các test regression liên quan PASS; chưa chứng minh lại Attendance end-to-end với PostgreSQL đang offline.

**Backend:** chưa tìm thấy functional defect mới trong scope đọc source/tests. Không giao Anti sửa Prisma/contract hoặc tự khởi tạo DB. Blocker môi trường DB cần được khôi phục rồi Codex chạy lại integration test; không quy lỗi kết nối thành lỗi nghiệp vụ Backend.

## 4. Bàn giao Anti và QA localhost

1. Anti sửa F01–F05 trong frontend S1, thêm tests regression; dọn refetch trùng và bổ sung coverage validation/API envelope nếu phù hợp. Giữ nguyên exact contract, không activate hoặc đổi Attendance logic.
2. Anti cập nhật report/test/lint/build rồi giao Codex review lại. Gate tích hợp hiện chưa PASS; user QA/done vẫn để trống.
3. Khởi động PostgreSQL local đúng cấu hình hiện có; từ backend chạy `npm run dev`, frontend chạy `npm run dev` ở localhost:5173 để khớp CORS. Không tự seed/reset/migrate hoặc đổi env để vượt lỗi.
4. ADMIN mở `http://localhost:5173/admin/attendance/settings`: dùng demo, chọn ngày, POST, refresh trang vẫn giữ; Chi tiết/Sửa/PATCH revision tăng, list cập nhật đúng. Kiểm tra Network đủ 4 API theo luồng (GET detail hiện dùng khi reload 409), đúng envelope và date-only.
5. Hai tab cùng sửa một draft: tab đầu lưu, tab sau 409; giữ dữ liệu khi lỗi. Reload trên mạng chậm không cho input/lưu chồng; reload thất bại có lỗi tiếng Việt và retry; chỉ sau reload thành công mới lấy revision mới.
6. Có hơn 10 draft: bấm Next nhanh, luôn trong giới hạn, quay Previous được; kiểm tra empty/loading/error/retry. Không tự tạo số lượng draft trong DB thật ở lượt review.
7. EMPLOYEE/direct URL bị chặn; keyboard close quay đúng nút, mobile 375/390/tablet footer/DatePicker không tràn. Regression check-in/out, lịch sử, điều chỉnh và báo cáo tháng không bị đổi bởi draft.

Chỉ khi Codex review lại PASS và người dùng QA xác nhận `done` mới đóng S1. **S2 chưa bắt đầu.**

## 5. Re-review sau Anti fixes — 22/10/2026

### Kết quả từng finding

| Finding | Kết luận cuối | Evidence |
| --- | --- | --- |
| F01 — Reload/dirty form/concurrency | **PASS sau Codex bổ sung** | Anti dùng `isBusy = isPending || isReloading`, khóa input/actions và chặn đóng. Codex chặn cả submit handler khi busy; giữ recovery sau đổi ngày/dùng demo; đồng bộ detail/list cache từ DTO GET mới để Hủy → mở lại không quay về revision cũ. Test PATCH tiếp theo gửi revision 2. |
| F02 — Rapid Next | **PASS** | Anti giới hạn page và khóa pager khi fetching; pager/recovery vẫn tồn tại ở trang rỗng có total > 0. Deferred test và Chrome bấm lặp khi page 2 đang tải: không có request page 3, Next disabled ở cuối, Previous hoạt động. |
| F03 — GET reload error | **PASS** | Parent propagate error; dialog catch, thông báo tiếng Việt, giữ input/revision cũ và cho retry. Test network + Chrome HTTP 500, sau đó GET thành công mới reset form/revision. |
| F04 — Raw English | **PASS sau Codex bổ sung** | Network/timeout được Anti map. Codex bỏ heuristic ASCII vì `Request couldn’t be completed` vẫn lọt; unknown/client/server lỗi lạ dùng fallback tiếng Việt, known business codes/details theo contract v1. Không sửa auth 401/403/interceptor. |
| F05 — Focus trigger | **PASS** | Anti lưu trigger ref và wiring callback; chuyển Detail → Edit không đẩy focus ra ngoài. RTL và Chrome actual focus kiểm tra Đóng/Hủy trả đúng trigger, focus còn trong Edit sau chuyển dialog. |

Không còn lỗi logic hoặc UI mới chưa xử lý trong phạm vi S1 đã kiểm tra. Không giao thêm việc thuần visual cho Anti. Ghi nhận aria-label Calendar tiếng Anh có sẵn ở shared component từ vòng 1 vẫn là follow-up ngoài scope, không phải regression S1; chưa audit screen reader toàn ứng dụng.

### Logic bổ sung do Codex sửa trực tiếp

- `frontend/src/features/work-schedule/lib/work-schedule.ts`: bỏ đoán ngôn ngữ theo ASCII; không render raw unknown/client error hoặc raw details ngoài code đã biết. Business errors có code và details tiếng Việt vẫn giữ contract.
- `frontend/src/pages/admin/attendance/components/WorkScheduleFormDialog.tsx`: không xóa thông tin conflict chỉ vì đổi ngày/dùng demo; submit handler kiểm tra busy. Bỏ callback `onSuccess` rỗng, mutation hook là nơi duy nhất invalidation sau lưu.
- `frontend/src/pages/admin/attendance/WorkScheduleSettingsPage.tsx`: reload thành công ghi DTO mới vào detail cache và thay đúng item trong các list đã cache, giữ meta; không phát thêm GET list chỉ để đồng bộ row.
- `frontend/tests/work-schedule-drafts.test.tsx`: tăng từ 10 lên **13 tests S1**; mở rộng deferred reload/error/retry, form guard, cancel/reopen cache, PATCH revision mới và số lần refetch, Unicode error, rapid Next và validation parity date/time/weekdays/break.

Test mới đã tái hiện lỗi trước khi sửa (recovery biến mất và unknown Unicode English lọt). Sau sửa, các tests PASS. Không thêm API, policy, dependency hoặc sửa tính công/lương.

Luồng dễ hiểu/phỏng vấn: “Server dùng revision để tránh hai quản trị viên ghi đè nhau. Khi gặp 409, giao diện giữ bản đang nhập và chỉ tải bản mới khi người dùng yêu cầu; trong lúc tải thì khóa thao tác, lỗi vẫn giữ form. Tải thành công mới đổi revision và cache, nên mở lại dialog không quay về dữ liệu cũ. Backend vẫn là nơi quyết định dữ liệu hợp lệ.”

### Verification cuối

| Kiểm tra | Evidence vòng re-review |
| --- | --- |
| Frontend `npm.cmd run test` | **PASS: 56 Vitest/9 files + 5 Node helper = 61 tests**, gồm 13 S1. Typecheck tests PASS. |
| Frontend `npm.cmd run lint` | **PASS**, exit 0, không lỗi/cảnh báo lint. |
| Frontend `npm.cmd run build` | **PASS** (`tsc -b && vite build`), còn cảnh báo chunk >500 kB đã biết. |
| Backend `npx.cmd tsc` | **PASS**, compile source hiện tại trước khi chạy tests; không chạy Prisma generate hoặc dừng server người dùng. |
| Backend tests với `HRM_S1_DB_TEST=1` | **52 PASS, 0 fail/skip**: 28 S1 unit/HTTP, 23 regression và 1 PostgreSQL + HTTP thật. |
| PostgreSQL integration | Schema test UUID riêng trên localhost, replay migrations chỉ trong schema test; GET list/detail/POST/PATCH, pagination, CAS hai PATCH một 200/một 409, audit/rollback, non-DRAFT và Attendance/Leave/Payroll không bị ghi. Test cleanup PASS; không migrate/seed schema public. Blocker kết nối DB vòng 1 đã hết. |
| API/UI server hiện có | `http://localhost:3000/health` **200**, `http://localhost:5173` **200**. Không dừng/khởi động lại process người dùng. |
| CORS thật | OPTIONS `/api/work-calendar/versions`, Origin `http://localhost:5173`, request PATCH + authorization/content-type → **204**, allow-origin đúng `http://localhost:5173`. |
| Chrome production bundle | Controlled API fixtures: cả F01–F05 PASS, list retry PASS, EMPLOYEE redirect/dashboard và không gọi work-calendar. Sau PATCH thành công có **1 GET list**, không còn 2 GET. |
| Responsive | 1440/768/375/390px, cao 620: page/dialog không overflow ngang; footer y=603 còn trong viewport, giữ layout cũ. Screenshots local ở visualization; không kết luận user đã QA thiết bị thật. |

Browser fixtures kiểm tra React/API layer/state/focus, PostgreSQL test riêng kiểm tra backend thật; chưa gọi đây là user QA end-to-end bằng tài khoản đăng nhập thật. Chưa kiểm thử screen reader đầy đủ. Không cần migration/Prisma client mới cho các sửa frontend này.

### Workflow và QA tiếp theo

Đã đồng bộ `AGENTS.md`, plan/checklist và `docs/agents/ANTIGRAVITY_CONTEXT.md`: Codex sở hữu mọi logic/state/data flow/validation/API integration/concurrency/tests cả hai phía; Anti chỉ nhận phần UI/UX/CSS/layout/responsive/visual. Lỗi hỗn hợp xử lý logic trước. Không làm việc đồng thời cùng file hoặc tự nhắn thread khác.

QA tại **http://localhost:5173/admin/attendance/settings**, ADMIN local:

1. Demo → chọn ngày → tạo → reload trang → xem/sửa; kiểm tra date-only, giờ và revision, một refetch list sau lưu. Không có activate hoặc ảnh hưởng Attendance.
2. Hai tab sửa cùng draft: tab A lưu, B 409 và giữ dữ liệu; thử đổi ngày/demo vẫn có reload. Bật Slow 3G rồi reload: không nhập/lưu/đóng chồng; mô phỏng GET fail thì giữ form, tiếng Việt/retry; thành công → Hủy → mở lại vẫn revision mới → lưu được.
3. Với >10 draft, Next nhanh/Previous/last page; kiểm tra loading/error/retry, keyboard focus khi đóng hoặc Detail → Edit, 375/390px. EMPLOYEE truy cập trực tiếp phải bị chuyển về dashboard riêng.
4. Regression lịch sử chấm công, check-in/out, duyệt điều chỉnh và báo cáo tháng. Dùng dữ liệu QA được phép; không tạo hàng loạt draft hoặc thao tác công thật chỉ để đủ phân trang.

**Gate hiện tại: Codex re-review PASS → chờ người dùng QA localhost và xác nhận `done`. S1 chưa DONE; S2 chưa bắt đầu.**
