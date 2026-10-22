# Antigravity Context — Humanize HR

Cập nhật workflow ngày 22/10/2026; bản đồ source gốc ngày 19/10. Đọc tài liệu này khi nhận task frontend Attendance → Payroll. Đây là bản đồ handoff, không thay thế source hoặc contract được duyệt. S1 đã có frontend và đang re-review; xem [checklist hiện hành](../plans/attendance-payroll-mvp-slices.md) thay vì suy trạng thái từ brief lịch sử. Các slice sau chưa implement. Đọc [brief S1](../codex-reports/attendance-payroll-s1-work-schedule-drafts.md) và [exact API contract v1](../modules/work-schedule.md).

## 1. Đọc theo thứ tự

1. [AGENTS.md](../../AGENTS.md), [project-core](../../.agents/rules/project-core.md), [frontend rules](../../.agents/rules/frontend.md), [load-learnings](../../.agents/rules/load-learnings.md). Liệt kê `.agents/learnings/`, chỉ đọc phần liên quan; thư mục hiện chưa có learning.
2. [Kế hoạch nghiệp vụ/kiến trúc](../plans/attendance-calculation-payroll-mvp.md), đặc biệt quyết định đã chốt và blocker A0.
3. [Vertical slices và checklist tiến độ](../plans/attendance-payroll-mvp-slices.md): nhận **một slice** có contract APPROVED và Backend READY. Không làm trước slice kế tiếp.
4. Contract và report cụ thể Codex bàn giao cho slice; sau đó đọc source frontend liên quan. Không lấy endpoint trong plan làm API đã có.

Ưu tiên khi có khác biệt: quyết định mới được người dùng xác nhận → contract đã duyệt và implementation thực tế tương ứng → tài liệu tổng quan. Nếu contract và response thực tế lệch nhau, báo Codex, không tự sửa một phía hoặc viết fallback đoán shape.

## 2. Sản phẩm và stack thực tế

Humanize HR là HRM nội bộ với ADMIN/EMPLOYEE, frontend Vercel, backend Render Free. Mục tiêu portfolio Frontend Developer: luồng nghiệp vụ thực tế, responsive, type-safe, kiểm thử có bằng chứng; không thêm dịch vụ trả phí.

Nguồn phiên bản: [frontend/package.json](../../frontend/package.json), [backend/package.json](../../backend/package.json) và lockfiles. Package manifest hiện khai báo React 19, Vite 8, TypeScript 6 frontend, React Router DOM 7, TanStack Query 5, Axios 1, Zustand 5, RHF 7 + resolver 5, Zod 4, Tailwind 4 qua Vite plugin. UI: shadcn components trong repo/Radix, lucide-react, Sonner; date-fns 4, DayPicker 10, dayjs; Recharts đã có. Không đổi version/library theo kiến thức mẫu cũ.

Backend là Express 4 + TypeScript, Prisma 6/PostgreSQL, JWT access/refresh token; ExcelJS/PDFKit xử lý export. Backend theo module controller → service → repository. Codex sở hữu phần này; Anti đọc để hiểu contract, không chỉnh.

## 3. Frontend map

Các đường dẫn code dưới đây tính từ `frontend/`:

| Vị trí | Trách nhiệm / ví dụ nên đọc |
| --- | --- |
| `src/main.tsx`, `src/app/App.tsx` | React StrictMode; QueryProvider → AuthProvider → RouterProvider và Toaster. Không tạo provider/query client riêng trong từng page |
| `src/app/router.tsx`, `src/app/router/` | React Router nested layouts; ProtectedRoute, PublicRoute, RoleGuard |
| `src/app/providers/QueryProvider.tsx` | QueryClient ổn định bằng useState; queries mặc định retry 1, refetchOnWindowFocus false. Không coi cache là dữ liệu chốt công |
| `src/features/<module>/{api,hooks,types,lib,model}` | Các thư mục xuất hiện tùy module; API không render, hook quản lý server state, lib mapping/query keys/schema; không bắt module nào cũng có đủ thư mục |
| `src/pages/admin/`, `src/pages/employee/` | Page/container của từng role; đặt presentational components cạnh page khi chỉ dùng tại đó |
| `src/pages/attendance-adjustments/` | List/detail/create dùng chung theo audience; form/detail tái sử dụng giữa dialog và route cũ |
| `src/widgets/layouts/` | Admin/Employee header/sidebar/Outlet; `shared/` có mobile drawer logic. Layout có HR assistant nổi: không để pagination/footer mới bị che |
| `src/components/ui/` | Button, Card, Table, Input, Label, Checkbox, Dialog, ConfirmDialog, StatusBadge, EmptyState, Skeleton, Calendar, Popover, Toaster; kiểm tra props thật trước khi dùng |
| `src/shared/components/` | DatePicker, NotificationBell; không tự đặt tên component có sẵn nhưng chưa tồn tại |
| `src/shared/api/axios.ts`, `src/shared/lib/` | Axios instance, env, download-blob; `src/lib/utils.ts` là cn, `src/lib/toast.tsx` là toast helpers |
| `src/index.css` | Tokens và Tailwind `@theme inline`; dùng `bg-background`, `text-foreground`, `border-border`, `text-primary`, `text-destructive`, component variants. Không hardcode palette trên page mới |
| `tests/`, `vitest.config.ts`, `tsconfig.test.json` | Vitest/jsdom + React Testing Library, một nhóm Node tests cho URL params; không tự thêm test runner |

Alias `@/* → src/*` đã được cấu hình trong Vite/tsconfig app/test. Giữ style/import/naming của module đang sửa; dùng type imports phù hợp `verbatimModuleSyntax`, không reformat module khác.

### Các ví dụ tích hợp cần tái sử dụng

- `src/features/attendance/api/attendance.api.ts` và `api/attendance-adjustment.api.ts`: request typed; list trả response.data, detail/create/review có envelope thì unwrap đúng response.data.data. **Không có một quy tắc unwrap áp dụng mọi API**.
- `src/features/attendance/hooks/useAttendanceHistoryQuery.ts`: attendanceQueryKeys gồm list/history/monthlyReport/adjustment list/detail. `useAttendanceAdjustmentsQuery.ts`: key có đủ params, nhận AbortSignal, detail chỉ enabled khi có id, list keepPreviousData.
- `src/features/attendance/hooks/useAttendanceAdjustmentMutations.ts`: mutate thành công setQueryData detail và invalidate nguồn liên quan; không refetch toàn app hoặc tự chạy calculate khi GET/refetch.
- `src/features/payroll/api/payroll.api.ts`, `lib/payroll.query-keys.ts`: Payroll list dùng `{data,pagination}`; Attendance adjustment list dùng `{data,meta}`. Không đổi meta/pagination để ép đồng nhất.
- `src/pages/attendance-adjustments/components/AttendanceAdjustmentForm.tsx`: RHF/Zod, Controller cho DatePicker, mutation pending, server error riêng, giữ input khi lỗi. Ngày thay đổi không được refetch rồi ghi đè chỉnh sửa đang nhập.
- `.../AttendanceAdjustmentDetailDialog.tsx`, `.../CreateAttendanceAdjustmentDialog.tsx`: header/footer ổn định, body scroll, max-height theo viewport; chặn đóng khi pending, reset bằng lifecycle, trả focus về trigger.
- `src/features/attendance/lib/attendance-adjustment.ts`: map status và backend errors đã biết sang tiếng Việt, lỗi lạ dùng fallback tiếng Việt. Không hiển thị raw backend English chưa được map.
- `src/features/employee/hooks/useEmployeeListFilters.ts` và `lib/employee-list.params.ts`: ví dụ filter URL, debounce 350ms, Back/Forward và reset page khi filter đổi. Reuse ý tưởng theo scope, không copy nguyên filter Employee vào module mới.

## 4. API, auth, ngày và state

### API/auth có sẵn

- `VITE_API_BASE_URL` từ `src/shared/lib/env.ts`; fallback source hiện tại `http://localhost:3000/api`. API function dùng path tương đối như `/attendance/...`, không ghép `/api` hai lần.
- Axios request interceptor tự đọc access token qua authStorage và gắn Bearer. FormData được xóa Content-Type JSON để browser tạo boundary; không stringify/set boundary thủ công.
- Response interceptor 401 loại trừ login/refresh, dùng shared refreshPromise, `_retry` một lần; refresh hỏng logout, toast tiếng Việt, điều hướng `/login`. Không viết interceptor/refresh/redirect song song trong API hook mới. 403 không được interceptor này tự xử lý như session hết hạn; cần hiển thị lỗi quyền theo contract và giữ RoleGuard, không bypass.
- Zustand `src/features/auth/model/auth.store.ts` giữ user/isAuthenticated/isAuthRestoring. authStorage giữ tokens trong localStorage; không chuyển server data sang Zustand hoặc ghi cache công/lương vào localStorage.
- AuthProvider phục hồi bằng getMe, tránh request trùng; `/login` render ngay qua PublicRoute; protected pages chờ restore, RoleGuard kiểm tra role. Route guard chỉ là UX, backend vẫn phải kiểm tra quyền.

### Date/validation

- Shared DatePicker hiển thị DD/MM/YYYY, value/onChange là YYYY-MM-DD; RHF dùng Controller. Calendar hiện dùng DayPicker 10, Vietnamese locale/header đã custom; không copy classNames v8/v9 hoặc thay date contract.
- Khi DatePicker nằm trong modal, tham khảo form điều chỉnh: `modal={true}` và popover class phù hợp Portal/z-index/available height. Không bỏ Portal hoặc sửa global CSS để chữa focus/scroll.
- S1 đã chốt Asia/Ho_Chi_Minh, date YYYY-MM-DD, time HH:mm và weekday ISO 1–7. Attendance hiện vẫn dùng Asia/Bangkok/+07:00 ở một số mapping cũ: **không sửa các flow cũ trong frontend S1**. Timezone của draft là fixed/read-only; không dùng timezone máy để quyết định ngày công. Date-only khác instant ISO timestamp; đọc contract từng field.
- Zod kiểm tra UX theo contract đã duyệt, không thêm ngưỡng/phạt/quy tắc lương. Backend authoritative. Tiền/số công Decimal trong contract mới dự kiến truyền string: format để hiển thị, không tính engine bằng JS Number trong browser.

### UI states bắt buộc

- Phân biệt initial loading và background fetching; keepPreviousData giữ list ổn định. Không dùng opacity/setTimeout để che layout shift.
- Có empty/error/retry, mutation pending chống double-submit, lỗi giữ form; thiếu dữ liệu khác số 0. Không biến lỗi thành list rỗng hoặc công 0.
- ConfirmDialog cho action không thể hoàn tác như khóa/phát hành; respect pending, keyboard/focus và accessible labels tiếng Việt.
- Desktop table, mobile cards theo pattern HRM; test desktop/tablet/375px/390px và viewport thấp cho dialog. Footer/body không overflow hoặc bị assistant nổi che.
- Chỉ map/show backend values/permissions đã nhận. Nút disabled không thay được check server; 409 stale yêu cầu tải lại/đối soát, không tự retry mutation nhạy cảm như đã thành công.

## 5. Attendance → Payroll: điều đã chốt và điều chưa có

Đọc chi tiết tại [plan](../plans/attendance-calculation-payroll-mvp.md), không sao chép policy vào frontend.

- Attendance Calculation đi trước Payroll Configuration. Lịch demo T2–T6 08:00–17:00 nghỉ 12:00–13:00 là cấu hình; HR tùy chỉnh lịch/hiệu lực/lễ/ngoại lệ. Không cố định 22/26 công.
- MVP một lịch chung/một ca ban ngày, chưa ca đêm/ca xoay/OT. Backend tổng hợp Attendance + Leave hợp lệ + điều chỉnh APPROVED; thiếu/bất thường cần HR đối soát có lý do/audit.
- HR xác nhận/khóa trước Payroll. LOCKED **không unlock trực tiếp**, kể cả trước khi phát hành lương. Sai sót sau khóa phải ghi thành yêu cầu riêng có lý do/audit; không sửa snapshot và không tự thay Payroll PUBLISHED.
- MONTHLY dùng `monthlySalary × payableDays / standardDays`, bao gồm nghỉ hưởng lương hợp lệ, không phạt tiền đi muộn. Template system/clone dùng một backend engine, optional line items, version/snapshot giữ lịch sử.
- Hiện có WorkScheduleVersion DRAFT + WorkScheduleAudit và bốn endpoint S1. **Chưa có activate/model/API tính công mới**. Attendance tháng chỉ đếm punch; Payroll backend hiện tính baseSalary+bonus-deduction. Không hiển thị như engine mới đã hoạt động.
- Timezone/một nghỉ/ADMIN/một lịch công ty/draft không tác động Attendance đã được xác nhận cho S1. Mẫu số lễ/nghỉ bù, fractional day/grace, phép đủ quyền, phạm vi nhân viên, quyền/ngày khóa, xử lý tiếp theo sau khóa, nghĩa vụ thuế/BH vẫn OPEN. Anti không chọn default thay quyết định nghiệp vụ.

Route hiện hữu để tham chiếu: `/admin/attendance`, `/admin/attendance/report`, `/admin/attendance/adjustments`, `/admin/payroll` (**số ít**); `/employee/attendance`, `/employee/attendance/adjustments`, `/employee/payrolls`. Row yêu cầu trên list hiện mở modal; routes detail/create cũ còn để deep link/notification, không xóa ngoài scope.

## 6. Phân quyền công việc và quy tắc handoff

| Chủ thể | Chịu trách nhiệm |
| --- | --- |
| Codex | Nghiệp vụ, architecture/Prisma/backend/API contract; mọi logic, state, data flow, validation, API integration, concurrency và tests ở cả frontend/backend; chủ động sửa lỗi logic tìm thấy trong review, chứng minh API local và regression |
| Anti | React UI/UX, CSS/layout/responsive/visual và tests giao diện trong slice được giao; chỉ nhận lỗi thuần giao diện, không tự đổi logic/API/state |
| Người dùng | Quyết định nghiệp vụ, QA localhost và xác nhận `done` trước slice tiếp theo |

Anti được sửa frontend source/tests và report thuộc UI/UX trong phạm vi bàn giao. Lỗi có cả logic và UI: Codex sửa logic trước rồi giao phần visual còn lại, không phân owner chỉ theo thư mục frontend/backend. Chỉ sửa dependency/lockfile frontend khi đã được duyệt; ưu tiên dependency hiện có. Thay shared component phải trace consumers và test regression. Không đổi backend/Prisma/migration, policy, API contract, auth flow, env, deployment/CORS, dữ liệu thật, AGENTS/rules hoặc refactor module khác. Nếu bị chặn bởi logic/contract/backend, báo Codex, không chữa bằng fake data/default công. Không commit/push/reset/revert thay đổi của người khác.

Workflow từng slice: contract được duyệt → Codex hoàn tất backend nhỏ + tests/API chạy thật → frontend (Anti UI, Codex logic/integration/tests) → Codex review và sửa lỗi logic → Anti sửa lỗi thuần visual còn lại nếu có → người dùng QA localhost → người dùng `done` → mới mở slice sau. Không triển khai toàn bộ backend trước; không giao Anti một loạt API chưa chạy được. Không để hai agent sửa cùng file đồng thời; không tự nhắn thread khác khi chưa được người dùng cho phép. Phân công mới có ưu tiên hơn mô tả owner frontend cũ trong brief lịch sử.

Handoff từng slice phải có: scope/files được phép, contract status/version + request/response/error examples, auth, date/time/Decimal semantics, nullable/missing, concurrency/revision, API thật và dữ liệu QA được phép dùng, test evidence/limits, URL UI, known issues. Nếu contract đổi thì Codex cập nhật version/docs/tests trước, Anti đồng bộ; không tự thêm compatibility fallback.

## 7. Skill và CodeGraph

Không chép nội dung skill vào prompt/task. Theo [quy tắc chọn skill trong AGENTS](../../AGENTS.md): đọc `.agents/skills/design-taste-frontend/SKILL.md` trước UI planning/implementation; additions thường là mode A → runtime-branding + Minimal web-design-guidelines. Đọc skill code-review khi self-review; chỉ dùng redesign/motion khi scope thật sự cần. Các skill hiện có là hướng dẫn cục bộ, không yêu cầu cài tool/trả phí.

Repo có `.codegraph/`: dùng CodeGraph MCP trước khi định vị/đọc code; projectPath `D:/HRM-project`. Nếu Anti không có MCP, báo rõ “CodeGraph MCP unavailable”, rồi đọc targeted source bằng công cụ sẵn có; không giả vờ đã dùng MCP, không gọi CLI thay thế. Không áp projectPath của repo khác.

## 8. Chạy local và báo cáo

- Backend mặc định `http://localhost:3000`, health `http://localhost:3000/health`, API `/api`; frontend dev mặc định `http://localhost:5173`. Từ `frontend/`: `npm run dev`. Đọc `.env.example` để biết key, không sao chép secret vào report.
- **CORS thực tế** trong `backend/src/app.ts` cho phép `http://localhost:5173` và production Vercel; không giả định 127.0.0.1/port khác cũng dùng được. Nếu port bận, không kill server người dùng; báo port thực tế và để Codex xử lý cấu hình được duyệt trước QA API. Không đổi env/CORS để chạy test ngoài scope.
- Frontend milestone: `npm run test`, `npm run lint`, `npm run build` từ `frontend/` (`npm.cmd` trên PowerShell nếu cần). Test script gồm test typecheck, Vitest run, Node URL-helper tests. Tests có QueryClient riêng/retry false và MemoryRouter; mock API chỉ trong tests, không trong production.
- Backend do Codex chạy: build và `node --test` các file liên quan trong `backend/tests/`; hiện package backend chưa có script lint/test. Không báo `npm run lint` backend PASS khi script không tồn tại. `npm start` backend có migrate deploy, không chạy nó hoặc Prisma commands chỉ để mở UI.
- Báo rõ source review, automated tests/mock và QA API thật là ba loại bằng chứng khác nhau. Không tự ghi QA PASS. Trong `docs/codex-reports/`, mỗi slice ghi changed files, flow, commands/results, URL, known limitations; cập nhật checklist phần mình, không đánh dấu người dùng `done` thay họ.

**Điểm bắt đầu của Anti:** xem [checklist hiện hành](../plans/attendance-payroll-mvp-slices.md) và phạm vi UI được bàn giao, không lấy trạng thái trong brief lịch sử làm tiến độ mới. S1 đã có frontend và re-review; hiện chờ người dùng QA/done. Chỉ nhận phần UI/UX/visual theo phân công mới; không tự chuyển S2, activate hoặc tính công/lương. Backend local dùng `npm run dev` nếu cần và port chưa có server; không tự migrate/seed lại.
