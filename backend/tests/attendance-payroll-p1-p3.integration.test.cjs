const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
require('dotenv').config();

test('P1–P3 real PostgreSQL + HTTP: activate, calendar-aware check-in, timesheet, payroll from timesheet', {
    skip: process.env.HRM_P3_DB_TEST !== '1', timeout: 120000,
}, async (t) => {
    const { PrismaClient } = require('@prisma/client');
    const baseUrl = new URL(process.env.DATABASE_URL);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname), 'integration test requires localhost database');
    const schema = `hrm_p3_test_${randomUUID().replaceAll('-', '')}`;
    assert.match(schema, /^hrm_p3_test_[a-f0-9]{32}$/);
    const adminDb = new PrismaClient({ datasourceUrl: baseUrl.toString() });
    let prisma;
    let server;
    await adminDb.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    t.after(async () => {
        if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        if (prisma) await prisma.$disconnect();
        // Only the uniquely named schema created by this test may be removed.
        await adminDb.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
        await adminDb.$disconnect();
    });
    baseUrl.searchParams.set('schema', schema);
    process.env.DATABASE_URL = baseUrl.toString();
    process.env.DIRECT_URL = baseUrl.toString();
    const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
        cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 30000,
    });
    assert.equal(migration.status, 0, 'migrations must apply to the isolated test schema');
    prisma = require('../dist/config/prisma').prisma;
    const jwt = require('jsonwebtoken');
    const { env } = require('../dist/config/env');
    const { companyTomorrow } = require('../dist/modules/work-calendar/work-schedule-activation.service');
    const { classifyCheckIn, createCalendarResolver, loadActiveCalendars } = require('../dist/modules/work-calendar/effective-calendar');
    const { getCompanyDateContext } = require('../dist/modules/attendance/attendance.service');
    const app = require('../dist/app').default;
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const api = `http://127.0.0.1:${server.address().port}/api`;

    const admin = await prisma.user.create({ data: { email: `admin-${schema}@example.invalid`, passwordHash: 'x', fullName: 'P3 admin', role: 'ADMIN' } });
    const staffUser = await prisma.user.create({ data: { email: `staff-${schema}@example.invalid`, passwordHash: 'x', fullName: 'P3 staff', role: 'EMPLOYEE' } });
    const employee = await prisma.employee.create({ data: { userId: staffUser.id, employeeCode: 'P3-001', fullName: 'Nhân viên kiểm thử',
        email: `staff-${schema}@example.invalid`, phone: '0900000000', gender: 'OTHER', dateOfBirth: new Date('1999-01-01'),
        position: 'Kiểm thử', joinedAt: new Date('2025-01-01') } });
    const token = (user) => jwt.sign({ userId: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: '2m' });
    const call = async (user, path, method = 'GET', body) => {
        const response = await fetch(`${api}${path}`, { method, headers: { Authorization: `Bearer ${token(user)}`, 'Content-Type': 'application/json' },
            ...(body ? { body: JSON.stringify(body) } : {}) });
        return { status: response.status, body: await response.json() };
    };
    const config = { timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] };

    // P1 — activation through HTTP: one winner, overlap rejected, audit written.
    const tomorrow = companyTomorrow();
    const draftA = (await call(admin, '/work-calendar/versions', 'POST', { ...config, effectiveFrom: tomorrow })).body.data;
    const draftB = (await call(admin, '/work-calendar/versions', 'POST', { ...config, effectiveFrom: tomorrow })).body.data;
    const activated = await call(admin, `/work-calendar/versions/${draftA.id}/activate`, 'POST', { expectedRevision: draftA.revision });
    assert.equal(activated.status, 200);
    assert.equal(activated.body.data.status, 'ACTIVE');
    const overlap = await call(admin, `/work-calendar/versions/${draftB.id}/activate`, 'POST', { expectedRevision: draftB.revision });
    assert.equal(overlap.status, 409);
    assert.equal(overlap.body.code, 'WORK_SCHEDULE_EFFECTIVE_FROM_OVERLAP');
    assert.equal((await call(admin, `/work-calendar/versions/${draftA.id}`, 'PATCH', { expectedRevision: 2, endTime: '18:00' })).status, 409, 'ACTIVE is immutable');
    assert.equal((await call(admin, '/work-calendar/versions?status=ACTIVE')).body.meta.totalItems, 1);
    assert.equal(await prisma.workScheduleAudit.count({ where: { scheduleVersionId: draftA.id, action: 'ACTIVATE' } }), 1);

    // A past ACTIVE calendar (seeded directly: activation itself forbids retroactive dates) drives October and today.
    await prisma.workScheduleVersion.create({ data: { status: 'ACTIVE', effectiveFrom: new Date('2026-10-01'), timezone: 'Asia/Ho_Chi_Minh',
        weekdays: [1, 2, 3, 4, 5], startMinute: 480, endMinute: 1020, breakStartMinute: 720, breakEndMinute: 780, createdBy: admin.id, updatedBy: admin.id } });

    // Check-in today is classified by the calendar covering today.
    const checkIn = await call(staffUser, '/attendance/check-in', 'POST');
    assert.equal(checkIn.status, 200);
    const record = checkIn.body.data;
    const context = getCompanyDateContext(new Date(record.checkInTime));
    const expected = classifyCheckIn(createCalendarResolver(await loadActiveCalendars())(context.attendanceDate.toISOString().slice(0, 10)),
        context.secondsSinceMidnight, 8 * 3600);
    assert.equal(record.outOfSchedule, expected.outOfSchedule);
    assert.equal(record.status, expected.late ? 'LATE' : 'PRESENT');

    // P2 — October 2026 timesheet from real rows.
    const punch = (date, status, outOfSchedule = false) => prisma.attendance.create({ data: { employeeId: employee.id, attendanceDate: new Date(`${date}T00:00:00.000Z`),
        checkInTime: new Date(`${date}T01:00:00.000Z`), checkOutTime: new Date(`${date}T10:00:00.000Z`), status, outOfSchedule } });
    await punch('2026-10-01', 'PRESENT');
    await punch('2026-10-02', 'PRESENT');
    await punch('2026-10-05', 'LATE');
    await punch('2026-10-06', 'PRESENT');
    await punch('2026-10-10', 'PRESENT', true); // Saturday
    for (const [leaveType, date, status] of [['ANNUAL', '2026-10-12', 'APPROVED'], ['SICK', '2026-10-13', 'APPROVED'], ['ANNUAL', '2026-10-14', 'PENDING']]) {
        await prisma.leaveRequest.create({ data: { employeeId: employee.id, leaveType, startDate: new Date(date), endDate: new Date(date), reason: 'Kiểm thử', status } });
    }
    const company = await call(admin, '/attendance/timesheet?year=2026&month=10');
    assert.equal(company.status, 200);
    assert.equal(company.body.data.standardDays, 22, 'October 2026 has 22 weekdays');
    const row = company.body.data.employees.find((e) => e.employee.id === employee.id);
    assert.deepEqual(row.summary, { requiredDays: 22, presentDays: 4, lateDays: 1, paidLeaveDays: 1, unpaidLeaveDays: 1, absentDays: 16,
        upcomingDays: 0, outOfScheduleDays: 1, missingCheckOutDays: 0, noScheduleDays: 0, payableDays: 5 });
    const mine = await call(staffUser, '/attendance/timesheet/me?year=2026&month=10');
    assert.deepEqual(mine.body.data.summary, row.summary);
    assert.equal(mine.body.data.days.find((d) => d.date === '2026-10-14').status, 'ABSENT', 'PENDING leave is not counted');
    assert.equal((await call(staffUser, '/attendance/timesheet?year=2026&month=10')).status, 403);
    assert.equal((await call(admin, '/attendance/timesheet/me?year=2026&month=10')).status, 403);

    // P3 — payroll from the timesheet: 22,000,000 × 5 / 22 = 5,000,000.
    const body = { employeeId: employee.id, year: 2026, month: 10, monthlySalary: '22000000', bonus: '300000', deduction: '100000' };
    const created = await call(admin, '/payrolls/from-timesheet', 'POST', body);
    assert.equal(created.status, 201);
    assert.equal(Number(created.body.data.baseSalary), 5000000);
    assert.equal(Number(created.body.data.netSalary), 5200000);
    assert.equal(created.body.data.payableDays, 5);
    assert.equal(created.body.data.standardDays, 22);
    assert.equal((await call(admin, '/payrolls/from-timesheet', 'POST', body)).status, 409, 'one payroll per employee and month');
    const nextMonth = Number(tomorrow.slice(5, 7));
    const open = await call(admin, '/payrolls/from-timesheet', 'POST', { ...body, year: Number(tomorrow.slice(0, 4)), month: nextMonth });
    assert.equal(open.status, 409, 'current month cannot be paid yet');
    const edited = await call(admin, `/payrolls/${created.body.data.id}`, 'PATCH', { monthlySalary: '44000000' });
    assert.equal(Number(edited.body.data.baseSalary), 10000000);
    assert.equal((await call(admin, `/payrolls/${created.body.data.id}/publish`, 'PATCH')).status, 200);
    assert.equal((await call(admin, `/payrolls/${created.body.data.id}`, 'PATCH', { bonus: '1' })).status, 400, 'PUBLISHED payroll is locked');
    t.diagnostic('Activation, calendar-aware check-in, timesheet (admin/self) and payroll-from-timesheet verified over HTTP on PostgreSQL.');
});
