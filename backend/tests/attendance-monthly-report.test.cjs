const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { prisma } = require('../dist/config/prisma');
const { attendanceRepository } = require('../dist/modules/attendance/attendance.repository');
const { attendanceReportService, parseAttendanceReportPeriod } = require('../dist/modules/attendance/attendance-report.service');
const { generateAttendanceReportExcel } = require('../dist/modules/attendance/attendance-report-excel.generator');

const employee = { employeeId: 'a', employeeCode: 'EMP001', fullName: 'An', present: 110, late: 12, totalRecords: 122, missingCheckOut: 4 };

test('period rejects missing, malformed and repeated query values', () => {
    for (const year of [undefined, '', '2026abc', '-1', '0', '10000', ['2026'], {}]) {
        assert.throws(() => parseAttendanceReportPeriod(year, '2'), /Invalid year/);
    }
    for (const month of [undefined, '', '0', '13', '2.5', '1e1', ['2'], {}]) {
        assert.throws(() => parseAttendanceReportPeriod('2026', month), /Invalid month/);
    }
    assert.deepEqual(parseAttendanceReportPeriod('2026', '02'), { year: 2026, month: 2 });
});

test('monthly boundaries are UTC calendar dates with exclusive next month, including leap/year rollover', async (t) => {
    let expected;
    t.mock.method(attendanceRepository, 'getMonthlyReportRows', async (from, to) => {
        assert.deepEqual([from.toISOString(), to.toISOString()], expected);
        return [];
    });
    for (const [year, month, from, to] of [
        [2024, 2, '2024-02-01', '2024-03-01'],
        [2026, 12, '2026-12-01', '2027-01-01'],
        [99, 12, '0099-12-01', '0100-01-01'],
    ]) {
        expected = [from, to].map((date) => `${date}T00:00:00.000Z`);
        const report = await attendanceReportService.getMonthlyReport({ year, month });
        assert.equal(report.totals.totalRecords, 0);
    }
});

test('repository aggregates complete period without skip/take and keeps a consistent snapshot', async (t) => {
    let groupCalls = 0;
    const originalTransaction = prisma.$transaction;
    t.after(() => { prisma.$transaction = originalTransaction; });
    prisma.$transaction = async (callback, options) => {
        assert.equal(options.isolationLevel, 'RepeatableRead');
        return callback({
            attendance: { groupBy: async (query) => {
                assert.equal(query.skip, undefined);
                assert.equal(query.take, undefined);
                assert.deepEqual(query.where.attendanceDate, { gte: new Date('2026-02-01'), lt: new Date('2026-03-01') });
                groupCalls++;
                if (query.where.checkOutTime === null) return [{ employeeId: 'a', _count: { _all: 4 } }];
                return [
                    { employeeId: 'a', status: 'PRESENT', _count: { _all: 110 } },
                    { employeeId: 'a', status: 'LATE', _count: { _all: 12 } },
                    { employeeId: 'b', status: 'LATE', _count: { _all: 3 } },
                ];
            } },
            employee: { findMany: async (query) => {
                assert.deepEqual(query.where.id.in, ['a', 'b']);
                return [{ id: 'a', employeeCode: 'EMP001', fullName: 'An' }, { id: 'b', employeeCode: 'EMP002', fullName: 'Binh' }];
            } },
        });
    };
    const rows = await attendanceRepository.getMonthlyReportRows(new Date('2026-02-01'), new Date('2026-03-01'));
    assert.equal(groupCalls, 2);
    assert.deepEqual(rows[0], employee);
    assert.deepEqual(rows[1], { employeeId: 'b', employeeCode: 'EMP002', fullName: 'Binh', present: 0, late: 3, totalRecords: 3, missingCheckOut: 0 });
});

test('summary counts full data and exports a real workbook with numeric cells and literal names', async (t) => {
    t.mock.method(attendanceRepository, 'getMonthlyReportRows', async () => [employee, { ...employee, employeeId: 'b', fullName: '=SUM(A1)', employeeCode: '@EMP002' }]);
    const report = await attendanceReportService.getMonthlyReport({ year: 2026, month: 2 });
    assert.deepEqual(report.totals, { totalEmployees: 2, totalRecords: 244, present: 220, late: 24, missingCheckOut: 8 });
    const result = await attendanceReportService.exportMonthlyReport(report.period);
    assert.equal(result.filename, 'attendance-2026-02.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer);
    const sheet = workbook.worksheets[0];
    assert.equal(sheet.rowCount, 3);
    assert.equal(sheet.getCell('A2').value, '02/2026');
    assert.equal(sheet.getCell('D2').value, 122);
    assert.equal(sheet.getCell('G2').value, 4);
    assert.equal(sheet.getCell('B3').value, "'@EMP002");
    assert.equal(sheet.getCell('C3').value, "'=SUM(A1)");
});

test('empty month has real zero totals and valid empty workbook', async (t) => {
    t.mock.method(attendanceRepository, 'getMonthlyReportRows', async () => []);
    const report = await attendanceReportService.getMonthlyReport({ year: 2026, month: 2 });
    assert.deepEqual(report.totals, { totalEmployees: 0, totalRecords: 0, present: 0, late: 0, missingCheckOut: 0 });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await generateAttendanceReportExcel(report));
    assert.equal(workbook.worksheets[0].rowCount, 1);
});

test('database error propagates instead of returning false zeros or a successful export', async (t) => {
    t.mock.method(attendanceRepository, 'getMonthlyReportRows', async () => { throw new Error('Database unavailable'); });
    await assert.rejects(attendanceReportService.getMonthlyReport({ year: 2026, month: 2 }), /Database unavailable/);
    await assert.rejects(attendanceReportService.exportMonthlyReport({ year: 2026, month: 2 }), /Database unavailable/);
});

test('HTTP routes enforce ADMIN authorization, period validation and Excel response contract', async (t) => {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const { env } = require('../dist/config/env');
    const { attendanceRoutes } = require('../dist/modules/attendance/attendance.routes');
    const originalSecret = env.jwtAccessSecret;
    env.jwtAccessSecret = require('node:crypto').randomBytes(32).toString('hex');
    t.after(() => { env.jwtAccessSecret = originalSecret; });
    t.mock.method(attendanceRepository, 'getMonthlyReportRows', async () => [employee]);
    const app = express();
    app.use('/api/attendance', attendanceRoutes);
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const base = `http://127.0.0.1:${server.address().port}/api/attendance/monthly-report`;
    const headers = (role) => ({ Authorization: `Bearer ${jwt.sign({ userId: 'test-user', role }, env.jwtAccessSecret, { expiresIn: '1m' })}` });
    for (const path of ['', '/export']) {
        assert.equal((await fetch(`${base}${path}?year=2026&month=2`)).status, 401);
        assert.equal((await fetch(`${base}${path}?year=2026&month=2`, { headers: headers('EMPLOYEE') })).status, 403);
        assert.equal((await fetch(`${base}${path}?year=2026&month=13`, { headers: headers('ADMIN') })).status, 400);
    }
    const response = await fetch(`${base}?year=2026&month=2`, { headers: headers('ADMIN') });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.totals.totalRecords, 122);
    const excel = await fetch(`${base}/export?year=2026&month=2`, { headers: headers('ADMIN') });
    assert.equal(excel.status, 200);
    assert.match(excel.headers.get('content-type'), /spreadsheetml/);
    assert.equal(excel.headers.get('content-disposition'), 'attachment; filename="attendance-2026-02.xlsx"');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await excel.arrayBuffer()));
    assert.equal(workbook.worksheets[0].getCell('D2').value, 122);
});
