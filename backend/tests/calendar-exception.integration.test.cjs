const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
require('dotenv').config();

test('S2A real PostgreSQL + HTTP (isolated schema)', {
    skip: process.env.HRM_S2A_DB_TEST !== '1', timeout: 120000,
}, async (t) => {
    const { PrismaClient } = require('@prisma/client');
    const url = new URL(process.env.DATABASE_URL);
    assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname),'local database only');
    const schema = `hrm_s2a_test_${randomUUID().replaceAll('-','')}`;
    assert.match(schema,/^hrm_s2a_test_[a-f0-9]{32}$/);
    const adminDb = new PrismaClient({datasourceUrl:url.toString()});
    let db, server;
    await adminDb.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    t.after(async()=>{
        if(server) await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
        if(db) await db.$disconnect();
        // Never drop public or a pre-existing schema: only this test's random, validated identifier.
        await adminDb.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
        await adminDb.$disconnect();
    });
    url.searchParams.set('schema',schema);
    process.env.DATABASE_URL=url.toString(); process.env.DIRECT_URL=url.toString();
    const migration=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{
        cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:40000,
    });
    assert.equal(migration.status,0,`isolated migrations failed: ${migration.stderr}`);
    db=require('../dist/config/prisma').prisma;
    const actor=await db.user.create({data:{email:`${schema}@example.invalid`,passwordHash:'test-not-for-login',fullName:'S2A test admin',role:'ADMIN'}});
    const jwt=require('jsonwebtoken');
    const {env}=require('../dist/config/env');
    const app=require('../dist/app').default;
    const {calendarExceptionService:service}=require('../dist/modules/work-calendar/calendar-exception.service');
    const {calendarExceptionRepository:repository}=require('../dist/modules/work-calendar/calendar-exception.repository');
    const {workScheduleRepository:schedules}=require('../dist/modules/work-calendar/work-schedule.repository');
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}/api/work-calendar`;
    const headers={Authorization:`Bearer ${jwt.sign({userId:actor.id,role:'ADMIN'},env.jwtAccessSecret,{expiresIn:'5m'})}`,'Content-Type':'application/json'};
    const call=async(path,method='GET',body)=>{
        const res=await fetch(base+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
        return {status:res.status,body:res.status===404&&res.headers.get('content-type')?.includes('text/html')?await res.text():await res.json()};
    };
    const config={effectiveFrom:'2026-01-01',timezone:'Asia/Ho_Chi_Minh',weekdays:[1,2,3,4,5],
        startTime:'08:00',endTime:'17:00',breaks:[{startTime:'12:00',endTime:'13:00'}]};
    const draft=async(extra={})=>{
        const result=await call('/versions','POST',{...config,...extra});
        assert.equal(result.status,201); return result.body.data;
    };
    const collection=(id)=>`/versions/${id}/exceptions`;
    const holiday=(date)=>({kind:'HOLIDAY',date,name:'Ngày lễ kiểm thử',sourceReference:'Nguồn kiểm thử',reason:'Lý do kiểm thử'});
    const comp=(date,sourceHolidayDate)=>({kind:'COMPENSATORY_OFF',date,sourceHolidayDate,reason:'Xác nhận nghỉ bù'});
    const swap=(offDate,workDate)=>({kind:'SWAP',offDate,workDate,reason:'Hoán đổi kiểm thử'});
    const create=async(id,revision,payload)=>call(collection(id),'POST',{expectedRevision:revision,exception:payload});
    const preview=(id,year=2026,month=11)=>call(`/preview?versionId=${id}&year=${year}&month=${month}`);
    const counts=async(id)=>({revision:(await db.workScheduleVersion.findUniqueOrThrow({where:{id}})).revision,
        events:await db.calendarException.count({where:{scheduleVersionId:id}}),audits:await db.workScheduleAudit.count({where:{scheduleVersionId:id}})});

    await t.test('CRUD, envelopes, real pagination, kind/date filters and both SWAP dates',async()=>{
        const s=await draft();
        const empty=await call(collection(s.id));
        assert.deepEqual(empty.body,{data:[],meta:{page:1,limit:10,totalItems:0,totalPages:0,hasNextPage:false,hasPreviousPage:false},scheduleRevision:1});
        const first=await create(s.id,1,holiday('2026-11-02'));
        assert.equal(first.status,201);
        assert.equal(first.body.data.scheduleRevision,2);
        const item=first.body.data.exception;
        assert.equal(item.createdBy,actor.id);
        assert.equal(item.payload.date,'2026-11-02');
        assert.equal((await call(collection(s.id)+`/${item.id}`)).body.data.exception.id,item.id);
        const second=await create(s.id,2,swap('2026-12-31','2027-01-02'));
        assert.equal(second.status,201);
        const page=await call(collection(s.id)+'?limit=1');
        assert.equal(page.body.meta.totalItems,2);
        assert.equal(page.body.meta.hasNextPage,true);
        assert.equal(page.body.scheduleRevision,3);
        assert.equal((await call(collection(s.id)+'?page=3&limit=1')).body.data.length,0);
        assert.equal((await call(collection(s.id)+'?kind=SWAP')).body.data.length,1);
        const filtered=await call(collection(s.id)+'?fromDate=2027-01-02&toDate=2027-01-02');
        assert.equal(filtered.body.meta.totalItems,1);
        assert.equal(filtered.body.data[0].id,second.body.data.exception.id);
        const full=await call(collection(s.id)+'?fromDate=2026-12-31&toDate=2027-01-02');
        assert.equal(full.body.meta.totalItems,1,'one SWAP event, not two list rows');
        const before=await preview(s.id);
        const edit=await call(collection(s.id)+`/${item.id}`,'PATCH',{expectedRevision:3,exception:{...holiday('2026-11-03'),name:'Đã sửa'}});
        assert.equal(edit.status,200);
        assert.equal(edit.body.data.scheduleRevision,4);
        const after=await preview(s.id);
        assert.notEqual(before.body.data.sourceFingerprint,after.body.data.sourceFingerprint);
        const removed=await call(collection(s.id)+`/${item.id}`,'DELETE',{expectedRevision:4,reason:'Xóa dữ liệu kiểm thử'});
        assert.deepEqual(removed.body,{data:{removedExceptionId:item.id,scheduleRevision:5}});
        assert.equal((await call(collection(s.id)+`/${item.id}`,'PATCH',{expectedRevision:4,exception:holiday('2026-11-03')})).body.code,'WORK_SCHEDULE_REVISION_CONFLICT');
        assert.equal((await call(collection(s.id)+`/${item.id}`)).status,404);
        const audits=await db.workScheduleAudit.findMany({where:{scheduleVersionId:s.id},orderBy:{createdAt:'asc'}});
        assert.deepEqual(audits.map(a=>a.action),['CREATE','EXCEPTION_CREATE','EXCEPTION_CREATE','EXCEPTION_UPDATE','EXCEPTION_DELETE']);
        assert.equal(audits[3].before.exception.payload.date,'2026-11-02');
        assert.equal(audits[3].after.exception.payload.date,'2026-11-03');
        assert.equal(audits[4].after.reason,'Xóa dữ liệu kiểm thử');
    });

    await t.test('sequential holiday compensation across year, reverse entry order and referenced sources',async()=>{
        const s=await draft({effectiveFrom:'2022-01-01'});
        let revision=1;
        const created=[];
        for(const payload of [holiday('2022-12-31'),holiday('2023-01-01'),holiday('2023-01-02')]){
            const result=await create(s.id,revision++,payload); assert.equal(result.status,201); created.push(result.body.data.exception);
        }
        const pending=(await preview(s.id,2023,1)).body.data;
        assert.deepEqual(pending.days.filter(d=>d.dayType==='UNRESOLVED').map(d=>d.date),['2023-01-03','2023-01-04']);
        assert.equal(await db.calendarException.count({where:{scheduleVersionId:s.id}}),3,'preview must not persist generated compensation');
        for(const payload of [comp('2023-01-04','2023-01-01'),comp('2023-01-03','2022-12-31')]){
            const result=await create(s.id,revision++,payload); assert.equal(result.status,201);
        }
        const ready=(await preview(s.id,2023,1)).body.data;
        assert.equal(ready.validation.hasBlockingIssues,false);
        assert.equal(ready.summary.isComplete,true);
        const before=await counts(s.id);
        assert.equal((await call(collection(s.id)+`/${created[0].id}`,'DELETE',{expectedRevision:revision,reason:'Thử xóa nguồn'})).body.code,'WORK_CALENDAR_EXCEPTION_REFERENCED');
        assert.equal((await call(collection(s.id)+`/${created[0].id}`,'PATCH',{expectedRevision:revision,exception:holiday('2023-01-05')})).status,409);
        assert.deepEqual(await counts(s.id),before);
        const duplicate=await create(s.id,revision,comp('2023-01-05','2022-12-31'));
        assert.equal(duplicate.status,400);
        assert.ok(duplicate.body.details['exception.sourceHolidayDate']);
        assert.deepEqual(await counts(s.id),before);
    });

    await t.test('invalid new exceptions fail without writes, status/ownership/revision guards match v1',async()=>{
        const s=await draft();
        const other=await draft();
        const first=await create(s.id,1,holiday('2026-11-02'));
        const item=first.body.data.exception;
        const before=await counts(s.id);
        for(const payload of [holiday('2025-12-31'),comp('2026-11-03','2026-10-31'),swap('2026-11-07','2026-11-08'),
            swap('2026-11-06','2026-11-06'),{...holiday('2026-11-03'),employeeId:randomUUID()},
            {kind:'WORK_OVERRIDE',date:'2026-11-07',startTime:'08:00',endTime:'17:00',breaks:config.breaks,reason:'Thử sai'}]){
            const result=await create(s.id,2,payload); assert.equal(result.status,400,JSON.stringify(result));
        }
        assert.equal((await create(s.id,2,holiday('2026-11-02'))).body.code,'WORK_CALENDAR_EXCEPTION_CONFLICT');
        assert.equal((await create(s.id,1,holiday('2026-11-03'))).body.code,'WORK_SCHEDULE_REVISION_CONFLICT');
        assert.equal((await call(collection(other.id)+`/${item.id}`)).status,404);
        assert.equal((await call(collection(other.id)+`/${item.id}`,'PATCH',{expectedRevision:1,exception:holiday('2026-11-03')})).status,404);
        assert.equal((await call(collection(s.id)+`/${item.id}`,'PATCH',{expectedRevision:2,exception:{reason:'Không đủ payload'}})).status,400);
        assert.deepEqual(await counts(s.id),before);
        for(const suffix of ['?page=1&page=2','?kind[]=HOLIDAY','?unknown=1','?fromDate=2026-11-01']) assert.equal((await call(collection(s.id)+suffix)).status,400);
        assert.equal((await call(`/preview?versionId=${s.id}&year=2026&year=2027&month=11`)).status,400);
        assert.equal((await call(`/preview?versionId=${s.id}&year=2026&month=11&kind=HOLIDAY`)).status,400);
        assert.equal((await call('/versions/'+s.id+'/activate','POST',{})).status,404);
        await db.workScheduleVersion.update({where:{id:s.id},data:{status:'ACTIVE'}});
        for(const [method,path,body] of [['GET',collection(s.id)],['GET',collection(s.id)+`/${item.id}`],
            ['POST',collection(s.id),{expectedRevision:2,exception:holiday('2026-11-03')}],
            ['PATCH',collection(s.id)+`/${item.id}`,{expectedRevision:2,exception:holiday('2026-11-03')}],
            ['DELETE',collection(s.id)+`/${item.id}`,{expectedRevision:2,reason:'Không được xóa'}],
            ['GET',`/preview?versionId=${s.id}&year=2026&month=11`]]){
            assert.equal((await call(path,method,body)).body.code,'WORK_SCHEDULE_NOT_DRAFT');
        }
    });

    await t.test('S1 base edits preserve SWAP/override rows, preview blockers/null, repair/delete still possible',async()=>{
        const s=await draft();
        const sw=await create(s.id,1,swap('2026-12-31','2027-01-02'));
        const ov=await create(s.id,2,{kind:'WORK_OVERRIDE',date:'2026-11-02',startTime:'09:00',endTime:'18:00',breaks:config.breaks,reason:'Đổi giờ'});
        const edited=await call('/versions/'+s.id,'PATCH',{expectedRevision:3,weekdays:[2,3,5]});
        assert.equal(edited.status,200);
        assert.equal(edited.body.data.revision,4);
        assert.equal(await db.calendarException.count({where:{scheduleVersionId:s.id}}),2);
        const nov=(await preview(s.id)).body.data;
        assert.equal(nov.days.find(d=>d.date==='2026-11-02').requiredWorkingMinutes,null);
        assert.ok(nov.validation.issues.some(i=>i.code==='SWAP_BASE_DAY_INVALID'&&i.date==='2026-12-31'));
        const dec=(await preview(s.id,2026,12)).body.data;
        assert.equal(dec.days.find(d=>d.date==='2026-12-31').dayType,'UNRESOLVED');
        const jan=(await preview(s.id,2027,1)).body.data;
        assert.equal(jan.days.find(d=>d.date==='2027-01-02').dayType,'UNRESOLVED');
        const oct=(await preview(s.id,2026,10)).body.data;
        assert.equal(oct.summary.isComplete,true);
        assert.equal(oct.validation.hasBlockingIssues,true);
        const repaired=await call(collection(s.id)+`/${sw.body.data.exception.id}`,'PATCH',{expectedRevision:4,exception:swap('2026-12-30','2027-01-02')});
        assert.equal(repaired.status,200);
        const removed=await call(collection(s.id)+`/${ov.body.data.exception.id}`,'DELETE',{expectedRevision:5,reason:'Xóa ngoại lệ không còn hợp lệ'});
        assert.equal(removed.status,200);
        assert.equal((await preview(s.id)).body.data.validation.hasBlockingIssues,false);
        assert.equal((await call(collection(s.id)+`/${sw.body.data.exception.id}`,'PATCH',{expectedRevision:4,exception:swap('2026-12-30','2027-01-02')})).status,409);
    });

    await t.test('concurrent exception/exception and S1/exception mutations have exactly one winner and one audit',async()=>{
        for(const baseEdit of [false,true]){
            const s=await draft();
            const calls=[create(s.id,1,swap('2026-11-06','2026-11-07')),
                baseEdit?call('/versions/'+s.id,'PATCH',{expectedRevision:1,endTime:'18:00'}):create(s.id,1,holiday('2026-11-07'))];
            const results=await Promise.all(calls);
            assert.equal(results.filter(r=>r.status===409).length,1);
            assert.ok(results[0].status===201||results[0].status===409);
            assert.ok(results[1].status===(baseEdit?200:201)||results[1].status===409);
            assert.equal(results.find(r=>r.status===409).body.code,'WORK_SCHEDULE_REVISION_CONFLICT');
            const state=await counts(s.id);
            assert.equal(state.revision,2);
            assert.equal(state.audits,2);
            assert.equal(state.events,baseEdit&&results[1].status===200?0:1);
            const snapshot=await db.calendarException.findMany({where:{scheduleVersionId:s.id}});
            if(snapshot[0]?.kind==='SWAP'){
                assert.equal(snapshot[0].firstAffectedDate.toISOString().slice(0,10),'2026-11-06');
                assert.equal(snapshot[0].lastAffectedDate.toISOString().slice(0,10),'2026-11-07');
            }
        }
    });

    await t.test('base edits retain compensation/holiday data, no-op replacement increments revision, and repair uses current config',async()=>{
        const s=await draft();
        const h=await create(s.id,1,holiday('2026-11-01'));
        const c=await create(s.id,2,comp('2026-11-02','2026-11-01'));
        const compId=c.body.data.exception.id;
        const noOp=await call(collection(s.id)+`/${compId}`,'PATCH',{expectedRevision:3,exception:c.body.data.exception.payload});
        assert.equal(noOp.body.data.scheduleRevision,4);
        const edited=await call('/versions/'+s.id,'PATCH',{expectedRevision:4,weekdays:[1,2,3,4,5,7]});
        assert.equal(edited.status,200);
        const current=(await call(collection(s.id)+`/${compId}`)).body.data;
        assert.deepEqual(current.exception.payload,c.body.data.exception.payload);
        assert.equal(current.scheduleRevision,5);
        const invalid=(await preview(s.id)).body.data;
        assert.ok(invalid.validation.issues.some(i=>i.code==='COMPENSATORY_SOURCE_INVALID'));
        assert.equal(invalid.days.find(d=>d.date==='2026-11-02').requiredWorkingMinutes,null);
        const shifted=await call('/versions/'+s.id,'PATCH',{expectedRevision:5,effectiveFrom:'2026-11-03'});
        assert.equal(shifted.body.data.revision,6);
        assert.equal(await db.calendarException.count({where:{scheduleVersionId:s.id}}),2);
        const beforeEffect=(await preview(s.id)).body.data;
        assert.equal(beforeEffect.summary.missingScheduleDays,2);
        assert.ok(beforeEffect.validation.issues.some(i=>i.code==='EXCEPTION_BEFORE_EFFECTIVE_FROM'));
        assert.equal((await call(collection(s.id)+`/${compId}`,'DELETE',{expectedRevision:6,reason:'Xử lý ngoại lệ sau sửa lịch'})).status,200);
        assert.equal((await call(collection(s.id)+`/${h.body.data.exception.id}`,'DELETE',{expectedRevision:7,reason:'Xử lý nguồn không còn hiệu lực'})).status,200);
        assert.equal((await preview(s.id)).body.data.validation.hasBlockingIssues,false);
    });

    await t.test('audit failure rolls back create, full replace, delete and shared parent revision',async()=>{
        const s=await draft();
        const created=await create(s.id,1,swap('2026-11-06','2026-11-07'));
        const id=created.body.data.exception.id;
        const before=await counts(s.id);
        const existing=await db.calendarException.findUniqueOrThrow({where:{id}});
        const failure=t.mock.method(schedules,'audit',async()=>{throw new Error('simulated S2A audit failure');});
        try{
            await assert.rejects(service.create(s.id,actor.id,{expectedRevision:2,exception:holiday('2026-11-02')}),/simulated/);
            await assert.rejects(service.replace(s.id,id,actor.id,{expectedRevision:2,exception:swap('2026-11-13','2026-11-14')}),/simulated/);
            await assert.rejects(service.remove(s.id,id,actor.id,{expectedRevision:2,reason:'Thử rollback'}),/simulated/);
            assert.deepEqual(await counts(s.id),before);
            assert.deepEqual(await db.calendarException.findUniqueOrThrow({where:{id}}),existing);
        }finally{failure.mock.restore();}
    });

    await t.test('list and preview read repeatable snapshots even if another mutation commits between parent and children',async()=>{
        for(const operation of ['list','preview']){
            const s=await draft();
            let signal, release;
            const readStarted=new Promise(resolve=>{signal=resolve;});
            const readContinue=new Promise(resolve=>{release=resolve;});
            const method=operation==='list'?'page':'all';
            const original=repository[method];
            let intercepted=false;
            const pause=t.mock.method(repository,method,async(...args)=>{
                if(!intercepted){intercepted=true;signal();await readContinue;}
                return original(...args);
            });
            try{
                const reading=operation==='list'?call(collection(s.id)):preview(s.id);
                await readStarted;
                const created=await create(s.id,1,holiday('2026-11-02'));
                assert.equal(created.status,201);
                release();
                const old=await reading;
                const result=operation==='list'?old.body:old.body.data;
                assert.equal(result.scheduleRevision,1);
                if(operation==='list') assert.equal(result.meta.totalItems,0);
                else assert.equal(result.days.find(d=>d.date==='2026-11-02').dayType,'WORKDAY');
                const current=await preview(s.id);
                assert.equal(current.body.data.scheduleRevision,2);
                assert.equal(current.body.data.days.find(d=>d.date==='2026-11-02').dayType,'HOLIDAY');
            }finally{release();pause.mock.restore();}
        }
    });

    const {calendarHolidayBatchService:batchService}=require('../dist/modules/work-calendar/calendar-holiday-batch.service');
    const {holidayPresetCatalog}=require('../dist/modules/work-calendar/holiday-presets');
    const presetHoliday=(p)=>p.dates.map(date=>({kind:'HOLIDAY',date,name:p.name,sourceReference:p.sourceReference,
        reason:p.suggestedReason,holidayPolicy:{category:'STATUTORY',presetId:p.id}}));
    const tet=holidayPresetCatalog(2027).presets.find(p=>p.holidayCode==='TET'&&p.id.endsWith(':2-3'));
    const batchBody=(revision=1,h=presetHoliday(tet))=>({expectedRevision:revision,holidays:h,includeCompensatoryOff:true});
    const batchPreview=(id,body)=>call(collection(id)+'/batch-preview','POST',body);
    const batchCreate=(id,body,planFingerprint)=>call(collection(id)+'/batch','POST',{...body,planFingerprint});

    await t.test('holiday catalog + batch preview/create are real APIs; five holidays and compensation commit in one revision/audit',async()=>{
        const catalog=await call('/holiday-presets?year=2027');
        assert.equal(catalog.status,200);
        assert.equal(catalog.body.data.unavailable.some(p=>p.holidayCode==='HUNG_KINGS'),true);
        const s=await draft();
        const before=await counts(s.id);
        const body=batchBody();
        const plan=await batchPreview(s.id,body);
        assert.equal(plan.status,200);
        assert.equal(plan.body.data.toCreate.length,7);
        assert.deepEqual(await counts(s.id),before,'preview must not write');
        const saved=await batchCreate(s.id,body,plan.body.data.planFingerprint);
        assert.equal(saved.status,201);
        assert.equal(saved.body.data.created.length,7);
        assert.equal(saved.body.data.scheduleRevision,2);
        assert.deepEqual(await counts(s.id),{revision:2,events:7,audits:2});
        const audit=await db.workScheduleAudit.findFirst({where:{scheduleVersionId:s.id,action:'EXCEPTION_CREATE'}});
        assert.equal(audit.after.operation,'HOLIDAY_BATCH');
        assert.equal(audit.after.created.length,7);
        assert.equal(audit.after.created[0].payload.holidayPolicy.category,'STATUTORY');
        const month=(await preview(s.id,2027,2)).body.data;
        assert.equal(month.days.filter(d=>d.dayType==='HOLIDAY').length,5);
        assert.equal(month.days.filter(d=>d.dayType==='COMPENSATORY_OFF').length,2);
        assert.equal(month.days.find(d=>d.date==='2027-02-06').holidayPayPolicy,'PAID');
        assert.equal(month.days.find(d=>d.date==='2027-02-09').holidayPayPolicy,null);
        assert.equal(month.validation.hasBlockingIssues,false);
        assert.equal((await batchCreate(s.id,body,plan.body.data.planFingerprint)).body.code,'WORK_SCHEDULE_REVISION_CONFLICT');
        const repeatBody=batchBody(2);
        const parentBeforeNoop=await db.workScheduleVersion.findUniqueOrThrow({where:{id:s.id}});
        const repeat=(await batchPreview(s.id,repeatBody)).body.data;
        assert.equal(repeat.toCreate.length,0);
        assert.equal(repeat.skipped.length,7);
        assert.equal((await batchCreate(s.id,repeatBody,repeat.planFingerprint)).body.data.scheduleRevision,2);
        assert.deepEqual(await counts(s.id),{revision:2,events:7,audits:2},'no-op does not create another compensation/audit/revision');
        assert.deepEqual(await db.workScheduleVersion.findUniqueOrThrow({where:{id:s.id}}),parentBeforeNoop,'no-op does not change updatedAt');
    });

    await t.test('invalid/conflicting last item and stale plan fail atomically without partial success',async()=>{
        const s=await draft();
        const company=(date)=>({...holiday(date),name:'Nghỉ doanh nghiệp',sourceReference:'Quyết định nội bộ',holidayPolicy:{category:'COMPANY',isPaid:true}});
        await create(s.id,1,company('2026-11-03'));
        const before=await counts(s.id);
        const bad={...batchBody(2),holidays:[company('2026-11-02'),{...company('2026-11-03'),reason:'Khác nguồn đã lưu'}]};
        assert.equal((await batchPreview(s.id,bad)).status,409);
        assert.equal((await batchCreate(s.id,bad,'sha256:'+'0'.repeat(64))).status,409);
        assert.deepEqual(await counts(s.id),before);
        const invalid={...batchBody(2),holidays:[company('2026-11-02'),{...company('2026-11-04'),date:'2026-02-30'}]};
        assert.equal((await batchCreate(s.id,invalid,'sha256:'+'0'.repeat(64))).status,400);
        const valid={...batchBody(2),holidays:[company('2026-11-02')]};
        assert.equal((await batchCreate(s.id,valid,'sha256:'+'0'.repeat(64))).body.code,'WORK_CALENDAR_BATCH_PLAN_CHANGED');
        assert.deepEqual(await counts(s.id),before);
        const first=(await batchPreview(s.id,valid)).body.data;
        const edited={...valid,holidays:[{...valid.holidays[0],reason:'Nội dung thay đổi sau preview'}]};
        assert.equal((await batchCreate(s.id,edited,first.planFingerprint)).body.code,'WORK_CALENDAR_BATCH_PLAN_CHANGED');
        assert.deepEqual(await counts(s.id),before);
    });

    await t.test('batch database insert failure and audit failure roll back all rows and parent revision',async()=>{
        const s=await draft();
        const body=batchBody();
        const plan=(await batchPreview(s.id,body)).body.data;
        const before=await counts(s.id);
        const original=repository.create;
        let called=0;
        const broken=t.mock.method(repository,'create',async(...args)=>{
            if(++called===2) throw new Error('simulated batch insert failure');
            return original(...args);
        });
        try {
            await assert.rejects(batchService.create(s.id,actor.id,{...body,planFingerprint:plan.planFingerprint}),/simulated batch insert/);
            assert.deepEqual(await counts(s.id),before);
        } finally { broken.mock.restore(); }
        const audit=t.mock.method(schedules,'audit',async()=>{throw new Error('simulated batch audit failure');});
        try {
            await assert.rejects(batchService.create(s.id,actor.id,{...body,planFingerprint:plan.planFingerprint}),/simulated batch audit/);
            assert.deepEqual(await counts(s.id),before);
        } finally { audit.mock.restore(); }
    });

    await t.test('batch vs batch and batch vs S1 share one CAS winner and cannot partially commit',async()=>{
        for(const competitor of ['batch','S1']) {
            const s=await draft();
            const body=batchBody(),plan=(await batchPreview(s.id,body)).body.data;
            const responses=await Promise.all([
                batchCreate(s.id,body,plan.planFingerprint),
                competitor==='batch'?batchCreate(s.id,body,plan.planFingerprint):call(`/versions/${s.id}`,'PATCH',{expectedRevision:1,startTime:'07:30'}),
            ]);
            assert.equal(responses.filter(r=>r.status===409).length,1);
            assert.ok(responses[0].status===201||responses[0].status===409);
            assert.ok(responses[1].status===(competitor==='batch'?201:200)||responses[1].status===409);
            assert.equal(responses.find(r=>r.status===409).body.code,'WORK_SCHEDULE_REVISION_CONFLICT');
            const after=await counts(s.id);
            assert.equal(after.revision,2);
            assert.equal(after.audits,2);
            assert.equal(after.events,competitor==='S1'&&responses[1].status===200?0:7);
        }
    });

    await t.test('v1 PATCH retains classified policy, referenced source cannot become company leave, company days never require compensation',async()=>{
        const s=await draft();
        const body=batchBody(),plan=(await batchPreview(s.id,body)).body.data;
        const saved=(await batchCreate(s.id,body,plan.planFingerprint)).body.data;
        const source=saved.created.find(e=>e.payload.kind==='HOLIDAY'&&e.payload.date==='2027-02-06');
        const {holidayPolicy,...oldPayload}=source.payload;
        const edit=await call(collection(s.id)+'/'+source.id,'PATCH',{expectedRevision:2,exception:{...oldPayload,reason:'V1 client sửa lý do'}});
        assert.equal(edit.status,200);
        assert.deepEqual(edit.body.data.exception.payload.holidayPolicy,holidayPolicy);
        const before=await counts(s.id);
        assert.equal((await call(collection(s.id)+'/'+source.id,'PATCH',{expectedRevision:3,exception:{...oldPayload,holidayPolicy:{category:'COMPANY',isPaid:true}}})).body.code,'WORK_CALENDAR_EXCEPTION_REFERENCED');
        assert.deepEqual(await counts(s.id),before);
        const company={...holiday('2026-11-01'),sourceReference:'Quyết định nội bộ',holidayPolicy:{category:'COMPANY',isPaid:false}};
        assert.equal((await create(s.id,3,company)).status,201);
        const month=(await preview(s.id,2026,11)).body.data;
        assert.equal(month.validation.hasBlockingIssues,false);
        assert.equal(month.days[0].holidayCategory,'COMPANY');
        assert.equal(month.days[0].holidayPayPolicy,'UNPAID');
        assert.equal((await create(s.id,4,comp('2026-11-02','2026-11-01'))).status,400);
    });

    await t.test('preview never writes data and no Attendance, Leave, Payroll rows are created',async()=>{
        const s=await draft({effectiveFrom:'2026-11-15'});
        const before=await counts(s.id);
        const a=await preview(s.id);
        const b=await preview(s.id);
        assert.deepEqual(a.body,b.body);
        assert.deepEqual(await counts(s.id),before);
        assert.equal(a.body.data.summary.missingScheduleDays,14);
        assert.equal(a.body.data.summary.requiredWorkingDays,null);
        assert.equal(await db.attendance.count(),0);
        assert.equal(await db.leaveRequest.count(),0);
        assert.equal(await db.payroll.count(),0);
    });
    t.diagnostic('Isolated PostgreSQL migrations + six HTTP APIs, CAS races, audit rollback and repeatable-read snapshots verified; public data untouched.');
});
