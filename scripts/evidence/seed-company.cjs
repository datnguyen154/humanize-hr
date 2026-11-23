// Deterministic demo company for P2/P3 evidence: ACTIVE calendar from 01/11/2026 with a paid company
// holiday on 20/11, six employees, November punches up to "today" (23/11/2026) and approved leaves.
const { createStore, schedule, users, dist } = require('./mock-api.cjs')

function seedCompany({ today = '2026-11-23' } = {}) {
  const { classifyCheckIn, createCalendarResolver } = dist('work-calendar/effective-calendar.js')
  const { monthDates } = dist('attendance/timesheet.engine.js')
  const store = createStore()
  store.today = today
  const active = schedule({ id: '33333333-3333-4333-8333-333333333333', status: 'ACTIVE', revision: 2, effectiveFrom: '2026-11-01' })
  const holiday = { id: '55555555-5555-4555-8555-555555555555', scheduleVersionId: active.id, firstAffectedDate: '2026-11-20',
    createdBy: active.createdBy, updatedBy: active.createdBy, createdAt: active.createdAt, updatedAt: active.updatedAt,
    payload: { kind: 'HOLIDAY', date: '2026-11-20', name: 'Ngày Nhà giáo (nghỉ doanh nghiệp)', sourceReference: 'Quyết định nội bộ',
      reason: 'Công ty cho nghỉ', holidayPolicy: { category: 'COMPANY', isPaid: true } } }
  store.schedules.push(active)
  store.exceptions.push(holiday)

  const people = [
    [users.EMPLOYEE.fullName, 'Kỹ thuật', '2024-03-01'], ['Lê Hoàng Nam', 'Kỹ thuật', '2023-07-15'], ['Phạm Thu Hà', 'Nhân sự', '2022-01-10'],
    ['Đỗ Quang Huy', 'Kinh doanh', '2025-05-05'], ['Vũ Ngọc Lan', 'Kế toán', '2021-09-01'], ['Bùi Đức Long', 'Kinh doanh', '2026-11-16'],
  ]
  store.employees = people.map(([fullName, departmentName, joinedAt], i) => ({ id: `e000000${i}-0000-4000-8000-00000000000${i}`,
    employeeCode: `NV00${i + 1}`, fullName, departmentName, status: 'ACTIVE', joinedAt }))

  // Exceptions to a normal on-time day, per employee index: [date, kind, minutes after 08:00 or note]
  const special = {
    0: { '2026-11-05': 'late:12', '2026-11-11': 'absent', '2026-11-13': 'leave', '2026-11-18': 'nocheckout', '2026-11-19': 'late:25' },
    1: { '2026-11-03': 'late:5', '2026-11-04': 'late:18', '2026-11-12': 'late:7', '2026-11-21': 'weekend' },
    2: { '2026-11-09': 'sick', '2026-11-10': 'sick' },
    3: { '2026-11-02': 'absent', '2026-11-16': 'unpaid', '2026-11-17': 'late:40', '2026-11-18': 'late:9' },
    4: { '2026-11-06': 'leave', '2026-11-21': 'weekend' },
    5: {},
  }
  const resolve = createCalendarResolver([{ schedule: active, events: [holiday] }])
  let n = 0
  store.employees.forEach((employee, i) => {
    for (const date of monthDates(2026, 11)) {
      if (date > store.today || date < employee.joinedAt) continue
      const day = resolve(date)
      const plan = special[i][date] ?? (day.isWorkingDay ? `ontime:${(i * 7 + Number(date.slice(8))) % 9}` : null)
      if (!plan || plan === 'absent') continue
      if (['leave', 'sick', 'unpaid'].includes(plan)) {
        store.leaves.push({ employeeId: employee.id, leaveType: plan === 'leave' ? 'ANNUAL' : plan === 'sick' ? 'SICK' : 'UNPAID', from: date, to: date })
        continue
      }
      const [kind, value = '0'] = plan.split(':')
      const minutes = kind === 'late' ? 8 * 60 + Number(value) : kind === 'weekend' ? 9 * 60 + 30 : 7 * 60 + 45 + Number(value)
      const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      const { late, outOfSchedule } = classifyCheckIn(day, minutes * 60, 8 * 3600)
      const checkIn = new Date(`${date}T${hhmm}:00+07:00`).toISOString()
      const checkOut = kind === 'nocheckout' || date === store.today ? null
        : new Date(`${date}T${kind === 'weekend' ? '12:00' : '17:0' + (i % 6)}:00+07:00`).toISOString()
      store.attendance.push({ id: `a-${n++}`, employeeId: employee.id, employee: { id: employee.id, employeeCode: employee.employeeCode, fullName: employee.fullName },
        attendanceDate: `${date}T00:00:00.000Z`, checkInTime: checkIn, checkOutTime: checkOut, status: late ? 'LATE' : 'PRESENT', outOfSchedule,
        createdAt: checkIn, updatedAt: checkIn })
    }
  })
  return store
}

module.exports = { seedCompany }
