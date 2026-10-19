const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../dist/config/prisma');
const { employeeRepository } = require('../dist/modules/employee/employee.repository');
const { attendanceAdjustmentRepository: repository } = require('../dist/modules/attendance/attendance-adjustment.repository');
const { attendanceAdjustmentService: service } = require('../dist/modules/attendance/attendance-adjustment.service');
const { notificationService } = require('../dist/modules/notification/notification.service');
const { notificationRepository } = require('../dist/modules/notification/notification.repository');

const id = '11111111-1111-4111-8111-111111111111';
const employee = { userId: 'employee-user', role: 'EMPLOYEE' };
const admin = { userId: 'admin-user', role: 'ADMIN' };
const day = new Date('2026-08-12T00:00:00.000Z');
const oldTime = new Date('2026-08-12T02:00:00.000Z');
const newTime = new Date('2026-08-12T01:30:00.000Z');
const version = new Date('2026-08-13T01:00:00.000Z');

test('employee creates a request tied to their own profile and attendance snapshot', async (t) => {
    const tx = {};
    const originalTransaction = prisma.$transaction;
    t.after(() => { prisma.$transaction = originalTransaction; });
    prisma.$transaction = async (callback) => callback(tx);
    const notify = t.mock.method(notificationService, 'createAttendanceAdjustmentCreatedNotifications', async (context, db) => {
        assert.equal(db, tx);
        assert.equal(context.id, id);
        assert.equal(context.employeeFullName, 'Nguyễn Văn An');
    });
    t.mock.method(employeeRepository, 'findEmployeeByUserId', async () => ({ id: 'employee-id' }));
    t.mock.method(repository, 'findAttendance', async () => ({ id: 'attendance-id', checkInTime: oldTime, checkOutTime: null, updatedAt: version }));
    t.mock.method(repository, 'create', async (data, db) => {
        assert.equal(db, tx);
        assert.equal(data.employeeId, 'employee-id');
        assert.equal(data.attendanceId, 'attendance-id');
        assert.equal(data.originalUpdatedAt, version);
        assert.equal(data.requestedCheckInTime.toISOString(), newTime.toISOString());
        return { id, ...data, employee: { fullName: 'Nguyễn Văn An' } };
    });
    const created = await service.create(employee, {
        attendanceDate: '2026-08-12', checkInTime: newTime.toISOString(),
        checkOutTime: null, reason: 'Sai giờ vào',
    });
    assert.equal(created.id, id);
    assert.equal(notify.mock.callCount(), 1);
    await assert.rejects(service.create(admin, { attendanceDate: '2026-08-12' }), { statusCode: 403 });
});

test('new adjustment notifies only active admins in a single batch with a detail entity', async () => {
    let notificationData;
    const tx = {
        user: { findMany: async (query) => {
            assert.deepEqual(query.where, { role: 'ADMIN', status: 'ACTIVE' });
            return [{ id: 'admin-1' }, { id: 'admin-2' }];
        } },
        notification: { createMany: async ({ data }) => { notificationData = data; return { count: data.length }; } },
    };
    await notificationService.createAttendanceAdjustmentCreatedNotifications({
        id, employeeFullName: 'Nguyễn Văn An', attendanceDate: day,
    }, tx);
    assert.deepEqual(notificationData.map((item) => item.userId), ['admin-1', 'admin-2']);
    for (const item of notificationData) {
        assert.equal(item.type, 'ATTENDANCE_ADJUSTMENT_CREATED');
        assert.equal(item.entityType, 'ATTENDANCE_ADJUSTMENT');
        assert.equal(item.entityId, id);
        assert.match(item.message, /Nguyễn Văn An.*12\/08\/2026/);
    }
});

test('notification failure propagates through the request transaction', async (t) => {
    const tx = {};
    const originalTransaction = prisma.$transaction;
    t.after(() => { prisma.$transaction = originalTransaction; });
    prisma.$transaction = async (callback) => callback(tx);
    t.mock.method(employeeRepository, 'findEmployeeByUserId', async () => ({ id: 'employee-id' }));
    t.mock.method(repository, 'findAttendance', async () => null);
    t.mock.method(repository, 'create', async (data) => ({ id, ...data, employee: { fullName: 'An' } }));
    t.mock.method(notificationRepository, 'findActiveAdminIds', async () => { throw new Error('Notification write failed'); });
    await assert.rejects(service.create(employee, {
        attendanceDate: '2026-08-12', checkInTime: newTime.toISOString(), reason: 'Quên chấm công',
    }), /Notification write failed/);
});

test('employee cannot submit an unchanged record, future day or invalid time range', async (t) => {
    t.mock.method(employeeRepository, 'findEmployeeByUserId', async () => ({ id: 'employee-id' }));
    t.mock.method(repository, 'findAttendance', async () => ({ id: 'attendance-id', checkInTime: oldTime, checkOutTime: null, updatedAt: version }));
    const base = { attendanceDate: '2026-08-12', checkInTime: oldTime.toISOString(), checkOutTime: null, reason: 'Sai giờ' };
    await assert.rejects(service.create(employee, base), { statusCode: 400, message: 'No changes requested' });
    await assert.rejects(service.create(employee, { ...base, attendanceDate: '2099-08-12' }), { statusCode: 400 });
    await assert.rejects(service.create(employee, { ...base, checkOutTime: newTime.toISOString() }), { statusCode: 400 });
});

test('list and detail are scoped to authenticated employee', async (t) => {
    t.mock.method(employeeRepository, 'findEmployeeByUserId', async () => ({ id: 'employee-id' }));
    t.mock.method(repository, 'findMany', async (params) => {
        assert.equal(params.employeeId, 'employee-id');
        assert.equal(params.search, undefined);
        return [];
    });
    t.mock.method(repository, 'count', async () => 0);
    t.mock.method(repository, 'findById', async () => ({ id, employeeId: 'someone-else' }));
    const list = await service.list(employee, { page: '1', limit: '10', search: 'secret' });
    assert.equal(list.meta.totalItems, 0);
    await assert.rejects(service.getById(id, employee), { statusCode: 404 });
});

function mockReviewTransaction(t, request, current, claimCount = 1) {
    t.mock.method(repository, 'findById', async () => request);
    t.mock.method(repository, 'findAttendance', async () => current);
    const calls = { attendanceUpdates: [], attendanceCreates: [], requestUpdates: [] };
    const tx = {
        attendanceAdjustmentRequest: {
            updateMany: async () => ({ count: claimCount }),
            update: async (query) => { calls.requestUpdates.push(query); return { ...request, ...query.data, status: calls.decision }; },
        },
        attendance: {
            updateMany: async (query) => { calls.attendanceUpdates.push(query); return { count: 1 }; },
            create: async (query) => { calls.attendanceCreates.push(query); return { id: 'created-attendance' }; },
        },
    };
    const original = prisma.$transaction;
    t.after(() => { prisma.$transaction = original; });
    prisma.$transaction = (callback) => callback(tx);
    return calls;
}

test('approve existing attendance updates it and recomputes PRESENT/LATE', async (t) => {
    const request = { id, employeeId: 'employee-id', attendanceId: 'attendance-id', attendanceDate: day,
        originalUpdatedAt: version, requestedCheckInTime: newTime, requestedCheckOutTime: null };
    const current = { id: 'attendance-id', updatedAt: version };
    const calls = mockReviewTransaction(t, request, current);
    await service.review(id, admin, { status: 'APPROVED', reviewNote: '' });
    assert.equal(calls.attendanceUpdates.length, 1);
    assert.equal(calls.attendanceUpdates[0].data.status, 'LATE');
    assert.equal(calls.requestUpdates[0].data.attendanceId, 'attendance-id');
});

test('approve a missing day creates attendance; rejection leaves attendance untouched', async (t) => {
    const request = { id, employeeId: 'employee-id', attendanceId: null, attendanceDate: day,
        originalUpdatedAt: null, requestedCheckInTime: new Date('2026-08-12T00:30:00.000Z'), requestedCheckOutTime: null };
    const calls = mockReviewTransaction(t, request, null);
    await service.review(id, admin, { status: 'APPROVED' });
    assert.equal(calls.attendanceCreates.length, 1);
    assert.equal(calls.attendanceCreates[0].data.status, 'PRESENT');
    assert.equal(calls.requestUpdates[0].data.attendanceId, 'created-attendance');
    await service.review(id, admin, { status: 'REJECTED', reviewNote: 'Không đủ chứng từ' });
    assert.equal(calls.attendanceCreates.length, 1);
    assert.equal(calls.attendanceUpdates.length, 0);
    await assert.rejects(service.review(id, admin, { status: 'REJECTED' }), { statusCode: 400 });
});

test('stale attendance returns conflict without writing attendance', async (t) => {
    const request = { id, employeeId: 'employee-id', attendanceId: 'attendance-id', attendanceDate: day,
        originalUpdatedAt: version, requestedCheckInTime: newTime, requestedCheckOutTime: null };
    const calls = mockReviewTransaction(t, request, { id: 'attendance-id', updatedAt: new Date('2026-08-14') });
    await assert.rejects(service.review(id, admin, { status: 'APPROVED' }), { statusCode: 409 });
    assert.equal(calls.attendanceUpdates.length, 0);
    assert.equal(calls.requestUpdates.length, 0);
});

test('an already reviewed request cannot be approved again', async (t) => {
    const request = { id, employeeId: 'employee-id', attendanceId: null, attendanceDate: day,
        originalUpdatedAt: null, requestedCheckInTime: newTime, requestedCheckOutTime: null };
    const calls = mockReviewTransaction(t, request, null, 0);
    await assert.rejects(service.review(id, admin, { status: 'APPROVED' }), {
        statusCode: 409, message: 'Attendance adjustment already reviewed',
    });
    assert.equal(calls.attendanceCreates.length, 0);
    assert.equal(calls.requestUpdates.length, 0);
});

test('HTTP routes enforce role boundaries before service calls', async (t) => {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const { env } = require('../dist/config/env');
    const { attendanceRoutes } = require('../dist/modules/attendance/attendance.routes');
    const originalSecret = env.jwtAccessSecret;
    env.jwtAccessSecret = require('node:crypto').randomBytes(32).toString('hex');
    t.after(() => { env.jwtAccessSecret = originalSecret; });
    const list = t.mock.method(service, 'list', async () => ({ data: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }));
    const create = t.mock.method(service, 'create', async () => ({ id }));
    const review = t.mock.method(service, 'review', async () => ({ id }));
    const app = express();
    app.use(express.json());
    app.use('/api/attendance', attendanceRoutes);
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const base = `http://127.0.0.1:${server.address().port}/api/attendance/adjustment-requests`;
    const headers = (role) => ({ Authorization: `Bearer ${jwt.sign({ userId: 'test-user', role }, env.jwtAccessSecret, { expiresIn: '1m' })}`, 'Content-Type': 'application/json' });
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base, { headers: headers('EMPLOYEE') })).status, 200);
    assert.equal(list.mock.callCount(), 1);
    assert.equal((await fetch(base, { method: 'POST', headers: headers('ADMIN'), body: '{}' })).status, 403);
    assert.equal(create.mock.callCount(), 0);
    assert.equal((await fetch(base, { method: 'POST', headers: headers('EMPLOYEE'), body: '{}' })).status, 201);
    assert.equal(create.mock.callCount(), 1);
    assert.equal((await fetch(`${base}/${id}/review`, { method: 'PATCH', headers: headers('EMPLOYEE'), body: '{}' })).status, 403);
    assert.equal(review.mock.callCount(), 0);
    assert.equal((await fetch(`${base}/${id}/review`, { method: 'PATCH', headers: headers('ADMIN'), body: '{}' })).status, 200);
    assert.equal(review.mock.callCount(), 1);
});
