const { test } = require('node:test');
const assert = require('node:assert/strict');
const { holidayPresetCatalog, findHolidayPreset } = require('../dist/modules/work-calendar/holiday-presets');
const { parseHolidayBatch, planHolidayBatch } = require('../dist/modules/work-calendar/calendar-holiday-batch.service');
const { parseException } = require('../dist/modules/work-calendar/calendar-exception.validation');
const { buildCalendarPreview } = require('../dist/modules/work-calendar/calendar-preview.engine');
const { validateEvent } = require('../dist/modules/work-calendar/calendar-exception.service');
const schedule = { id:'11111111-1111-4111-8111-111111111111', revision:1, status:'DRAFT', effectiveFrom:'2026-01-01',
    weekdays:[1,2,3,4,5], timezone:'Asia/Ho_Chi_Minh', startTime:'08:00', endTime:'17:00', breaks:[{startTime:'12:00',endTime:'13:00'}],
    updatedBy:'22222222-2222-4222-8222-222222222222', updatedAt:'2026-10-22T00:00:00.000Z' };
const preset = (code, year=2026, option) => holidayPresetCatalog(year).presets.find(p=>p.holidayCode===code && (!option || p.id.endsWith(':'+option)));
const holidays = p=>p.dates.map(date=>({kind:'HOLIDAY',date,name:p.name,reason:p.suggestedReason,sourceReference:p.sourceReference,holidayPolicy:{category:'STATUTORY',presetId:p.id}}));
const request = (h,extra={})=>parseHolidayBatch({expectedRevision:1,holidays:h,includeCompensatoryOff:true,...extra});
const event = (payload,id=payload.date)=>({id,payload,scheduleVersionId:schedule.id,firstAffectedDate:payload.date,createdBy:schedule.updatedBy,updatedBy:schedule.updatedBy,createdAt:schedule.updatedAt,updatedAt:schedule.updatedAt});

test('verified catalog separates statutory dates from weekends, compensation and alternative employer options',()=>{
    const catalog=holidayPresetCatalog(2026);
    assert.equal(catalog.requiresConfirmation,true);
    assert.equal(new Set(catalog.presets.map(p=>p.holidayCode)).size,6);
    assert.equal(catalog.presets.filter(p=>p.holidayCode==='TET').length,3);
    assert.deepEqual(preset('TET',2026,'1-4').dates,['2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20']);
    assert.deepEqual(preset('TET',2027,'2-3').dates,['2027-02-04','2027-02-05','2027-02-06','2027-02-07','2027-02-08']);
    assert.deepEqual(preset('HUNG_KINGS').dates,['2026-04-26']);
    assert.equal(holidayPresetCatalog(2027).unavailable.some(p=>p.holidayCode==='HUNG_KINGS'),true);
    assert.equal(holidayPresetCatalog(2028).presets.length,0);
    for(const p of catalog.presets) {
        assert.equal(findHolidayPreset(p.id),p);
        assert.ok(p.sourceUrls.every(url=>url.startsWith('https://')&&url.includes('chinhphu.vn')));
    }
});

test('HR-selected classified policy is strict; legacy HOLIDAY is not silently classified',()=>{
    const h=holidays(preset('NEW_YEAR'))[0];
    assert.deepEqual(parseException(h),h);
    assert.throws(()=>parseException({...h,date:'2026-01-02'}),{code:'VALIDATION_ERROR'});
    assert.throws(()=>parseException({...h,holidayPolicy:{category:'STATUTORY',presetId:'forged'}}),{code:'VALIDATION_ERROR'});
    assert.throws(()=>parseException({...h,holidayPolicy:{category:'COMPANY'}}),{code:'VALIDATION_ERROR'});
    assert.throws(()=>parseException({...h,holidayPolicy:{category:'COMPANY',isPaid:true,presetId:h.holidayPolicy.presetId}}),{code:'VALIDATION_ERROR'});
    const {holidayPolicy,...legacy}=h;
    const old=parseException(legacy);
    assert.equal(old.holidayPolicy,undefined);
    const day=buildCalendarPreview(schedule,[event(old)],2026,1).days[0];
    assert.equal(day.holidayCategory,'UNCLASSIFIED');
    assert.equal(day.holidayPayPolicy,'UNSPECIFIED');
});

test('company holidays do not generate statutory compensation; pay metadata does not calculate payroll',()=>{
    for(const isPaid of [true,false]) {
        const h={kind:'HOLIDAY',date:'2026-11-01',name:'Ngày nghỉ doanh nghiệp',reason:'HR xác nhận',sourceReference:'Quyết định nội bộ số 01',holidayPolicy:{category:'COMPANY',isPaid}};
        const plan=planHolidayBatch(schedule,[],request([h]));
        assert.equal(plan.toCreate.length,1);
        assert.equal(plan.validation.hasBlockingIssues,false);
        const d=plan.calendarDays[0];
        assert.equal(d.holidayCategory,'COMPANY');
        assert.equal(d.holidayPayPolicy,isPaid?'PAID':'UNPAID');
        assert.equal(d.isBaseWeeklyOff,true);
        assert.equal(d.requiredWorkingMinutes,0);
        assert.equal(Object.hasOwn(d,'payableDays'),false);
    }
});

test('2027 Tet preview has five statutory holidays and two distinct compensation days, never seven holidays',()=>{
    const h=holidays(preset('TET',2027,'2-3'));
    const plan=planHolidayBatch(schedule,[],request(h));
    assert.equal(plan.toCreate.filter(p=>p.kind==='HOLIDAY').length,5);
    assert.deepEqual(plan.toCreate.filter(p=>p.kind==='COMPENSATORY_OFF').map(p=>p.date),['2027-02-09','2027-02-10']);
    assert.equal(plan.validation.hasBlockingIssues,false);
    assert.deepEqual(plan.calendarDays.map(d=>d.dayType),['HOLIDAY','HOLIDAY','HOLIDAY','HOLIDAY','HOLIDAY','COMPENSATORY_OFF','COMPENSATORY_OFF']);
    assert.deepEqual(planHolidayBatch(schedule,[],request([...h].reverse())),plan);
    const without=planHolidayBatch(schedule,[],request(h,{includeCompensatoryOff:false}));
    assert.equal(without.toCreate.length,5);
    assert.equal(without.validation.hasBlockingIssues,true);
});

test('Hung Kings weekend remains a HOLIDAY, weekly rest is separate, next workday is COMPENSATORY_OFF',()=>{
    const plan=planHolidayBatch(schedule,[],request(holidays(preset('HUNG_KINGS'))));
    assert.deepEqual(plan.toCreate.map(p=>p.kind),['HOLIDAY','COMPENSATORY_OFF']);
    assert.deepEqual(plan.toCreate.map(p=>p.date),['2026-04-26','2026-04-27']);
    assert.equal(plan.calendarDays[0].isBaseWeeklyOff,true);
    assert.equal(plan.calendarDays[1].holidayPayPolicy,null,'weekly-rest compensation is not another statutory paid holiday');
});

test('existing identical holiday/compensation are skipped; conflicts never overwrite; plans change with source and input',()=>{
    const h=holidays(preset('HUNG_KINGS'));
    const first=planHolidayBatch(schedule,[],request(h));
    const events=first.toCreate.map(p=>event(p));
    const again=planHolidayBatch(schedule,events,request(h));
    assert.equal(again.toCreate.length,0);
    assert.equal(again.skipped.length,2);
    assert.throws(()=>planHolidayBatch(schedule,events,request([{...h[0],reason:'Nội dung khác'}])),{code:'WORK_CALENDAR_EXCEPTION_CONFLICT'});
    const conflict=event({...h[0],holidayPolicy:{category:'COMPANY',isPaid:true}});
    assert.throws(()=>planHolidayBatch(schedule,[conflict],request(h)),{code:'WORK_CALENDAR_EXCEPTION_CONFLICT'});
    assert.notEqual(first.planFingerprint,planHolidayBatch(schedule,[],request([{...h[0],reason:'Đã xác nhận khác'}])).planFingerprint);
    assert.throws(()=>planHolidayBatch({...schedule,revision:2},[],request(h)),{code:'WORK_SCHEDULE_REVISION_CONFLICT'});
});

test('alternative Tet/National Day plans cannot be combined, including through old single CRUD',()=>{
    for(const code of ['TET','NATIONAL_DAY']) {
        const alternatives=holidayPresetCatalog(2026).presets.filter(p=>p.holidayCode===code);
        const a=event(holidays(alternatives[0])[0]);
        const b=event(holidays(alternatives[1]).at(-1));
        assert.throws(()=>validateEvent(schedule,b,[a]),{code:'VALIDATION_ERROR'});
    }
});

for(const [label,body] of [
    ['empty',{holidays:[]}],['oversized',{holidays:Array(32).fill(holidays(preset('NEW_YEAR'))[0])}],
    ['duplicates',{holidays:[...holidays(preset('NEW_YEAR')),...holidays(preset('NEW_YEAR'))]}],
    ['unclassified',{holidays:[{...holidays(preset('NEW_YEAR'))[0],holidayPolicy:undefined}]}],
    ['implicit compensation',{includeCompensatoryOff:undefined}],['unknown field',{canActivate:true}],
]) test(`batch rejects ${label}`,()=>assert.throws(()=>request(holidays(preset('NEW_YEAR')),body),{code:'VALIDATION_ERROR'}));

test('batch POST requires preview fingerprint, validates cross-year intervals and draft effectiveFrom',()=>{
    assert.throws(()=>parseHolidayBatch({expectedRevision:1,holidays:holidays(preset('NEW_YEAR')),includeCompensatoryOff:true},true),{code:'VALIDATION_ERROR'});
    const policy={category:'COMPANY',isPaid:true};
    const h=['2026-12-31','2027-01-01'].map(date=>({kind:'HOLIDAY',date,name:'Nghỉ doanh nghiệp',sourceReference:'Quyết định nội bộ',reason:'Xác nhận',holidayPolicy:policy}));
    assert.equal(planHolidayBatch(schedule,[],request(h)).calendarDays.length,2);
    assert.throws(()=>planHolidayBatch({...schedule,effectiveFrom:'2026-02-01'},[],request(holidays(preset('NEW_YEAR')))),{code:'VALIDATION_ERROR'});
});

test('batch field validation points to the original row index, before date sorting',()=>{
    const h=holidays(preset('TET'));
    assert.throws(()=>request([h[4],{...h[0],date:'2026-02-30'}]),error=>error.details['holidays.1.date']!==undefined);
});

test('weekly rest and cross-year compensation are based on the actual schedule, not a hardcoded weekend',()=>{
    const h=holidays(preset('NEW_YEAR',2027));
    const fridayOff={...schedule,weekdays:[1,2,3,4]};
    const plan=planHolidayBatch(fridayOff,[],request(h));
    assert.deepEqual(plan.toCreate.map(p=>p.date),['2027-01-01','2027-01-04']);
    assert.deepEqual(plan.calendarDays.map(d=>d.dayType),['HOLIDAY','WEEKLY_OFF','WEEKLY_OFF','COMPENSATORY_OFF']);
    assert.equal(planHolidayBatch({...schedule,weekdays:[1,2,3,4,5,6,7]},[],request(h)).toCreate.length,1);
});

test('new HTTP routes enforce ADMIN, expose verified catalog and preserve envelope/strict query',async(t)=>{
    const express=require('express'),jwt=require('jsonwebtoken');
    const {env}=require('../dist/config/env');
    const {calendarHolidayBatchService:service}=require('../dist/modules/work-calendar/calendar-holiday-batch.service');
    const {workScheduleRoutes}=require('../dist/modules/work-calendar/work-schedule.routes');
    t.mock.method(service,'preview',async()=>({planFingerprint:'test',toCreate:[]}));
    t.mock.method(service,'create',async()=>({created:[],skipped:[],scheduleRevision:1}));
    const app=express();app.use(express.json());app.use('/api/work-calendar',workScheduleRoutes);
    const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    t.after(()=>new Promise(resolve=>server.close(resolve)));
    const base=`http://127.0.0.1:${server.address().port}/api/work-calendar`;
    for(const [method,path] of [['GET','/holiday-presets?year=2026'],['POST',`/versions/${schedule.id}/exceptions/batch-preview`],['POST',`/versions/${schedule.id}/exceptions/batch`]]) {
        for(const role of [null,'EMPLOYEE','ADMIN']) {
            const headers=role?{Authorization:`Bearer ${jwt.sign({userId:schedule.updatedBy,role},env.jwtAccessSecret,{expiresIn:'2m'})}`} : {};
            const res=await fetch(base+path,{method,headers});
            assert.equal(res.status,role===null?401:role==='EMPLOYEE'?403:path.endsWith('/batch')?201:200);
            if(role==='ADMIN') assert.ok((await res.json()).data);
        }
    }
    const headers={Authorization:`Bearer ${jwt.sign({userId:schedule.updatedBy,role:'ADMIN'},env.jwtAccessSecret,{expiresIn:'2m'})}`};
    for(const query of ['year=0000','year=26','year=2026&unknown=true','year=2026&year=2027']) assert.equal((await fetch(base+'/holiday-presets?'+query,{headers})).status,400);
});
