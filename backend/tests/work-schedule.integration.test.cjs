const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
require('dotenv').config();

test('S1 real PostgreSQL + HTTP: migration, CRUD, concurrent PATCH, audit rollback and isolated cleanup', {
    skip: process.env.HRM_S1_DB_TEST !== '1', timeout: 90000,
}, async (t) => {
    const { PrismaClient } = require('@prisma/client');
    const baseUrl = new URL(process.env.DATABASE_URL);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname), 'integration test requires localhost database');
    const schema = `hrm_s1_test_${randomUUID().replaceAll('-', '')}`;
    assert.match(schema, /^hrm_s1_test_[a-f0-9]{32}$/);
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
    const actor = await prisma.user.create({ data: { email: `s1-${schema}@example.invalid`, passwordHash: 'not-a-real-login', fullName: 'S1 test admin', role: 'ADMIN' } });
    const jwt = require('jsonwebtoken');
    const { env } = require('../dist/config/env');
    const app = require('../dist/app').default;
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api/work-calendar/versions`;
    const headers = { Authorization: `Bearer ${jwt.sign({ userId: actor.id, role: 'ADMIN' }, env.jwtAccessSecret, { expiresIn: '2m' })}`, 'Content-Type': 'application/json' };
    const call = async (suffix = '', method = 'GET', body) => {
        const response = await fetch(`${base}${suffix}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
        return { status: response.status, body: await response.json() };
    };
    const config = { effectiveFrom: '2026-11-01', timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5],
        startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] };
    const empty = await call();
    assert.deepEqual(empty.body.meta, { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    const created = await call('', 'POST', config);
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    assert.equal(created.body.data.revision, 1);
    assert.equal(created.body.data.effectiveFrom, config.effectiveFrom);
    assert.deepEqual((await call(`/${id}`)).body, created.body);
    const second = await call('', 'POST', config);
    assert.equal(second.status, 201, 'same effectiveFrom is allowed for independent drafts');
    assert.notEqual(created.body.data.version, second.body.data.version);
    const page = await call('?limit=1');
    assert.equal(page.body.meta.totalItems, 2);
    assert.equal(page.body.data[0].id, second.body.data.id);
    const invalid = await call(`/${id}`, 'PATCH', { expectedRevision: 1, startTime: '16:00' });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.code, 'VALIDATION_ERROR');
    const race = await Promise.all(['17:30', '18:00'].map((endTime) => call(`/${id}`, 'PATCH', { expectedRevision: 1, endTime })));
    assert.deepEqual(race.map((result) => result.status).sort(), [200, 409]);
    const conflict = race.find((result) => result.status === 409);
    assert.equal(conflict.body.code, 'WORK_SCHEDULE_REVISION_CONFLICT');
    const saved = (await call(`/${id}`)).body.data;
    assert.equal(saved.revision, 2);
    const audit = await prisma.workScheduleAudit.findMany({ where: { scheduleVersionId: id }, orderBy: { createdAt: 'asc' } });
    assert.equal(audit.length, 2);
    assert.equal(audit[0].action, 'CREATE');
    assert.equal(audit[1].before.revision, 1);
    assert.equal(audit[1].after.revision, 2);
    const { workScheduleService } = require('../dist/modules/work-calendar/work-schedule.service');
    await assert.rejects(workScheduleService.update(id, randomUUID(), { expectedRevision: 2, endTime: '19:00' }));
    assert.equal((await prisma.workScheduleVersion.findUnique({ where: { id } })).revision, 2, 'actor FK failure rolls back draft write');
    assert.equal(await prisma.workScheduleAudit.count({ where: { scheduleVersionId: id } }), 2);
    const { workScheduleRepository } = require('../dist/modules/work-calendar/work-schedule.repository');
    const auditFailure = t.mock.method(workScheduleRepository, 'audit', async () => { throw new Error('simulated audit write failure'); });
    await assert.rejects(workScheduleService.update(id, actor.id, { expectedRevision: 2, endTime: '19:00' }));
    assert.equal((await prisma.workScheduleVersion.findUnique({ where: { id } })).revision, 2, 'audit failure rolls back successful CAS');
    auditFailure.mock.restore();
    await prisma.workScheduleVersion.update({ where: { id }, data: { status: 'ACTIVE' } });
    assert.equal((await call(`/${id}`, 'PATCH', { expectedRevision: 2, endTime: '19:00' })).status, 409);
    assert.equal((await call()).body.meta.totalItems, 1, 'list only exposes DRAFT');
    assert.equal(await prisma.attendance.count(), 0);
    assert.equal(await prisma.payroll.count(), 0);
    assert.equal(await prisma.leaveRequest.count(), 0);
    t.diagnostic('Real HTTP GET/POST/PATCH, one winner in concurrent CAS, two audits, rollback and zero Attendance/Payroll writes verified.');
});
