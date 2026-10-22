# Audit Attendance & Payroll — Payroll Configuration MVP

Ngày đối chiếu: 19/10/2026. Chỉ đọc source và tra cứu nguồn pháp luật; không sửa application, chạy migration hay ghi database. Các model/rule/API mới bên dưới là **đề xuất**, chưa phải contract đã có. Không kiểm thử lại runtime trong audit này.

**Cập nhật quyết định sau audit:** ưu tiên hoàn thiện Attendance Calculation và đối soát/khóa kỳ trước Payroll Configuration. Công của luồng mới do backend tổng hợp từ lịch + Attendance + Leave hợp lệ + điều chỉnh đã duyệt, không bắt đầu bằng công nhập tay độc lập. Lịch demo T2–T6, 08:00–17:00, nghỉ 12:00–13:00; lịch/ngày lễ/ngoại lệ có hiệu lực và cấu hình được. MONTHLY dùng `monthlySalary × payableDays / standardDays`; không phạt tiền đi muộn; Payroll chỉ đọc snapshot công đã khóa. Xem [kế hoạch cập nhật và các điểm cần xác nhận](../plans/attendance-calculation-payroll-mvp.md). Những đề xuất cũ về HR_CONFIRMED trước và lịch/leave tự động sau bên dưới được giữ làm lịch sử audit, **không còn là thứ tự triển khai hiện hành**. Nhận định hiện trạng source vẫn có giá trị tại ngày audit.

**Tiến độ sau thời điểm audit:** Backend S1 cấu hình lịch DRAFT/audit đã READY theo [contract v1](../modules/work-schedule.md) và [report bàn giao Anti](attendance-payroll-s1-work-schedule-drafts.md). Chưa activate/tính công/nối Payroll. Các mô tả “chưa có lịch” bên dưới là ảnh chụp source trước S1, không phải phủ nhận model draft mới.

**Kết luận:** có thể tái sử dụng quản lý bảng lương, phân quyền, Decimal, query/mutation, dialog và PDF. Attendance hiện **chưa cung cấp công tính lương**. MVP nên có một engine dùng chung, mẫu demo là dữ liệu cấu hình; ban đầu nhận số công/giờ được HR xác nhận, rồi mới nối tự động từ Attendance khi đủ dữ liệu.

## 1. Hiện trạng Attendance và Payroll

### Attendance và Leave

| Luồng | Đã có trong source | Chưa có / ý nghĩa đối với Payroll |
| --- | --- | --- |
| Check-in/out | Employee từ JWT; giờ server; ngày theo `Asia/Bangkok`; unique nhân viên/ngày; check-out tìm bản ghi của ngày hiện tại | Một cặp vào/ra/ngày; chưa có punch events, nhiều ca hoặc ca qua đêm |
| Đi muộn/về sớm | `<=08:00:00` là PRESENT, sau đó LATE; check-out chỉ lưu giờ | Chưa có giờ kết thúc ca, phút đi muộn/về sớm, thời gian nghỉ, grace period hay quy đổi công; PRESENT không có nghĩa đủ ngày làm |
| Điều chỉnh công | Employee đề xuất; Admin duyệt trong transaction; giữ giờ gốc/reviewer; kiểm tra phiên bản và chống duyệt lặp; giờ cùng ngày | Chưa khóa kỳ công; duyệt quá khứ thay Attendance nhưng không tính lại Payroll |
| Nghỉ phép | ANNUAL/SICK/UNPAID/OTHER; start/end dạng DateTime; PENDING/APPROVED/REJECTED; người duyệt và ghi chú | Chưa có ledger số ngày/giờ nghỉ, nửa ngày, chính sách trả lương, quota theo năm/thâm niên, lịch làm việc hoặc kiểm tra overlap khi tạo/duyệt |
| Công chuẩn/thực tế/hưởng lương | Có timestamps và ngày vào làm `joinedAt` | Chưa có model lịch/ca/ngày lễ, công chuẩn, working minutes, payable days/hours; chưa có ngày nghỉ việc hay lịch sử lương hợp đồng |
| OT | Không có model/API đăng ký hoặc duyệt OT trong schema/routes đã kiểm tra | Không được coi ở lại muộn hay `checkOut-checkIn` vượt 8h là OT được trả lương |
| Tổng hợp kỳ | Báo cáo tháng có present, late, totalRecords, missingCheckOut; Prisma groupBy toàn tháng, không phụ thuộc phân trang | Chỉ đếm bản ghi, không tính giờ/công/nghỉ hưởng lương. Nhân viên không có bản ghi trong tháng không xuất hiện trong report |

File làm căn cứ:

- [Schema Employee/Leave/Attendance](/D:/HRM-project/backend/prisma/schema.prisma:28): toàn bộ schema chưa có Shift, WorkCalendar, Holiday, Overtime, SalaryTemplate hoặc Company/Tenant.
- [attendance.service.ts](/D:/HRM-project/backend/src/modules/attendance/attendance.service.ts:57): timezone/cutoff; `checkIn` ở dòng 230, `checkOut` ở dòng 273.
- [attendance.repository.ts](/D:/HRM-project/backend/src/modules/attendance/attendance.repository.ts:117), [attendance-report.service.ts](/D:/HRM-project/backend/src/modules/attendance/attendance-report.service.ts:16): phạm vi báo cáo tháng.
- [attendance-adjustment.service.ts](/D:/HRM-project/backend/src/modules/attendance/attendance-adjustment.service.ts:133), [leave-request.service.ts](/D:/HRM-project/backend/src/modules/leave-request/leave-request.service.ts:306): gửi/duyệt, chưa nối tính lương.
- [dashboard.service.ts](/D:/HRM-project/backend/src/modules/dashboard/dashboard.service.ts:133), [dashboard.repository.ts](/D:/HRM-project/backend/src/modules/dashboard/dashboard.repository.ts:107): `usedAnnualLeave` đang lấy **số đơn ANNUAL được duyệt toàn lịch sử**, quota cố định 12; không phải số ngày phép của năm. Không tái sử dụng số này cho Payroll. Dashboard Employee còn dùng ngày UTC và tháng theo timezone server, khác nguồn ngày công Attendance.

### Payroll

- [Payroll schema](/D:/HRM-project/backend/prisma/schema.prisma:158): mỗi nhân viên/tháng/năm một dòng; `baseSalary/bonus/deduction/netSalary` Decimal(12,2), note, DRAFT/PUBLISHED. Không có template, đơn giá ngày/giờ, line items, công đầu vào, người chốt hay snapshot chính sách.
- [payroll.service.ts](/D:/HRM-project/backend/src/modules/payroll/payroll.service.ts:456): Admin nhập tiền; backend tính `baseSalary + bonus - deduction` bằng Prisma.Decimal. Sửa nháp tính lại ở dòng 553. Chưa đọc Attendance/Leave; chưa tính bảo hiểm, thuế, phụ cấp hoặc OT.
- [payroll.controller.ts](/D:/HRM-project/backend/src/modules/payroll/payroll.controller.ts:131) / [routes](/D:/HRM-project/backend/src/modules/payroll/payroll.routes.ts:9): Admin GET/POST `/api/payrolls`, PATCH `/:id`, PATCH `/:id/publish`; body create nhận employeeId, month, year, baseSalary, bonus?, deduction?, note?. Không nhận netSalary từ client. List dùng `{data,pagination}`, không phải `{data,meta}` của Attendance.
- [Employee routes](/D:/HRM-project/backend/src/modules/employee/employee.routes.ts:11): GET `/api/employees/me/payrolls`, GET `.../:id/pdf`; Employee chỉ lấy bảng PUBLISHED của mình. Không thấy route GET chi tiết Admin theo id; UI hiện lấy dòng list để mở detail.
- [CreatePayrollDialog](/D:/HRM-project/frontend/src/pages/admin/payrolls/components/CreatePayrollDialog.tsx:112) preview bằng JS Number và ép tối thiểu 0; [EditPayrollDialog](/D:/HRM-project/frontend/src/pages/admin/payrolls/components/EditPayrollDialog.tsx:130) và backend không ép 0. Có thể lệch khi khấu trừ lớn hơn thu nhập; backend chưa có rule chặn net âm.
- [payroll.repository.ts](/D:/HRM-project/backend/src/modules/payroll/payroll.repository.ts:181): service kiểm tra DRAFT trước, repository update/publish bằng id. Kiểm tra và ghi chưa atomic: cần xử lý race edit/publish để bảo vệ bảng đã phát hành.
- [payroll-pdf.generator.ts](/D:/HRM-project/backend/src/modules/payroll/payroll-pdf.generator.ts:71) lấy tiền đã lưu nhưng tên/mã nhân viên từ relation hiện tại. Số tiền lịch sử được giữ, thông tin trên PDF chưa phải snapshot đầy đủ.
- Reuse frontend: `features/payroll/{api,types,hooks,lib/payroll.query-keys.ts}`, RHF/Zod và shadcn Dialog hiện có. Các detail/PDF vẫn có cột/nhãn công thức cố định. Chưa thấy test Payroll chuyên biệt trong `backend/tests`/`frontend/tests`; đã có test Attendance report/adjustment.

## 2. Gap cần xử lý

**Chặn tính lương tự động từ Attendance:** thiếu lịch làm/ngày nghỉ, ca và nghỉ giữa ca; phép hưởng lương theo đơn vị; số công/giờ đã đối soát; quy tắc vào/nghỉ giữa tháng. Không dùng `present + late` làm công hưởng lương và không mặc định dữ liệu thiếu là 0.

Edge case cần có cách xử lý rõ:

- Thiếu check-out, chỉ có check-in vài phút, check-out sớm, quên cả ngày: chưa đủ căn cứ trả/khấu trừ công; cần trạng thái chưa xác định và đối soát.
- Check-out sau nửa đêm, nhiều lần ra/vào, ca qua ngày: mô hình hiện tại chưa hỗ trợ; không tự đổi ngày hoặc cộng giờ.
- Phép trùng nhau/trùng chấm công, nửa ngày, qua tháng/năm, trùng lễ/cuối tuần: tính theo lịch và giao khoảng thời gian, chống đếm hai lần. SICK không tự đồng nghĩa nghỉ hưởng nguyên lương do doanh nghiệp trả.
- Nhân viên không có punch, vào/nghỉ giữa kỳ, đổi lương/template giữa kỳ: cần phạm vi hợp đồng/hiệu lực; status INACTIVE không thay được ngày nghỉ việc.
- Ngày lễ có lương khác ngày trực tiếp làm; công hưởng lương có thể lớn hơn công đi làm. Không trừ nghỉ không lương lần nữa nếu đã loại khỏi payable units.
- Điều chỉnh công/phép sau preview hoặc sau chốt: nháp cần xác nhận tính lại; đã phát hành không tự sửa, cần khoản điều chỉnh có tham chiếu ở kỳ sau.
- Tháng 28/29/30/31 ngày, mẫu số công chuẩn bằng 0, giờ không hữu hạn, Decimal vượt độ chính xác/range, net âm và làm tròn: phải validate; không âm thầm clamp hoặc fallback 0.

**Đối chiếu Việt Nam — tách luật khỏi lựa chọn doanh nghiệp:**

| Chủ đề | Ràng buộc / lựa chọn | Hệ quả thiết kế |
| --- | --- | --- |
| Tháng/ngày/giờ, công chuẩn | Hình thức trả lương phải có cơ sở thỏa thuận. Công chuẩn không mặc định 26 cho mọi doanh nghiệp; cách quy đổi ngày phải phù hợp lịch và pháp luật [V1][V2] | Cấu hình đơn vị, mẫu số và lịch; ghi rõ giả định demo, không quảng bá mẫu là chuẩn pháp lý chung |
| Thời giờ, nghỉ hưởng lương | Điều 105, 112–115 BLLĐ quy định thời giờ/nghỉ; phép năm có nhiều mức, theo điều kiện/thâm niên, không phải luôn 12 [V3] | Không cho việc tắt phụ cấp tùy chọn vô tình tắt lương lễ/phép bắt buộc; lịch lễ, quyền phép và loại nghỉ phải riêng |
| OT/ban đêm | Điều 98 quy định mức tối thiểu theo loại ngày; OT ngày thường/nghỉ tuần/lễ tương ứng ít nhất 150%/200%/300%, có điều kiện về lương ngày lễ; ban đêm có phần trả thêm [V4] | Hoãn tự tính OT khi chưa có giờ duyệt/loại ngày/căn cứ; không dùng hệ số tùy ý dưới mức bắt buộc |
| Đi muộn, khoản trừ | Cấm phạt tiền/cắt lương thay xử lý kỷ luật; khấu trừ bồi thường có điều kiện, giới hạn riêng, không áp giới hạn đó máy móc cho mọi khoản trừ [V3][V5] | Không làm rule “mỗi lần muộn phạt X”. Tách thời gian không làm theo thỏa thuận hợp pháp khỏi chế tài phạt; khoản trừ cần phân loại, căn cứ và người xác nhận |
| Bảo hiểm/thuế | Nghĩa vụ theo đối tượng, căn cứ, trần và hiệu lực; căn cứ BHXH không mặc định bằng baseSalary hoặc toàn bộ phụ cấp [V6]. Thuế tiền lương năm 2026 có quy định mới [V7] | Không coi đây là add-on HR được tùy ý bỏ khi thuộc diện áp dụng. Hoãn engine thuế/BH đầy đủ; MVP nhập khoản đã đối soát, hoặc chỉ cho preview trước nghĩa vụ chưa xác định |
| Lương tối thiểu | Có mức theo vùng/tháng/giờ và ngày hiệu lực; NĐ 293/2025 có hiệu lực 01/01/2026 [V8] | Lưu căn cứ/vùng/hiệu lực hoặc yêu cầu xác nhận; không so lương tháng làm thiếu công với một mức sàn chung |

Các cổng pháp luật có văn bản sửa đổi/hợp nhất; cần đối chiếu hiệu lực đúng kỳ khi triển khai. Bảng trên là yêu cầu thiết kế cho MVP, không chứng nhận hệ thống đã đủ điều kiện vận hành payroll pháp lý đầy đủ. Phụ cấp/thưởng doanh nghiệp không áp dụng được bỏ; nghĩa vụ bắt buộc thì không được bỏ bằng toggle.

## 3. Rule MVP đề xuất và dữ liệu đầu vào

**Phạm vi khả thi:** một doanh nghiệp/bản cài đặt trước. Hỗ trợ cả ba đơn vị lương bằng đầu vào HR xác nhận; không đòi hoàn thiện cả hệ thống ca/OT trước khi demo cấu hình. Gắn nguồn `HR_CONFIRMED`/`DEMO` rõ ràng; `ATTENDANCE_DERIVED` chỉ bật khi bộ tổng hợp mới được duyệt.

| Rule có cấu trúc | Tính toán đề xuất | Đầu vào và trạng thái hiện tại |
| --- | --- | --- |
| MONTHLY | Trả đủ mức tháng khi đủ điều kiện; chọn policy prorate rõ ràng cho kỳ thiếu công, ví dụ `monthlyRate × payableDays / standardDays` | monthlyRate từ hồ sơ lương/gán mẫu mới; standardDays, payableDays và các phần nghỉ hưởng lương cần HR xác nhận. Không lấy rate từ kỳ lương cũ làm hợp đồng |
| DAILY | `dailyRate × payableDays` | Đơn giá/ngày mới, số công hưởng lương xác nhận; hỗ trợ số thập phân nếu chọn đơn vị 0,5 ngày. Phân biệt đơn giá ngày với lương tháng quy đổi ra ngày |
| HOURLY | `hourlyRate × payableHours` | Đơn giá/giờ, thời gian hưởng lương xác nhận; lưu thời lượng bằng phút và chuyển Decimal khi tính, tách giờ thường/giờ OT. Raw elapsed time chưa phải paid hours |
| FIXED | Khoản cố định theo kỳ hoặc giá trị nhập riêng của nhân viên | code, tên, chiều cộng/trừ, số tiền, hiệu lực, căn cứ; tùy chọn, không bắt buộc có dòng 0 |
| PER_UNIT | `amount × quantity` | quantity chỉ chọn nguồn whitelist, ví dụ mealEligibleDays, actualWorkedDays; không tự dùng payableDays vì ngày nghỉ có lương chưa chắc có tiền ăn |
| PERCENT | `% × base` | Base chỉ chọn MAIN_EARNED hoặc CONTRACT_MONTHLY_RATE phù hợp đơn vị; không dựa trên net/tổng có chứa chính khoản đó. Không dùng rule này thay máy tính thuế/BH |
| ONE_OFF | Khoản cộng/trừ một kỳ có lý do | Số tiền, loại khoản, chứng từ/căn cứ và người xác nhận; không sửa template để áp thưởng riêng một người |
| ROUNDING / GUARDS | Một policy làm tròn có thứ tự nhất quán; Decimal; chặn dữ liệu thiếu/không hợp lệ | precision, step, roundingMode; net âm phải báo cần xử lý, không tự đưa về 0; giá trị 0 đã xác nhận khác chưa nhập |

Khoản tùy chọn có `enabled`, code ổn định, label, direction, ruleType, params, source/base. Chỉ evaluate khoản enabled; lưu line items theo đúng cấu hình áp dụng. Cùng engine cho mẫu demo/clone; mẫu mặc định không sửa trực tiếp, clone sang draft riêng.

**Hoãn:** công thức tự do/eval, phụ thuộc tùy ý giữa khoản, ca xoay/qua đêm/nhiều punch, tự động OT/ban đêm, lương sản phẩm/hoa hồng, net-to-gross, nhiều tiền tệ, quyết toán thuế/BH tự động, nhiều công ty cùng DB và chia lương khi đổi chính sách giữa kỳ. Đổi rate/template MVP có hiệu lực từ đầu kỳ; nếu cần giữa kỳ phải bổ sung tính theo đoạn, không lấy một rate áp toàn tháng.

Nếu thuế/BH thuộc diện áp dụng mà chưa có khoản được HR xác nhận, chỉ hiển thị **thu nhập dự kiến trước các nghĩa vụ chưa tính**, không cho phát hành như thực nhận hoàn chỉnh. Chế độ demo có dữ liệu thử riêng, không ghi giả vào hồ sơ thật.

## 4. Kiến trúc và thứ tự triển khai

### Luồng Admin đề xuất

1. Nhân bản mẫu mặc định -> draft doanh nghiệp; hiển thị cách tính và phạm vi demo.
2. Chọn MONTHLY/DAILY/HOURLY; bật/tắt, thêm/bớt khoản; cấu hình fixed/per-unit/percent, nguồn số liệu, làm tròn và ngày hiệu lực.
3. Preview bằng bộ dữ liệu thử rõ nhãn hoặc nhân viên/kỳ thật đủ đầu vào; trả breakdown, dữ liệu thiếu, warning và tổng. Chưa có assignment thì có thể nhập thử rate/units.
4. Validate và kích hoạt phiên bản bất biến; sửa tiếp tạo version mới. Kích hoạt không đổi mẫu đang áp dụng cho bảng cũ.
5. Gán version + rate/giá trị khoản cho nhân viên theo khoảng hiệu lực, không cho assignment chồng lấn. Chốt điều kiện lao động/công chuẩn phù hợp.
6. Chọn kỳ tháng -> đối soát công/giờ và khoản bắt buộc -> xác nhận input -> gọi cùng engine để tính nháp; không dùng các dòng list đang phân trang để tổng hợp.
7. Review từng khoản -> phát hành atomic. Báo cáo/PDF đọc snapshot; thay dữ liệu nguồn sau đó không tự làm lại kỳ cũ.

### Thay đổi database tối thiểu được đề xuất (chưa thiết kế migration)

| Thành phần | Dữ liệu tối thiểu / mục đích |
| --- | --- |
| SalaryTemplate | Nhận diện mẫu, tên, loại system/clone, nguồn clone; tách identity khỏi nội dung version |
| SalaryTemplateVersion | templateId/version unique, trạng thái, effectiveFrom, ruleSchemaVersion, structured rules JSONB, người tạo/kích hoạt. Rules validate ở backend; version đã active không sửa/xóa |
| EmployeeSalaryAssignment | employeeId, templateVersionId, loại rate/Decimal rate, override có whitelist, hiệu lực; lịch sử bất biến, chống overlap và chọn version theo kỳ |
| PayrollPeriodInput | employeeId + year/month, payable units, công chuẩn, các quantity/khoản xác nhận, inputSource, nguồn tham chiếu, revision, người/thời điểm xác nhận. Không mặc định dữ liệu thiếu về 0 |
| Mở rộng Payroll | Nullable versionId/assignmentId cho legacy; calculationMode LEGACY/CONFIGURED; engineVersion, input revision, `calculationSnapshot` JSONB, gross/earnings/deductions và publishedBy/At. Snapshot chứa identity nhân viên, config/rate/units, các line item code-label-rule-base-quantity-amount, rounding và kết quả; tiền serialize decimal strings |

MVP có thể lưu line items trong snapshot thay vì thêm bảng chi tiết riêng; chỉ tách bảng khi cần truy vấn thống kê. Giữ cột tiền cũ cho đọc legacy/tương thích, không gán mọi khoản cộng thành “Thưởng”; chốt mapping tổng mới trước khi triển khai. Chưa cần payroll batch/run model riêng cho luồng hiện tại một nhân viên/kỳ.

Để tự động hóa công ở giai đoạn sau mới bổ sung lịch/ca có hiệu lực, ngày lễ/nghỉ bù và leave ledger/paid classification; giữ raw Attendance nguyên nguồn. Khi đó Input Builder đối chiếu lịch + punch + approved leave/adjustment, tạo số công đề xuất và danh sách ngoại lệ để HR chốt.

### Backend, frontend và bảo vệ lịch sử

- Backend giữ controller -> service -> repository; thêm engine thuần `calculate(templateVersion, validatedInputs)` với whitelist rule, Decimal và fixed evaluation order; không eval JS/SQL. Preview và lưu nháp gọi cùng engine. Query/repository chỉ lấy dữ liệu, không rải công thức khắp controller/UI.
- Engine trả `lines/totals/warnings/errors/inputProvenance`. Server load version/assignment thật và kiểm tra quyền, không tin net hay cấu hình client gửi khi lưu. Chưa chốt endpoint: các khả năng mới cần có là clone/version/activate/assign/preview/calculate, sau đó mới thiết kế DTO/API.
- Preview mang revision/hash config + input; lưu phải kiểm tra và tính lại server-side. Ghi nháp/publish trong transaction với guard `status=DRAFT` + version/revision. Chặn kết quả preview đã cũ, duy trì unique employee/month/year; không ghi đè kỳ đã phát hành.
- Legacy không backfill công/template bằng suy đoán, không tính lại hàng loạt; snapshot mới chỉ cho bản ghi được tính bằng engine mới. PDF/bảng cũ tiếp tục renderer legacy; bảng mới dùng snapshot để thay đổi tên người/khoản không sửa chứng từ lịch sử. Thực hiện điều chỉnh kỳ cũ qua quy trình riêng.
- Frontend reuse module Payroll, RHF/Zod, TanStack query keys, Dialog, ConfirmDialog, Decimal strings. Thêm Template editor dạng structured field array, preview breakdown/warning, assignment và xác nhận input kỳ. Không chạy engine độc lập bằng Number trong UI; gọi preview có debounce/cancel khi phù hợp, không polling thêm.
- Tái sử dụng detail/PDF/list nhưng render các khoản theo snapshot, bỏ nhãn công thức cố định trên bảng CONFIGURED. Mutation invalidate đúng template/assignment/payroll, giữ UI Employee chỉ đọc PUBLISHED. Chưa có role HR riêng: MVP dùng ADMIN hiện tại; không tự thêm phân quyền động.

**Thứ tự:** (1) chốt các quyết định mục 5 và contract; (2) chuẩn hóa preview/Decimal/atomic publish và test legacy; (3) versioned template + engine + unit tests; (4) clone/config/preview/activate UI; (5) assignment + HR-confirmed input + tính nháp/phát hành/PDF snapshot; (6) lịch/leave/input builder tự động khi đủ nguồn. Tất cả chạy trên Node/PostgreSQL hiện có, không cần dịch vụ trả phí/cron mới.

Test bắt buộc trước nâng cấp: tháng nhuận/khác số ngày, 0-vs-missing, fractional units, round/overflow/net âm, khoản tắt không xuất hiện, ngày công không cộng trùng leave, thay config/rate/source sau preview, race edit/publish, legacy không đổi và ownership PDF. Test nguồn công tự động chỉ viết khi semantics đã được chốt.

## 5. Những quyết định nghiệp vụ cần xác nhận

| Quyết định | Khuyến nghị để giữ MVP nhỏ |
| --- | --- |
| Một công ty/cài đặt hay SaaS nhiều công ty? | Một công ty/cài đặt; nhiều template không đồng nghĩa đã cô lập nhiều tenant |
| Đầu vào công ban đầu? | HR xác nhận theo kỳ; Attendance chỉ cung cấp bằng chứng. Tự tổng hợp là phase sau, không dùng count làm công |
| MONTHLY prorate và công chuẩn? | Chọn một policy theo hợp đồng/lịch; chưa chốt 22/26, denominator, nghỉ lễ, tháng thiếu công hoặc ngày vào/nghỉ giữa kỳ |
| DAILY/HOURLY và nửa ngày? | Rate đúng đơn vị; chốt payable units gồm loại nghỉ nào, độ chia công/phút và xử lý OT riêng |
| Phép/ca cần tự động tới đâu? | Chốt lịch tuần, giờ nghỉ, cutoff/grace, phép có lương, overlap trước khi build tự động; hoãn ca đêm |
| Thuế/BH và khoản trừ? | Tính ngoài rồi nhập khoản đối soát trong MVP; nếu chưa đủ thì chỉ preview trước nghĩa vụ, không phát hành net hoàn chỉnh. Không rule phạt muộn |
| Danh sách khoản/rule mặc định? | Main pay bắt buộc; demo có vài phụ cấp/thưởng tùy chọn; fixed/per-unit/percent có whitelist. Chốt tỷ lệ/base, kỳ áp dụng và điều kiện theo từng khoản |
| Hiệu lực/khóa kỳ/sửa sai? | Đổi version/rate đầu kỳ; snapshot bất biến; thay nguồn công sau chốt không tự sửa tiền cũ. Chốt quy trình khoản điều chỉnh kỳ sau |
| Precision và tương thích legacy? | Chốt làm tròn VND, giới hạn Decimal, nghĩa gross/net và cách giữ các cột API cũ trước khi thêm schema |

### Nguồn pháp lý đã đối chiếu

- [V1 — Bộ LĐTBXH giải đáp Điều 54, NĐ 145/2020 về ngày công](https://chinhsachonline.chinhphu.vn/tinh-luong-theo-ngay-cong-the-nao-la-dung-70400.htm).
- [V2 — Thỏa thuận hình thức trả lương phải ghi trong hợp đồng](https://www2.en.baochinhphu.vn/thoa-thuan-tra-luong-phai-ghi-trong-hop-dong-lao-dong-102250102100224607.htm).
- [V3 — BLLĐ 45/2019/QH14, bản gốc Chính phủ](https://datafiles.chinhphu.vn/cpp/files/vbpq/2019/12/45.signed.pdf); [quyền nghỉ năm, Điều 113–114](https://chinhsachonline.chinhphu.vn/nhan-vien-truong-hoc-co-duoc-nghi-he-khong-63703.htm).
- [V4 — BLLĐ hợp nhất 18/VBHN-VPQH 2026, Điều 98](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/18-vbhn-vpqh.pdf); [NĐ 145/2020, hướng dẫn OT](https://congbao.chinhphu.vn/tai-ve-van-ban-so-145-2020-nd-cp-32732-33806?format=pdf). Nguồn hợp nhất đối chiếu trích đoạn chỉ mục; tải trực tiếp bị lỗi trong phiên audit, không khẳng định đã đọc toàn bộ bản này.
- [V5 — Cổng tỉnh Quảng Trị đối chiếu Điều 127, cấm phạt tiền/cắt lương thay kỷ luật](https://www.quangtri.gov.vn/en/tin-tuc/doanh-nghiep-co-duoc-phat-tien-nguoi-lao-dong).
- [V6 — BHXH Việt Nam về căn cứ đóng theo Luật BHXH 2024 và NĐ 158/2025](https://baohiemxahoi.gov.vn/tintuc/Pages/linh-vuc-bao-hiem-y-te.aspx?CateID=0&ItemID=25381&OtItem=date).
- [V7 — Luật TNCN 109/2025/QH15](https://vanban.chinhphu.vn/?docid=216495&pageid=27160); [Chính phủ giải thích áp dụng thu nhập tiền lương từ kỳ thuế 2026](https://baochinhphu.vn/tu-2026-tien-luong-tien-cong-tinh-thue-thu-nhap-ca-nhan-theo-quy-dinh-nao-102260313104822483.htm). Cần cập nhật cả sửa đổi/hướng dẫn khi triển khai máy tính thuế, không hardcode biểu cũ.
- [V8 — NĐ 293/2025/NĐ-CP, mức lương tối thiểu từ 01/01/2026](https://chinhphu.vn/?classid=1&docid=215832&orggroupid=2&pageid=27160).
