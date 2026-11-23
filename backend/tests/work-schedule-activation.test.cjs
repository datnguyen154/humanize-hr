const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyCheckIn, createCalendarResolver } = require('../dist/modules/work-calendar/effective-calendar');
const { assertActivatable, companyTomorrow } = require('../dist/modules/work-calendar/work-schedule-activation.service');

const actor = '22222222-2222-4222-8222-222222222222';
const schedule = (id, effectiveFrom, extra = {}) => ({ id, version: 1, revision: 1, status: 'ACTIVE', effectiveFrom,
    timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '17:00',
    breaks: [{ startTime: '12:00', endTime: '13:00' }], createdBy: actor, updatedBy: actor,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z', ...extra });
const holiday = (versionId, date) => ({ id: `h-${date}`, scheduleVersionId: versionId, firstAffectedDate: date, createdBy: actor, updatedBy: actor,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z',
    payload: { kind: 'HOLIDAY', date, name: 'Lễ', sourceReference: 'Căn cứ', reason: 'Kiểm thử' } });
const v1 = '11111111-1111-4111-8111-111111111111';
const v2 = '33333333-3333-4333-8333-333333333333';
const at = (h, m = 0) => (h * 60 + m) * 60;

test('without an ACTIVE calendar check-in keeps the legacy 08:00 cutoff', () => {
    const resolve = createCalendarResolver([]);
    assert.equal(resolve('2026-12-01'), null);
    assert.deepEqual(classifyCheckIn(null, at(8), at(8)), { late: false, outOfSchedule: false });
    assert.deepEqual(classifyCheckIn(null, at(8) + 1, at(8)), { late: true, outOfSchedule: false });
});

test('latest effectiveFrom <= date wins, and late uses that day shift start', () => {
    const resolve = createCalendarResolver([
        { schedule: schedule(v1, '2026-12-01'), events: [] },
        { schedule: schedule(v2, '2027-01-01', { startTime: '09:00', endTime: '18:00' }), events: [] },
    ]);
    assert.equal(resolve('2026-11-30'), null, 'before the first ACTIVE version stays legacy');
    const dec = resolve('2026-12-31');
    assert.equal(dec.scheduleVersionId, v1);
    assert.deepEqual(classifyCheckIn(dec, at(8, 30), at(8)), { late: true, outOfSchedule: false });
    const jan = resolve('2027-01-04');
    assert.equal(jan.scheduleVersionId, v2);
    assert.deepEqual(classifyCheckIn(jan, at(8, 30), at(8)), { late: false, outOfSchedule: false });
    assert.deepEqual(classifyCheckIn(jan, at(9, 1), at(8)), { late: true, outOfSchedule: false });
});

test('weekly off and holiday keep the raw check-in as outOfSchedule, never LATE', () => {
    const resolve = createCalendarResolver([{ schedule: schedule(v1, '2026-12-01'), events: [holiday(v1, '2026-12-02')] }]);
    const saturday = resolve('2026-12-05');
    assert.equal(saturday.dayType, 'WEEKLY_OFF');
    assert.deepEqual(classifyCheckIn(saturday, at(14), at(8)), { late: false, outOfSchedule: true });
    const holidayDay = resolve('2026-12-02');
    assert.equal(holidayDay.dayType, 'HOLIDAY');
    assert.deepEqual(classifyCheckIn(holidayDay, at(10), at(8)), { late: false, outOfSchedule: true });
});

test('activation rejects retroactive start, overlap with latest ACTIVE and blocking calendar issues', () => {
    const draft = schedule(v2, '2026-12-01', { status: 'DRAFT' });
    assert.throws(() => assertActivatable(draft, [], null, '2026-12-02'), { code: 'WORK_SCHEDULE_EFFECTIVE_FROM_TOO_EARLY' });
    assert.throws(() => assertActivatable(draft, [], '2026-12-01', '2026-11-24'), { code: 'WORK_SCHEDULE_EFFECTIVE_FROM_OVERLAP' });
    // Sunday holiday without its compensatory day is a DRAFT blocker.
    assert.throws(() => assertActivatable(draft, [holiday(v2, '2026-12-06')], null, '2026-11-24'), { code: 'WORK_SCHEDULE_CALENDAR_BLOCKED' });
    assert.doesNotThrow(() => assertActivatable(draft, [holiday(v2, '2026-12-02')], '2026-11-30', '2026-11-24'));
});

test('companyTomorrow uses Asia/Ho_Chi_Minh civil date', () => {
    assert.equal(companyTomorrow(new Date('2026-11-23T16:59:59.000Z')), '2026-11-24');
    assert.equal(companyTomorrow(new Date('2026-11-23T17:00:00.000Z')), '2026-11-25');
    assert.equal(companyTomorrow(new Date('2026-12-31T18:00:00.000Z')), '2027-01-02');
});
