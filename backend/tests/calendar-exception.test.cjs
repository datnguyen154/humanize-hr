const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeCalendar, buildCalendarPreview, calendarFingerprint } = require('../dist/modules/work-calendar/calendar-preview.engine');
const { parseException, parseExceptionListQuery, parsePreviewQuery, expectedRevision } = require('../dist/modules/work-calendar/calendar-exception.validation');
const { monthDates, isoWeekday } = require('../dist/modules/work-calendar/calendar-date');

const versionId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';
const schedule = (extra = {}) => ({ id: versionId, version: 1, revision: 1, status: 'DRAFT',
    effectiveFrom: '2020-01-01', timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5],
    startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }],
    createdBy: actorId, updatedBy: actorId, createdAt: '2026-10-22T00:00:00.000Z', updatedAt: '2026-10-22T00:00:00.000Z', ...extra });
const event = (id, payload) => ({ id, scheduleVersionId: versionId, payload, firstAffectedDate:
    payload.kind === 'SWAP' ? [payload.offDate, payload.workDate].sort()[0] : payload.date,
    createdBy: actorId, updatedBy: actorId, createdAt: '2026-10-22T00:00:00.000Z', updatedAt: '2026-10-22T00:00:00.000Z' });
const holiday = (id, date) => event(id, { kind: 'HOLIDAY', date, name: 'Lễ thử nghiệm', sourceReference: 'Căn cứ kiểm thử', reason: 'Kiểm thử' });
const comp = (id, date, sourceHolidayDate) => event(id, { kind: 'COMPENSATORY_OFF', date, sourceHolidayDate, reason: 'Kiểm thử' });
const swap = (id, offDate, workDate) => event(id, { kind: 'SWAP', offDate, workDate, reason: 'Kiểm thử' });
const day = (preview, date) => preview.days.find((d) => d.date === date);

test('date-only arithmetic handles leap centuries, years 0001/0099/9999, and ISO weekdays', () => {
    for (const [year, month, count] of [[2024,2,29],[2100,2,28],[2000,2,29],[1,1,31],[99,2,28],[9999,12,31]]) {
        const dates = monthDates(year, month);
        assert.equal(dates.length, count);
        assert.equal(dates[0], `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-01`);
    }
    assert.equal(isoWeekday('0001-01-01'), 1);
    assert.equal(isoWeekday('2026-11-01'), 7);
});

test('resolved demo preview sums minutes, preserves holidays on weekly off and does not calculate salary', () => {
    const preview = buildCalendarPreview(schedule(), [holiday('h', '2026-11-02')], 2026, 11);
    assert.equal(preview.summary.requiredWorkingDays, 20);
    assert.equal(preview.summary.requiredWorkingMinutes, 20 * 480);
    assert.equal(day(preview, '2026-11-02').requiredWorkingMinutes, 0);
    assert.equal(day(preview, '2026-11-02').shift, null);
    assert.equal(preview.validation.hasBlockingIssues, false);
    assert.equal(preview.mode, 'DRAFT_PROJECTION');
    for (const key of ['payableDays','standardDays','salaryStandardDays','canActivate','OT']) assert.equal(Object.hasOwn(preview,key), false);
});

test('consecutive weekend holidays crossing year reserve distinct targets, independent of input order', () => {
    const source = [holiday('h1','2022-12-31'), holiday('h2','2023-01-01'), holiday('h3','2023-01-02')];
    const analysis = analyzeCalendar(schedule(), source);
    assert.equal(analysis.targets.get('h1'), '2023-01-03');
    assert.equal(analysis.targets.get('h2'), '2023-01-04');
    const pending = buildCalendarPreview(schedule(), source, 2023, 1);
    assert.equal(day(pending, '2023-01-03').dayType, 'UNRESOLVED');
    assert.equal(day(pending, '2023-01-04').requiredWorkingMinutes, null);
    assert.equal(pending.summary.requiredWorkingDays, null);
    const completed = [...source, comp('c2','2023-01-04','2023-01-01'), comp('c1','2023-01-03','2022-12-31')];
    const preview = buildCalendarPreview(schedule(), completed, 2023, 1);
    assert.equal(preview.validation.hasBlockingIssues, false);
    assert.equal(preview.summary.isComplete, true);
    assert.equal(day(preview, '2023-01-03').dayType, 'COMPENSATORY_OFF');
    assert.deepEqual(buildCalendarPreview(schedule(), completed.reverse(), 2023, 1), preview);
    assert.equal(completed.length, 5, 'GET/engine must not append generated compensation records');
});

test('SWAP carries source shift across months/years and makes a Saturday a valid compensation candidate', () => {
    const s = schedule({ startTime: '09:00' });
    const events = [swap('s','2026-12-31','2027-01-02')];
    assert.equal(day(buildCalendarPreview(s, events, 2026, 12),'2026-12-31').dayType, 'SWAPPED_OFF');
    const moved = day(buildCalendarPreview(s, events, 2027, 1),'2027-01-02');
    assert.equal(moved.shift.startTime, '09:00');
    assert.equal(moved.requiredWorkingMinutes, 420);
    const pair = [holiday('h','2026-11-01'), holiday('m','2026-11-02'), holiday('t','2026-11-03'), holiday('w','2026-11-04'),
        swap('s','2026-11-05','2026-11-07'), holiday('f','2026-11-06')];
    assert.equal(analyzeCalendar(schedule(),pair).targets.get('h'), '2026-11-07');
});

test('base weekday edit invalidates both halves of SWAP without deleting or moving events', () => {
    const events = [swap('s','2026-12-31','2027-01-02')];
    const original = structuredClone(events);
    const s = schedule({ weekdays: [1,2,3,5] });
    for (const [year,month,date] of [[2026,12,'2026-12-31'],[2027,1,'2027-01-02']]) {
        const preview = buildCalendarPreview(s, events, year, month);
        assert.equal(day(preview,date).dayType,'UNRESOLVED');
        assert.equal(day(preview,date).requiredWorkingMinutes,null);
        assert.ok(preview.validation.issues.some((i) => i.code === 'SWAP_BASE_DAY_INVALID' && i.scope === 'DRAFT'));
        assert.equal(preview.summary.requiredWorkingDays,null);
    }
    assert.deepEqual(events, original);
});

test('isComplete only describes month coverage, while hasBlockingIssues checks the entire DRAFT', () => {
    const events = [swap('s','2026-12-31','2027-01-02')];
    const preview = buildCalendarPreview(schedule({ weekdays: [1,2,3,5] }), events, 2026, 11);
    assert.equal(preview.summary.isComplete,true);
    assert.equal(preview.validation.hasBlockingIssues,true);
    assert.ok(preview.validation.issues.every((i) => i.scope === 'DRAFT' && i.date.startsWith('2026-12')));
    const partial = buildCalendarPreview(schedule({ effectiveFrom: '2026-11-10' }), [], 2026, 11);
    assert.equal(partial.summary.missingScheduleDays,9);
    assert.equal(partial.summary.isComplete,false);
    assert.equal(partial.summary.requiredWorkingMinutes,null);
    assert.equal(partial.validation.hasBlockingIssues,false);
    assert.equal(day(partial,'2026-11-09').scheduleVersionId,null);
    assert.equal(day(partial,'2026-11-09').isBaseWeeklyOff,null);
});

test('base edits preserve invalid WORK_OVERRIDE and compensate dependencies with explicit issues/null', () => {
    const override = event('o',{ kind:'WORK_OVERRIDE', date:'2026-11-02', startTime:'09:00', endTime:'18:00', breaks:[{startTime:'12:00',endTime:'13:00'}],reason:'Kiểm thử' });
    const events = [holiday('h','2026-11-01'),comp('c','2026-11-02','2026-11-01')];
    const wrongSource = buildCalendarPreview(schedule({ weekdays:[1,2,3,4,5,7] }),events,2026,11);
    assert.equal(day(wrongSource,'2026-11-02').dayType,'UNRESOLVED');
    assert.ok(wrongSource.validation.issues.some((i) => i.code==='COMPENSATORY_SOURCE_INVALID'));
    const wrongOverride = buildCalendarPreview(schedule({ weekdays:[2,3,4,5] }),[override],2026,11);
    assert.equal(day(wrongOverride,'2026-11-02').dayType,'UNRESOLVED');
    const before = buildCalendarPreview(schedule({ effectiveFrom:'2026-11-03' }),events,2026,11);
    assert.ok(before.validation.issues.some((i) => i.code==='EXCEPTION_BEFORE_EFFECTIVE_FROM'));
    assert.equal(day(before,'2026-11-01').dayType,'NO_SCHEDULE');
});

test('wrong/duplicate compensation leaves actual and expected dates unresolved', () => {
    const events = [holiday('h','2026-11-01'),comp('c','2026-11-03','2026-11-01')];
    const preview = buildCalendarPreview(schedule(),events,2026,11);
    assert.equal(day(preview,'2026-11-02').dayType,'UNRESOLVED');
    assert.equal(day(preview,'2026-11-03').dayType,'UNRESOLVED');
    const duplicate = buildCalendarPreview(schedule(),[...events,comp('c2','2026-11-04','2026-11-01')],2026,11);
    assert.ok(duplicate.validation.issues.some((i) => i.code==='COMPENSATORY_SOURCE_DUPLICATED'));
});

test('overlap does not pick a winning event; both SWAP halves are unresolved', () => {
    const events = [swap('s','2026-11-06','2026-11-07'),holiday('h','2026-11-07')];
    const preview = buildCalendarPreview(schedule(),events,2026,11);
    for (const date of ['2026-11-06','2026-11-07']) assert.equal(day(preview,date).dayType,'UNRESOLVED');
    assert.ok(preview.validation.issues.some((i)=>i.code==='EXCEPTION_DATE_CONFLICT'));
});

test('compensation allocation stops safely at 9999 boundary or unresolved earlier candidate', () => {
    const end = holiday('h','9999-12-31');
    const s = schedule({ weekdays:[1],effectiveFrom:'9999-01-01' });
    assert.equal(analyzeCalendar(s,[end]).targets.get('h'),null);
    assert.ok(buildCalendarPreview(s,[end],9999,12).validation.issues.some((i)=>i.code==='COMPENSATORY_TARGET_UNRESOLVED'));
    const events = [holiday('h','2026-11-01'),swap('s','2026-11-02','2026-11-03')];
    assert.equal(analyzeCalendar(schedule(),events).targets.get('h'),null,'unknown earlier day must not be skipped as if confirmed off');
});

test('an unresolved earlier holiday allocation cannot silently reserve a later source target', () => {
    const events = [holiday('h1','2026-11-01'),holiday('h2','2026-11-08'),swap('s','2026-11-02','2026-11-03')];
    const analysis = analyzeCalendar(schedule(),events);
    assert.equal(analysis.targets.get('h1'),null);
    assert.equal(analysis.targets.get('h2'),null);
    assert.equal(analysis.issues.filter((i)=>i.code==='COMPENSATORY_TARGET_UNRESOLVED').length,2);
});

test('fingerprint is stable across ordering/month/timestamps, but covers revision and out-of-month events', () => {
    const s = schedule();
    const events = [holiday('h','2027-01-01'),swap('s','2026-11-06','2026-11-07')];
    const fingerprint = calendarFingerprint(s,events);
    assert.match(fingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.equal(calendarFingerprint({...s,updatedAt:'different'},events.map((e)=>({...e,updatedAt:'different'})).reverse()),fingerprint);
    assert.equal(buildCalendarPreview(s,events,2026,11).sourceFingerprint, buildCalendarPreview(s,events,2027,1).sourceFingerprint);
    assert.notEqual(calendarFingerprint({...s,revision:2},events),fingerprint);
    assert.notEqual(calendarFingerprint(s,[{...events[0],payload:{...events[0].payload,reason:'Khác'}},events[1]]),fingerprint);
});

const validHoliday = holiday('h','2026-11-02').payload;
for (const [label,input] of [
    ['null',null],['array',[]],['missing reason',{...validHoliday,reason:undefined}],['blank reason',{...validHoliday,reason:' '}],
    ['long name',{...validHoliday,name:'a'.repeat(201)}],['unknown field',{...validHoliday,paid:true}],
    ['wrong kind',{...validHoliday,kind:'OFF'}],['timestamp',{...validHoliday,date:'2026-11-02T00:00:00Z'}],
    ['invalid date',{...validHoliday,date:'2026-02-30'}],['year zero',{...validHoliday,date:'0000-01-01'}],
    ['missing branch field',{kind:'SWAP',offDate:'2026-11-02',reason:'x'}],
    ['invalid override break',{kind:'WORK_OVERRIDE',date:'2026-11-02',startTime:'08:00',endTime:'17:00',breaks:[{startTime:'07:00',endTime:'13:00'}],reason:'x'}],
    ['override two breaks',{kind:'WORK_OVERRIDE',date:'2026-11-02',startTime:'08:00',endTime:'17:00',breaks:[],reason:'x'}],
    ['override wrong time',{kind:'WORK_OVERRIDE',date:'2026-11-02',startTime:'8:00',endTime:'17:00',breaks:[{startTime:'12:00',endTime:'13:00'}],reason:'x'}],
]) test(`exception validation rejects ${label}`,()=>assert.throws(()=>parseException(input),{code:'VALIDATION_ERROR',statusCode:400}));

test('validation trims text, accepts ancient dates and validates every branch without adding labor rules',()=>{
    assert.equal(parseException({...validHoliday,name:'  Lễ  '}).name,'Lễ');
    assert.equal(parseException({...validHoliday,date:'0001-01-01'}).date,'0001-01-01');
    assert.equal(parseException(comp('c','2026-11-02','2026-11-01').payload).kind,'COMPENSATORY_OFF');
    assert.equal(parseException(swap('s','2026-11-06','2026-11-07').payload).kind,'SWAP');
    const longShift={kind:'WORK_OVERRIDE',date:'2026-11-02',startTime:'07:00',endTime:'20:00',breaks:[{startTime:'12:00',endTime:'13:00'}],reason:'x'};
    assert.equal(parseException(longShift).endTime,'20:00','S2B activation validator is out of scope');
});

for (const value of [undefined,null,'1',0,-1,1.2,2147483647]) test(`revision rejects ${String(value)}`,()=>assert.throws(()=>expectedRevision(value),{statusCode:400}));
for (const query of [{page:['1','2']},{limit:'101'},{kind:['HOLIDAY']},{kind:'OFF'},{fromDate:'2026-01-01'},
    {fromDate:'2026-02-02',toDate:'2026-01-01'},{fromDate:'2026-01-01',toDate:'2027-01-02'},{search:'x'},{page:{x:1}}]) {
    test(`list query rejects ${JSON.stringify(query)}`,()=>assert.throws(()=>parseExceptionListQuery(query),{statusCode:400}));
}
for (const query of [{},{versionId:'not-a-uuid',year:'2026',month:'1'},{versionId,year:['2026'],month:'1'},{versionId,year:'0000',month:'1'},
    {versionId,year:'26',month:'1'},{versionId,year:'2026',month:'13'},{versionId,year:'2026',month:'001'},
    {versionId,year:'2026',month:'1',page:'1'}]) {
    test(`preview query rejects ${JSON.stringify(query)}`,()=>assert.throws(()=>parsePreviewQuery(query),{statusCode:400}));
}
test('query parsers accept documented bounds',()=>{
    assert.equal(parseExceptionListQuery({fromDate:'2024-01-01',toDate:'2024-12-31'}).limit,10);
    assert.equal(parsePreviewQuery({versionId,year:'0099',month:'01'}).year,99);
    assert.equal(expectedRevision(2147483646),2147483646);
});

test('six real HTTP routes enforce ADMIN and preserve list/detail/mutation/preview envelopes',async(t)=>{
    const express=require('express');
    const jwt=require('jsonwebtoken');
    const {env}=require('../dist/config/env');
    const {calendarExceptionService:service}=require('../dist/modules/work-calendar/calendar-exception.service');
    const {workScheduleRoutes}=require('../dist/modules/work-calendar/work-schedule.routes');
    const result={exception:holiday('e','2026-11-02'),scheduleRevision:2};
    const list={data:[result.exception],meta:{page:1,limit:10,totalItems:1,totalPages:1,hasNextPage:false,hasPreviousPage:false},scheduleRevision:2};
    t.mock.method(service,'list',async()=>list);
    for(const method of ['getById','create','replace']) t.mock.method(service,method,async()=>result);
    t.mock.method(service,'remove',async()=>({removedExceptionId:'e',scheduleRevision:3}));
    t.mock.method(service,'preview',async()=>({mode:'DRAFT_PROJECTION'}));
    const app=express(); app.use(express.json()); app.use('/api/work-calendar',workScheduleRoutes);
    const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    t.after(()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())));
    const base=`http://127.0.0.1:${server.address().port}/api/work-calendar`;
    const token=(role)=>jwt.sign({userId:actorId,role},env.jwtAccessSecret,{expiresIn:'2m'});
    const collection=`/versions/${versionId}/exceptions`;
    for(const [method,path,expected] of [['GET',collection,list],['GET',`${collection}/e`,{data:result}],['POST',collection,{data:result}],
        ['PATCH',`${collection}/e`,{data:result}],['DELETE',`${collection}/e`,{data:{removedExceptionId:'e',scheduleRevision:3}}],
        ['GET',`/preview?versionId=${versionId}&year=2026&month=11`,{data:{mode:'DRAFT_PROJECTION'}}]]){
        for(const role of [null,'EMPLOYEE','ADMIN']){
            const response=await fetch(base+path,{method,headers:role?{Authorization:`Bearer ${token(role)}`}:{}});
            assert.equal(response.status,role===null?401:role==='EMPLOYEE'?403:method==='POST'?201:200);
            if(role==='ADMIN') assert.deepEqual(await response.json(),expected);
        }
    }
    const headers={Authorization:`Bearer ${token('ADMIN')}`};
    assert.equal((await fetch(base+collection+'/e?unknown=x',{headers})).status,400);
    // Activation lives in P1 and validates its own body before touching the database.
    assert.equal((await fetch(`${base}/versions/${versionId}/activate`,{method:'POST',headers})).status,400);
});
