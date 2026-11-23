const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { proratedBaseSalary, isPeriodClosed } = require('../dist/modules/payroll/payroll-proration');
const { payrollService } = require('../dist/modules/payroll/payroll.service');
const { payrollRepository } = require('../dist/modules/payroll/payroll.repository');
const { timesheetService } = require('../dist/modules/attendance/timesheet.service');

const D = (v) => new Prisma.Decimal(v);
const employeeId = '44444444-4444-4444-8444-444444444444';
const input = { employeeId, month: 10, year: 2026, monthlySalary: '15000000', bonus: '500000', deduction: '200000' };
const sheet = (payableDays, standardDays = 22) => ({ standardDays, summary: { payableDays } });

test('proration rounds half-up to whole VND and never divides by zero', () => {
    assert.equal(proratedBaseSalary(D('15000000'), 22, 22).toString(), '15000000');
    assert.equal(proratedBaseSalary(D('15000000'), 19, 22).toString(), '12954545'); // 12954545.45
    assert.equal(proratedBaseSalary(D('10000000'), 1, 6).toString(), '1666667'); // 1666666.67
    assert.equal(proratedBaseSalary(D('10000000'), 0, 0).toString(), '0');
});

test('a period closes only after its last civil day, across year end', () => {
    assert.equal(isPeriodClosed(2026, 11, '2026-11-30'), false);
    assert.equal(isPeriodClosed(2026, 11, '2026-12-01'), true);
    assert.equal(isPeriodClosed(2026, 12, '2026-12-31'), false);
    assert.equal(isPeriodClosed(2026, 12, '2027-01-01'), true);
    assert.equal(isPeriodClosed(9999, 12, '2026-11-23'), false);
});

test('creates a DRAFT payroll whose base salary comes from the timesheet snapshot', async (t) => {
    t.mock.method(payrollRepository, 'findPayrollByEmployeeMonthYear', async () => null);
    t.mock.method(timesheetService, 'getEmployeeTimesheet', async () => sheet(19));
    const created = t.mock.method(payrollRepository, 'createPayroll', async (data) => ({ id: 'p1', status: 'DRAFT', ...data }));
    const result = await payrollService.createPayrollFromTimesheet(input);
    const data = created.mock.calls[0].arguments[0];
    assert.equal(data.baseSalary.toString(), '12954545');
    assert.equal(data.netSalary.toString(), '13254545');
    assert.equal(data.payableDays, 19);
    assert.equal(data.standardDays, 22);
    assert.equal(result.monthlySalary.toString(), '15000000');
});

test('rejects open periods, incomplete calendars, duplicates and zero salary before writing', async (t) => {
    const created = t.mock.method(payrollRepository, 'createPayroll', async () => assert.fail('must not write'));
    await assert.rejects(payrollService.createPayrollFromTimesheet({ ...input, month: 12, year: 9999 }), { statusCode: 409, message: /chưa kết thúc/ });
    await assert.rejects(payrollService.createPayrollFromTimesheet({ ...input, monthlySalary: '0' }), { statusCode: 400 });
    t.mock.method(payrollRepository, 'findPayrollByEmployeeMonthYear', async () => ({ id: 'existing' }));
    await assert.rejects(payrollService.createPayrollFromTimesheet(input), { statusCode: 409, message: /đã có bảng lương/ });
    payrollRepository.findPayrollByEmployeeMonthYear.mock.mockImplementation(async () => null);
    t.mock.method(timesheetService, 'getEmployeeTimesheet', async () => ({ standardDays: null, summary: { payableDays: 0 } }));
    await assert.rejects(payrollService.createPayrollFromTimesheet(input), { statusCode: 409, message: /ngày công chuẩn/ });
    assert.equal(created.mock.callCount(), 0);
});

test('timesheet payroll edits recompute from the monthly salary; manual payroll keeps base salary editing', async (t) => {
    const draft = { id: '55555555-5555-4555-8555-555555555555', status: 'DRAFT', baseSalary: D('12954545'), bonus: D('0'), deduction: D('0'),
        monthlySalary: D('15000000'), payableDays: 19, standardDays: 22 };
    const find = t.mock.method(payrollRepository, 'findPayrollById', async () => draft);
    const update = t.mock.method(payrollRepository, 'updatePayroll', async (id, data) => ({ ...draft, ...data }));
    await payrollService.updatePayroll(draft.id, { monthlySalary: '22000000' });
    assert.equal(update.mock.calls[0].arguments[1].baseSalary.toString(), '19000000');
    await assert.rejects(payrollService.updatePayroll(draft.id, { baseSalary: '1' }), { statusCode: 400 });
    find.mock.mockImplementation(async () => ({ ...draft, monthlySalary: null, payableDays: null, standardDays: null }));
    await assert.rejects(payrollService.updatePayroll(draft.id, { monthlySalary: '1' }), { statusCode: 400 });
    await payrollService.updatePayroll(draft.id, { baseSalary: '9000000' });
    assert.equal(update.mock.calls[1].arguments[1].baseSalary.toString(), '9000000');
});
