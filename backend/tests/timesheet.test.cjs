const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildEmployeeTimesheet, standardDays, monthDates } = require('../dist/modules/attendance/timesheet.engine');
const { createCalendarResolver } = require('../dist/modules/work-calendar/effective-calendar');

const actor = '22222222-2222-4222-8222-222222222222';
const vid = '11111111-1111-4111-8111-111111111111';
const schedule = { id: vid, version: 1, revision: 1, status: 'ACTIVE', effectiveFrom: '2026-12-01', timezone: 'Asia/Ho_Chi_Minh',
    weekdays: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }],
    createdBy: actor, updatedBy: actor, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z' };
const holiday = { id: 'h1', scheduleVersionId: vid, firstAffectedDate: '2026-12-24', createdBy: actor, updatedBy: actor,
    createdAt: schedule.createdAt, updatedAt: schedule.updatedAt,
    payload: { kind: 'HOLIDAY', date: '2026-12-24', name: 'Nghỉ cuối năm', sourceReference: 'Nội bộ', reason: 'Kiểm thử', holidayPolicy: { category: 'COMPANY', isPaid: true } } };
const resolveDay = createCalendarResolver([{ schedule, events: [holiday] }]);
const dates = monthDates(2026, 12);
const punch = (status, checkOut = '2026-12-01T10:00:00.000Z', outOfSchedule = false) =>
    ({ status, outOfSchedule, checkInTime: '2026-12-01T01:00:00.000Z', checkOutTime: checkOut });
const run = (extra) => buildEmployeeTimesheet({ dates, today: '2027-01-05', joinedAt: '2020-01-01', resolveDay,
    attendance: new Map(), leaves: [], ...extra });

test('standard days follow the ACTIVE calendar and are null when part of the month has no calendar', () => {
    // December 2026: 23 weekdays, minus the 24/12 company holiday.
    assert.equal(standardDays(dates, resolveDay), 22);
    assert.equal(standardDays(monthDates(2026, 11), resolveDay), null);
});

test('payable = present/late + paid leave; SICK/UNPAID are unpaid; everything else absent', () => {
    const attendance = new Map([['2026-12-01', punch('PRESENT')], ['2026-12-02', punch('LATE')], ['2026-12-03', punch('PRESENT', null)]]);
    const leaves = [{ leaveType: 'ANNUAL', from: '2026-12-07', to: '2026-12-08' }, { leaveType: 'OTHER', from: '2026-12-09', to: '2026-12-09' },
        { leaveType: 'SICK', from: '2026-12-10', to: '2026-12-10' }, { leaveType: 'UNPAID', from: '2026-12-11', to: '2026-12-11' }];
    const { summary, days } = run({ attendance, leaves });
    assert.deepEqual(summary, { requiredDays: 22, presentDays: 3, lateDays: 1, paidLeaveDays: 3, unpaidLeaveDays: 2,
        absentDays: 14, upcomingDays: 0, outOfScheduleDays: 0, missingCheckOutDays: 1, noScheduleDays: 0, payableDays: 6 });
    assert.equal(days.find((d) => d.date === '2026-12-07').status, 'PAID_LEAVE');
    assert.equal(days.find((d) => d.date === '2026-12-10').status, 'UNPAID_LEAVE');
    assert.equal(days.find((d) => d.date === '2026-12-24').status, 'DAY_OFF');
    assert.equal(days.find((d) => d.date === '2026-12-03').missingCheckOut, true);
});

test('weekend and holiday punches are OUT_OF_SCHEDULE, never payable; a weekend leave is ignored', () => {
    const attendance = new Map([['2026-12-05', punch('PRESENT', null, true)], ['2026-12-24', punch('PRESENT', '2026-12-24T09:00:00.000Z', true)]]);
    const { summary, days } = run({ attendance, leaves: [{ leaveType: 'ANNUAL', from: '2026-12-12', to: '2026-12-13' }] });
    assert.equal(summary.outOfScheduleDays, 2);
    assert.equal(summary.payableDays, 0);
    assert.equal(summary.paidLeaveDays, 0);
    assert.equal(days.find((d) => d.date === '2026-12-05').status, 'OUT_OF_SCHEDULE');
});

test('mid-month joiner: days before joinedAt are not required; today onward is upcoming, not absent', () => {
    const { summary, days } = run({ joinedAt: '2026-12-15', today: '2026-12-21', attendance: new Map([['2026-12-15', punch('PRESENT')]]) });
    assert.equal(days.find((d) => d.date === '2026-12-14').status, 'NOT_EMPLOYED');
    // 15–31/12: 13 weekdays minus the 24/12 holiday.
    assert.equal(summary.requiredDays, 12);
    assert.equal(summary.presentDays, 1);
    assert.equal(summary.absentDays, 3, '16, 17, 18 are past working days without punches');
    assert.equal(summary.upcomingDays, 8);
});

test('days before the first ACTIVE calendar are NO_SCHEDULE and stay out of every count', () => {
    const { summary, days } = buildEmployeeTimesheet({ dates: monthDates(2026, 11), today: '2027-01-01', joinedAt: '2020-01-01',
        resolveDay, attendance: new Map([['2026-11-02', punch('LATE')]]), leaves: [] });
    assert.equal(summary.noScheduleDays, 30);
    assert.equal(summary.requiredDays, 0);
    assert.equal(summary.payableDays, 0);
    assert.equal(days[1].checkInTime, '2026-12-01T01:00:00.000Z', 'raw punch is still shown');
});
