const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getAdminDashboardPeriod, buildAdminAttendanceTrend, adminDashboardService } = require('../dist/modules/dashboard/admin-dashboard.service');
const { adminDashboardRepository } = require('../dist/modules/dashboard/admin-dashboard.repository');

test('period uses company midnight and includes today', () => {
    const period = getAdminDashboardPeriod('7', new Date('2026-10-02T17:00:00Z'));
    assert.equal(period.today.toISOString(), '2026-10-03T00:00:00.000Z');
    assert.equal(period.fromDate.toISOString(), '2026-09-27T00:00:00.000Z');
    assert.equal(getAdminDashboardPeriod(undefined, new Date()).days, 7);
});

test('unsupported periods are rejected', () => {
    for (const value of ['0', '8', '-1', 'abc', ['7'], {}]) {
        assert.throws(() => getAdminDashboardPeriod(value, new Date()), /days must be/);
    }
});

test('trend aggregates more than ten records and fills missing dates across years', () => {
    const trend = buildAdminAttendanceTrend([
        { attendanceDate: new Date('2027-01-01'), status: 'PRESENT', _count: { _all: 28 } },
        { attendanceDate: new Date('2027-01-01'), status: 'LATE', _count: { _all: 3 } },
    ], new Date('2026-12-31'), 3);
    assert.deepEqual(trend, [
        { date: '2026-12-31', total: 0, present: 0, late: 0 },
        { date: '2027-01-01', total: 31, present: 28, late: 3 },
        { date: '2027-01-02', total: 0, present: 0, late: 0 },
    ]);
});

test('snapshot separates today KPI from history and merges latest ten activities', async (t) => {
    const departments = Array.from({ length: 10 }, (_, index) => ({
        id: String(index), name: 'Engineering', createdAt: new Date(Date.UTC(2026, 8, 20 - index)),
    }));
    t.mock.method(adminDashboardRepository, 'getSnapshot', async (from, to, limit) => {
        assert.equal(limit, 10);
        assert.equal(to.toISOString().slice(0, 10), '2026-10-03');
        assert.equal(from.toISOString().slice(0, 10), '2026-09-27');
        return [50, 10, 25, [
            { attendanceDate: new Date('2026-10-02'), status: 'PRESENT', _count: { _all: 40 } },
            { attendanceDate: new Date('2026-10-03'), status: 'LATE', _count: { _all: 2 } },
        ], [{ id: 'a', employee: { fullName: 'An' }, createdAt: new Date('2026-10-03') }], [], departments];
    });
    const result = await adminDashboardService.getDashboard('7', new Date('2026-10-03T08:00:00Z'));
    assert.equal(result.summary.todayAttendance, 2);
    assert.equal(result.summary.totalEmployees, 50);
    assert.equal(result.attendanceTrend.length, 7);
    assert.equal(result.recentActivities.length, 10);
    assert.equal(result.recentActivities[0].id, 'attendance-a');
    assert.equal(result.recentActivities[1].type, 'department');
});

test('empty snapshot returns real zero counts and a complete empty period', async (t) => {
    t.mock.method(adminDashboardRepository, 'getSnapshot', async () => [0, 0, 0, [], [], [], []]);
    const result = await adminDashboardService.getDashboard('30', new Date('2026-10-03T08:00:00Z'));
    assert.equal(result.attendanceTrend.length, 30);
    assert.ok(result.attendanceTrend.every((point) => point.total === 0));
    assert.equal(result.summary.todayAttendance, 0);
    assert.deepEqual(result.recentActivities, []);
});

test('database failure propagates instead of returning false zero counts', async (t) => {
    t.mock.method(adminDashboardRepository, 'getSnapshot', async () => { throw new Error('Database unavailable'); });
    await assert.rejects(adminDashboardService.getDashboard('7'), /Database unavailable/);
});
