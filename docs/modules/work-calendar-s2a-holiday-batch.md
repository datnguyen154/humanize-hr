# S2A — Holiday Presets & Atomic Batch, Exact Contract v1.1

Ngày22/10/2026. Mở rộng theo yêu cầu người dùng, không S2B. Bổ sung cho [v1](work-calendar-s2a.md); giữ6 API cũ,4 kinds và ADMIN-only. Backend implementation: [report](../codex-reports/attendance-payroll-s2a-holiday-batch.md). Frontend v1.1 đã triển khai và Codex review/sửa logic; [review mới](../codex-reports/attendance-payroll-s2a-v11-integration-review.md) còn FUI-01 mobile batch table giao Anti. QA chưa done. Contract không đổi trong lượt review.

## 1. Nguồn và giới hạn preset

Catalog version `VN-2026-10-22-r1`, dữ liệu tĩnh có kiểm chứng, không gọi lịch ngoài/cron/engine âm lịch lúc runtime.

- Phạm vi hiện có:2026 đủ6 nhóm người dùng yêu cầu;2027 có Dương lịch,3 phương án Tết,30/04,01/05,2 phương án Quốc khánh. Giỗ Tổ2027 chưa có ngày được xác minh trong catalog này, trả unavailable. Năm khác trả presets rỗng/unavailable, không đoán hoặc lấy năm khác thay.
- Mỗi preset có id bất biến, year, holidayCode, name, optionLabel, dates, sourceReference, sourceUrls, suggestedReason, verifiedOn. HR chọn/xem/xác nhận; không tự áp dụng. Không sửa/xóa id đã lưu vào payload; cập nhật nguồn/ngày phải thêm version/id mới và giữ registry cũ để đọc lịch sử.
- Tết gồm5 ngày HOLIDAY theo phương án doanh nghiệp, không biến toàn kỳ nghỉ liên tục thành lễ pháp định. Quốc khánh gồm02/09 và một ngày liền kề theo phương án được nguồn xác nhận; không ghép hai phương án để tạo3 ngày pháp định.
- Đây là danh sách tiện ích có giới hạn, **không phải danh mục pháp luật đầy đủ hoặc chứng nhận tuân thủ**. Không tự thêm hoán đổi khối công vào doanh nghiệp; không bao phủ toàn bộ đối tượng đặc thù/người lao động nước ngoài hoặc mọi thay đổi pháp luật.

Nguồn được đối chiếu22/10/2026:

1. [Bộ luật Lao động45/2019/QH14](https://chinhphu.vn/?docid=198540&pageid=27160), Điều112 về lễ và khoản3 Điều111 về nghỉ bù ngày nghỉ tuần. Dùng cho01/01,30/04,01/05 và phân loại căn cứ, không phải công thức tính Payroll.
2. [Thông báo lịch2026 qua Báo Chính phủ](https://baochinhphu.vn/bo-noi-vu-thong-bao-lich-nghi-tet-am-lich-va-nghi-le-quoc-khanh-nam-2026-102251017095507785.htm): phương án doanh nghiệp, không lấy cả cuối tuần/hoán đổi của khu vực công làm HOLIDAY.
3. [Thông báo lịch2027 qua Báo Chính phủ](https://baochinhphu.vn/nghi-tet-am-lich-2027-keo-dai-7-ngay-nghi-quoc-khanh-4-ngay-102261010095648278.htm): phương án doanh nghiệp và ngày dương lịch tương ứng đã nêu. Catalog chỉ ghi5 ngày lễ của từng phương án.
4. [Giỗ Tổ2026, Cổng Chính phủ](https://xaydungchinhsach.chinhphu.vn/lich-nghi-le-gio-to-hung-vuong-30-4-1-5-quoc-khanh-2-9-nam-2026-119260222115822151.htm):10/03 âm lịch tương ứng26/04/2026; không extrapolate năm khác.

## 2. HOLIDAY metadata và tương thích v1

HOLIDAY giữ kind/date/name/sourceReference/reason, thêm trường **holidayPolicy**:

```ts
type HolidayPolicy =
  | { category: 'STATUTORY'; presetId: string }
  | { category: 'COMPANY'; isPaid: boolean }
```

- STATUTORY: presetId phải tồn tại, date phải thuộc đúng preset đó. Không nhận isPaid hoặc thuộc tính lạ. Không cho pha hai options cùng year/holidayCode trong cùng DRAFT, kể cả qua CRUD đơn.
- COMPANY: isPaid bắt buộc boolean, do HR xác nhận; tên/căn cứ/lý do lấy quyết định nội bộ, không tự điền Điều112. Không tự phát sinh nghỉ bù pháp định từ ngày nghỉ COMPANY.
- sourceReference vẫn là text HR kiểm tra, không phải bộ kiểm định pháp lý hoặc bằng chứng đã duyệt quyền nghỉ. Backend không gán căn cứ luật giả cho COMPANY.
- Metadata chỉ thể hiện **căn cứ/chính sách của ngày nghỉ**, chưa cấp payableDays, tính tiền, trừ lương hoặc xác nhận chính sách không hưởng lương có hiệu lực pháp lý. Phạm vi/quy trình phê duyệt/đồng thuận lao động còn cần xác nhận ở S3 trở đi.
- POST/PATCH đơn v1 vẫn nhận payload thiếu holidayPolicy để không phá frontend/record cũ; được coi UNCLASSIFIED, tuyệt đối không tự thành STATUTORY/PAID. Batch mới bắt buộc phân loại.
- PATCH HOLIDAY hiện đã phân loại mà clientv1 không gửi policy: giữ policy cũ và validate lại date. Không được làm mất phân loại ngầm; muốn chuyển loại phải gửi policy rõ ràng. Nếu có COMPENSATORY_OFF tham chiếu, không cho nguồn chuyển sang COMPANY.
- Legacy không policy vẫn giữ resolver nghỉ bù v1 để không làm sai dữ liệu cũ. **Không dùng legacy này làm bằng chứng ngày nghỉ pháp định/hưởng lương**; Anti cần nhãn chưa phân loại. Reclassification là thao tác HR có CAS/audit, không backfill/migration đoán hàng loạt.

Monthly Preview v1 thêm2 field vào mỗi day (additive):

```ts
holidayCategory: 'STATUTORY' | 'COMPANY' | 'UNCLASSIFIED' | null
holidayPayPolicy: 'PAID' | 'UNPAID' | 'UNSPECIFIED' | null
```

Chỉ HOLIDAY resolved có giá trị: STATUTORY→PAID; COMPANY→isPaid; legacy→UNCLASSIFIED/UNSPECIFIED. Ngày khác, NO_SCHEDULE và UNRESOLVED trả null. COMPENSATORY_OFF là nghỉ bù ngày nghỉ tuần, **không phải thêm một ngày lễ hưởng lương**, nên2 field null; nguồn có trong sourceHolidayDate/event. isBaseWeeklyOff vẫn tách biệt khi HOLIDAY trùng cuối tuần. Chưa quyết định mẫu số/chống đếm đôi tiền ở S3.

Prisma không đổi: payload Json và audit Json hiện có lưu policy/presetId; giữ4 enums, không model ngày tuần hoặc kind mới. Fingerprint resolverVersion tăng2, không so với fingerprintv1. Chưa ACTIVE/LOCKED/snapshot Payroll nên không có dữ liệu lương lịch sử bị tính lại.

## 3. API bổ sung

Base `http://localhost:3000/api`, Bearer và ADMIN như v1. Không query phụ hoặc body field lạ.

| Method | Path | Thành công |
| --- | --- | --- |
| GET | `/work-calendar/holiday-presets?year=2026` |200 `{data:HolidayPresetCatalog}` |
| POST | `/work-calendar/versions/:versionId/exceptions/batch-preview` |200 `{data:HolidayBatchPlan}` |
| POST | `/work-calendar/versions/:versionId/exceptions/batch` |201 `{data:{created:CalendarExceptionDto[],skipped:SkippedDay[],scheduleRevision}}` |

year4 chữ số0001–9999, không lặp query. Catalog trả `catalogVersion,year,timezone,requiresConfirmation:true,presets,unavailable,notice`. Mỗi unavailable có holidayCode/reason tiếng Việt.

### Batch Preview request

```json
{
  "expectedRevision": 3,
  "includeCompensatoryOff": true,
  "holidays": [
    {
      "kind": "HOLIDAY",
      "date": "2026-04-26",
      "name": "Giỗ Tổ Hùng Vương",
      "sourceReference": "Căn cứ tham khảo từ preset, HR đã kiểm tra",
      "reason": "Thiết lập kỳ nghỉ đã xác nhận của doanh nghiệp",
      "holidayPolicy": {
        "category": "STATUTORY",
        "presetId": "VN-2026-10-22-r1:2026:HUNG_KINGS:default"
      }
    }
  ]
}
```

-1–31 holidays, chỉ HOLIDAY, mỗi item đủ validation v1+policy. Date thậtYYYY-MM-DD; khoảng ngày tối đa366 ngày, kể cả khoảng review sau thêm nghỉ bù.
- Lỗi shape một item có details`holidays.<originalIndex>.<field>` trước khi sort; lỗi quan hệ/engine có thể dùng `exception.<field>` như v1 và hiển thị ở lỗi chung. Không hiển thị lỗi backend raw không localization.
- Request không nhận datesrange không phân loại, weekend flag, auto-paid, expectedTargets, netSalary hoặc dữ liệu preview do client tính.
- includeCompensatoryOff bắt buộc boolean: true chỉ **đề xuất** nghỉ bù cho nguồn STATUTORY được chọn, theo resolver/lịch hiện có; không tự bù mọi issue của toàn DRAFT. false lưu lễ mà chưa tạo nghỉ bù, BLOCKER cần xử lý vẫn hiển thị. Không ngầm lưu tại preview.

### HolidayBatchPlan

```ts
type SkippedDay = { exceptionId: string; date: string; kind: 'HOLIDAY' | 'COMPENSATORY_OFF' }
type HolidayBatchPlan = {
  scheduleRevision: number
  catalogVersion: string
  planFingerprint: string // sha256:...
  toCreate: CalendarExceptionPayload[] // HOLIDAY và COMPENSATORY_OFF do Backend đề xuất
  skipped: SkippedDay[]
  calendarDays: CalendarPreviewDay[] // đủ từng ngày trong khoảng review, kể cả WEEKLY_OFF
  validation: { hasBlockingIssues: boolean; issues: CalendarIssue[] }
}
```

- toCreate có cả reason nghỉ bù được đề xuất để HR xem. calendarDays phân biệt HOLIDAY, WEEKLY_OFF, COMPENSATORY_OFF và isBaseWeeklyOff; không lưu một row ngoại lệ cho mỗi ngày nghỉ tuần.
- validation từ toàn DRAFT, không chỉ trong review range; giữ issue.scope DRAFT. hasBlockingIssues không phải lỗi request và **không đồng nghĩa S2A cấm lưu draft**. Ngày nghỉ bù không xác định được trả409 riêng, không tự chọn một ngày khác.
- HOLIDAY trùng ngày đã tồn tại chỉ skip nếu payload canonical giống hệt (name/sourceReference/reason/policy). Khác cấu hình hoặc trùng với SWAP/override/comp →409, không overwrite. Legacy thiếu policy cũng không được tự gán pháp định chỉ vì trùng date.
- COMPENSATORY_OFF đúng nguồn/target đã có thì skip, không tạo lần hai; sai target/duplicate source báo conflict để HR xử lý. Target được tính theo toàn lịch, không theo thứ tự nhập.

### Commit

Gửi **cùng request preview**, thêm `planFingerprint` trả về. Sau bất kỳ thay đổi input/checkbox/DRAFT/revision nào phải bỏ plan cũ và preview lại. HR xem và bấm xác nhận trước khi UI gọi POST batch.

- Backend khóa parent bằng CAS trong transaction, load đầy đủ nguồn, dựng lại plan rồi so fingerprint; không tin toCreate/calendarDays từ client.
- Có thay đổi: tất cả inserts HOLIDAY+COMPENSATORY_OFF, revision tăng đúng1 và1 audit EXCEPTION_CREATE với after.operation=`HOLIDAY_BATCH` và toàn created/skipped/fingerprint. Lỗi bất kỳ insert/audit/CAS rollback tất cả, không partial success.
- Không còn gì cần tạo:201 created=[], skipped hiện rõ, revision/audit/updatedAt không đổi. Gửi lại revision cũ sau batch đã lưu vẫn409; preview lại revision hiện tại sẽ nhận skip, không tạo trùng.
- Không làm engine tính công/lương, không ghi Attendance/Leave/Payroll. Chỉ DRAFT; không activate/sửa ACTIVE.

## 4. Errors

Giữ `{code,message,details?}` tiếng Việt v1 và401/403 hiện có.

| Status/code | Xử lý |
| --- | --- |
|400 VALIDATION_ERROR | field/date/policy/preset option/duplicate input/size sai; giữ input |
|404 WORK_SCHEDULE_NOT_FOUND | parent không có |
|409 WORK_SCHEDULE_NOT_DRAFT | không được sửa |
|409 WORK_SCHEDULE_REVISION_CONFLICT | giữ form; reload có xác nhận bỏ input, snapshot mới, preview lại |
|409 WORK_CALENDAR_EXCEPTION_CONFLICT | trùng hoặc cấu hình khác đã có; không phải stale revision |
|409 WORK_CALENDAR_BATCH_PLAN_CHANGED | fingerprint/input/nguồn khác plan; giữ input, yêu cầu preview lại |
|409 WORK_CALENDAR_BATCH_UNRESOLVED | chưa xác định target nghỉ bù; xử lý issues, không tự đoán |

## 5. Handoff

[Brief Anti cập nhật](../agents/ATTENDANCE_PAYROLL_S2A_FRONTEND_BRIEF.md) gộp form preset/kỳ nghỉ và F11 responsive375/390. Quy tắc dirty form/409/retry/focus/cache của review trước không được bỏ. UI mới chưa implement trong lượt Backend này; Codex review logic tích hợp sau Anti, rồi người dùng QA/done. Không tự chuyển S2B.
