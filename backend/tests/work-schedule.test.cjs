const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../dist/config/prisma');
const { workScheduleRepository: repository } = require('../dist/modules/work-calendar/work-schedule.repository');
const { workScheduleService: service } = require('../dist/modules/work-calendar/work-schedule.service');

const id = '11111111-1111-4111-8111-111111111111';
const actor = '22222222-2222-4222-8222-222222222222';
const body = () => ({ effectiveFrom: '2026-11-01', timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5],
    startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] });
const row = (extra = {}) => ({ id, version: 1, revision: 1, status: 'DRAFT',
    effectiveFrom: new Date('2026-11-01T00:00:00Z'), timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5],
    startMinute: 480, endMinute: 1020, breakStartMinute: 720, breakEndMinute: 780,
    createdBy: actor, updatedBy: actor, createdAt: new Date('2026-10-19T00:00:00Z'), updatedAt: new Date('2026-10-19T00:00:00Z'), ...extra });

function mockTransaction(t, tx = {}) {
    const original = prisma.$transaction;
    t.after(() => { prisma.$transaction = original; });
    prisma.$transaction = async (callback) => callback(tx);
}

for (const [label, patch] of [
    ['missing fields', { timezone: undefined }], ['wrong timezone', { timezone: 'Asia/Bangkok' }],
    ['invalid calendar date', { effectiveFrom: '2026-02-30' }], ['zero year', { effectiveFrom: '0000-01-01' }],
    ['timestamp instead of date', { effectiveFrom: '2026-11-01T00:00:00Z' }],
    ['duplicate weekdays', { weekdays: [1, 1] }], ['empty weekdays', { weekdays: [] }],
    ['invalid weekday', { weekdays: [0, 8] }], ['string weekday', { weekdays: ['1'] }],
    ['HH only', { startTime: '08' }], ['invalid minute', { startTime: '08:60' }],
    ['24:00', { endTime: '24:00' }], ['overnight shift', { startTime: '22:00', endTime: '06:00' }],
    ['no break', { breaks: [] }], ['two breaks', { breaks: [body().breaks[0], body().breaks[0]] }],
    ['break outside shift', { breaks: [{ startTime: '07:00', endTime: '08:00' }] }],
    ['empty break', { breaks: [{ startTime: '12:00', endTime: '12:00' }] }],
    ['zero post-break work', { breaks: [{ startTime: '12:00', endTime: '17:00' }] }],
    ['break unknown field', { breaks: [{ startTime: '12:00', endTime: '13:00', paid: true }] }],
    ['attempted activation', { status: 'ACTIVE' }], ['spoof actor', { createdBy: actor }],
]) {
    test(`create rejects ${label} before any database write`, async (t) => {
        const create = t.mock.method(repository, 'create', () => assert.fail('must not write'));
        await assert.rejects(service.create(actor, { ...body(), ...patch }), { code: 'VALIDATION_ERROR', statusCode: 400 });
        assert.equal(create.mock.callCount(), 0);
    });
}

test('create normalizes weekday order and atomically records server-owned DRAFT/audit', async (t) => {
    const tx = {};
    mockTransaction(t, tx);
    const create = t.mock.method(repository, 'create', async (data, db) => {
        assert.equal(db, tx);
        assert.deepEqual(data.weekdays, [1, 2, 3, 4, 5]);
        assert.equal(data.status, 'DRAFT');
        assert.equal(data.startMinute, 480);
        assert.equal(data.breakEndMinute, 780);
        return row();
    });
    const audit = t.mock.method(repository, 'audit', async (data, db) => {
        assert.equal(db, tx);
        assert.equal(data.action, 'CREATE');
        assert.equal(data.actorId, actor);
        assert.equal(data.after.effectiveFrom, '2026-11-01');
    });
    const result = await service.create(actor, { ...body(), weekdays: [5, 3, 1, 4, 2] });
    assert.equal(result.startTime, '08:00');
    assert.deepEqual(result.breaks, body().breaks);
    assert.equal(create.mock.callCount(), 1);
    assert.equal(audit.mock.callCount(), 1);
});

test('update merges fields but validates the resulting whole shift', async (t) => {
    mockTransaction(t);
    t.mock.method(repository, 'findById', async () => row());
    await assert.rejects(service.update(id, actor, { expectedRevision: 1, startTime: '14:00' }), { statusCode: 400 });
});

test('update uses CAS and keeps audit before/after', async (t) => {
    let current = row();
    mockTransaction(t);
    t.mock.method(repository, 'findById', async () => current);
    t.mock.method(repository, 'updateDraft', async (recordId, revision, data) => {
        assert.equal(recordId, id);
        assert.equal(revision, 1);
        assert.deepEqual(data.revision, { increment: 1 });
        current = row({ endMinute: 1050, revision: 2 });
        return { count: 1 };
    });
    const audit = t.mock.method(repository, 'audit', async (data) => {
        assert.equal(data.before.endTime, '17:00');
        assert.equal(data.after.endTime, '17:30');
    });
    const result = await service.update(id, actor, { expectedRevision: 1, endTime: '17:30' });
    assert.equal(result.revision, 2);
    assert.equal(audit.mock.callCount(), 1);
});

test('stale read and lost CAS both return 409 without audit', async (t) => {
    mockTransaction(t);
    t.mock.method(repository, 'findById', async () => row());
    t.mock.method(repository, 'updateDraft', async () => ({ count: 0 }));
    const audit = t.mock.method(repository, 'audit', () => assert.fail('must not audit failed update'));
    for (const expectedRevision of [1, 2]) {
        await assert.rejects(service.update(id, actor, { expectedRevision, endTime: '17:30' }), {
            code: 'WORK_SCHEDULE_REVISION_CONFLICT', statusCode: 409,
        });
    }
    assert.equal(audit.mock.callCount(), 0);
});

test('missing/non-draft records are never editable; invalid revisions/bodies fail', async (t) => {
    mockTransaction(t);
    const lookup = t.mock.method(repository, 'findById', async () => null);
    await assert.rejects(service.getById(id), { statusCode: 404 });
    await assert.rejects(service.update(id, actor, { expectedRevision: 1, endTime: '17:30' }), { statusCode: 404 });
    lookup.mock.mockImplementation(async () => row({ status: 'ACTIVE' }));
    await assert.rejects(service.getById(id), { code: 'WORK_SCHEDULE_NOT_DRAFT' });
    await assert.rejects(service.update(id, actor, { expectedRevision: 1, endTime: '17:30' }), { statusCode: 409 });
    lookup.mock.mockImplementation(async () => row());
    for (const input of [null, [], {}, { expectedRevision: 1 }, { expectedRevision: '1', endTime: '17:30' },
        { expectedRevision: 0, endTime: '17:30' }, { expectedRevision: 1, revision: 100 }, { expectedRevision: 1, endTime: null }]) {
        await assert.rejects(service.update(id, actor, input), { statusCode: 400 });
    }
    await assert.rejects(service.getById('invalid'), { statusCode: 404 });
});

test('list returns stable pagination and rejects ambiguous query parameters', async (t) => {
    t.mock.method(repository, 'list', async (skip, take) => {
        assert.equal(skip, 10);
        assert.equal(take, 10);
        return { data: [row()], totalItems: 11 };
    });
    const result = await service.list({ page: '2' });
    assert.equal(result.meta.totalPages, 2);
    assert.equal(result.meta.hasNextPage, false);
    assert.equal(result.data[0].status, 'DRAFT');
    for (const query of [{ page: ['1', '2'] }, { page: '1.5' }, { limit: '101' }, { status: 'ACTIVE' }]) {
        await assert.rejects(service.list(query), { statusCode: 400 });
    }
});

test('HTTP routes enforce ADMIN, return envelopes and expose no activate/delete capability', async (t) => {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const { env } = require('../dist/config/env');
    const { workScheduleRoutes } = require('../dist/modules/work-calendar/work-schedule.routes');
    t.mock.method(service, 'create', async () => ({ id, status: 'DRAFT' }));
    const app = express();
    app.use(express.json());
    app.use('/api/work-calendar', workScheduleRoutes);
    const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const url = `http://127.0.0.1:${server.address().port}/api/work-calendar/versions`;
    const token = (role) => jwt.sign({ userId: actor, role }, env.jwtAccessSecret, { expiresIn: '1m' });
    for (const [method, suffix] of [['GET', ''], ['GET', `/${id}`], ['POST', ''], ['PATCH', `/${id}`]]) {
        const request = (bearer) => fetch(`${url}${suffix}`, { method, headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });
        assert.equal((await request()).status, 401);
        assert.equal((await request(token('EMPLOYEE'))).status, 403);
    }
    const headers = { Authorization: `Bearer ${token('ADMIN')}`, 'Content-Type': 'application/json' };
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body()) });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { data: { id, status: 'DRAFT' } });
    assert.equal((await fetch(`${url}/${id}/activate`, { method: 'POST', headers })).status, 404);
    assert.equal((await fetch(`${url}/${id}`, { method: 'DELETE', headers })).status, 404);
});
