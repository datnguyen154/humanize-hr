import bcrypt from "bcrypt";
import {
    AttendanceStatus,
    DepartmentStatus,
    EmployeeStatus,
    Gender,
    LeaveRequestStatus,
    LeaveType,
    PrismaClient,
    Role,
    UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type SampleEmployee = {
    employeeCode: string;
    fullName: string;
    email: string;
    phone: string;
    gender: Gender;
    dateOfBirth: Date;
    position: string;
    status: EmployeeStatus;
    joinedAt: Date;
};

type SampleDepartment = {
    name: string;
    description: string;
    status: DepartmentStatus;
};

type SampleLeaveRequest = {
    id: string;
    employeeCode: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveRequestStatus;
    reviewedAt: Date | null;
    reviewNote: string | null;
};

type SampleAttendance = {
    employeeCode: string;
    attendanceDate: Date;
    checkInTime: Date;
    checkOutTime: Date;
    status: AttendanceStatus;
};

const sampleDepartments: SampleDepartment[] = [
    {
        name: "Engineering",
        description:
            "Phòng phát triển sản phẩm, xây dựng hệ thống và vận hành nền tảng kỹ thuật.",
        status: DepartmentStatus.ACTIVE,
    },
    {
        name: "Human Resources",
        description:
            "Phòng phụ trách tuyển dụng, hồ sơ nhân sự, chính sách và trải nghiệm nhân viên.",
        status: DepartmentStatus.ACTIVE,
    },
    {
        name: "Finance",
        description:
            "Phòng quản lý ngân sách, chi phí, báo cáo tài chính và quy trình thanh toán.",
        status: DepartmentStatus.ACTIVE,
    },
    {
        name: "Marketing",
        description:
            "Phòng xây dựng thương hiệu, truyền thông, chiến dịch quảng bá và nội dung.",
        status: DepartmentStatus.ACTIVE,
    },
    {
        name: "Sales",
        description:
            "Phòng phát triển khách hàng, quản lý cơ hội bán hàng và chăm sóc doanh thu.",
        status: DepartmentStatus.ACTIVE,
    },
];

const sampleEmployees: SampleEmployee[] = [
    {
        employeeCode: "EMP001",
        fullName: "Nguyen Van An",
        email: "employee@example.com",
        phone: "0901000001",
        gender: Gender.MALE,
        dateOfBirth: new Date("1997-01-15"),
        position: "Frontend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-01-10"),
    },
    {
        employeeCode: "EMP002",
        fullName: "Tran Thi Bich",
        email: "tran.thi.bich@example.com",
        phone: "0901000002",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1998-03-22"),
        position: "Backend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-02-14"),
    },
    {
        employeeCode: "EMP003",
        fullName: "Le Minh Chau",
        email: "le.minh.chau@example.com",
        phone: "0901000003",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1996-07-08"),
        position: "UI/UX Designer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-03-01"),
    },
    {
        employeeCode: "EMP004",
        fullName: "Pham Quoc Duy",
        email: "pham.quoc.duy@example.com",
        phone: "0901000004",
        gender: Gender.MALE,
        dateOfBirth: new Date("1995-11-19"),
        position: "QA Engineer",
        status: EmployeeStatus.INACTIVE,
        joinedAt: new Date("2022-11-21"),
    },
    {
        employeeCode: "EMP005",
        fullName: "Hoang Thu Ha",
        email: "hoang.thu.ha@example.com",
        phone: "0901000005",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1999-05-12"),
        position: "HR Executive",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-04-17"),
    },
    {
        employeeCode: "EMP006",
        fullName: "Dang Tuan Kiet",
        email: "dang.tuan.kiet@example.com",
        phone: "0901000006",
        gender: Gender.MALE,
        dateOfBirth: new Date("1994-09-03"),
        position: "Backend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2022-08-08"),
    },
    {
        employeeCode: "EMP007",
        fullName: "Bui Ngoc Linh",
        email: "bui.ngoc.linh@example.com",
        phone: "0901000007",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("2000-02-28"),
        position: "Frontend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2024-01-05"),
    },
    {
        employeeCode: "EMP008",
        fullName: "Do Manh Long",
        email: "do.manh.long@example.com",
        phone: "0901000008",
        gender: Gender.MALE,
        dateOfBirth: new Date("1993-12-06"),
        position: "QA Engineer",
        status: EmployeeStatus.INACTIVE,
        joinedAt: new Date("2021-06-15"),
    },
    {
        employeeCode: "EMP009",
        fullName: "Vu Khanh Ly",
        email: "vu.khanh.ly@example.com",
        phone: "0901000009",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1997-10-24"),
        position: "UI/UX Designer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-07-03"),
    },
    {
        employeeCode: "EMP010",
        fullName: "Ngo Hoang Nam",
        email: "ngo.hoang.nam@example.com",
        phone: "0901000010",
        gender: Gender.MALE,
        dateOfBirth: new Date("1996-04-18"),
        position: "Backend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2022-10-10"),
    },
    {
        employeeCode: "EMP011",
        fullName: "Phan Mai Anh",
        email: "phan.mai.anh@example.com",
        phone: "0901000011",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1998-08-30"),
        position: "HR Executive",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-09-11"),
    },
    {
        employeeCode: "EMP012",
        fullName: "Mai Duc Phat",
        email: "mai.duc.phat@example.com",
        phone: "0901000012",
        gender: Gender.MALE,
        dateOfBirth: new Date("1995-06-09"),
        position: "Frontend Developer",
        status: EmployeeStatus.INACTIVE,
        joinedAt: new Date("2022-04-25"),
    },
    {
        employeeCode: "EMP013",
        fullName: "Ta Thanh Tam",
        email: "ta.thanh.tam@example.com",
        phone: "0901000013",
        gender: Gender.OTHER,
        dateOfBirth: new Date("1999-01-27"),
        position: "QA Engineer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2024-02-19"),
    },
    {
        employeeCode: "EMP014",
        fullName: "Cao Gia Bao",
        email: "cao.gia.bao@example.com",
        phone: "0901000014",
        gender: Gender.MALE,
        dateOfBirth: new Date("1994-03-14"),
        position: "Backend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2021-12-01"),
    },
    {
        employeeCode: "EMP015",
        fullName: "Dinh Phuong Thao",
        email: "dinh.phuong.thao@example.com",
        phone: "0901000015",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1997-07-31"),
        position: "UI/UX Designer",
        status: EmployeeStatus.INACTIVE,
        joinedAt: new Date("2022-07-18"),
    },
    {
        employeeCode: "EMP016",
        fullName: "Lam Thanh Son",
        email: "lam.thanh.son@example.com",
        phone: "0901000016",
        gender: Gender.MALE,
        dateOfBirth: new Date("1996-10-02"),
        position: "Frontend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2023-05-22"),
    },
    {
        employeeCode: "EMP017",
        fullName: "Truong Nhu Quynh",
        email: "truong.nhu.quynh@example.com",
        phone: "0901000017",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1998-12-13"),
        position: "HR Executive",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2024-03-04"),
    },
    {
        employeeCode: "EMP018",
        fullName: "Huynh Bao Tran",
        email: "huynh.bao.tran@example.com",
        phone: "0901000018",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("1995-02-05"),
        position: "QA Engineer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2021-09-13"),
    },
    {
        employeeCode: "EMP019",
        fullName: "Vo Minh Tuan",
        email: "vo.minh.tuan@example.com",
        phone: "0901000019",
        gender: Gender.MALE,
        dateOfBirth: new Date("1993-05-26"),
        position: "Backend Developer",
        status: EmployeeStatus.INACTIVE,
        joinedAt: new Date("2020-11-09"),
    },
    {
        employeeCode: "EMP020",
        fullName: "Nguyen Thi Yen",
        email: "nguyen.thi.yen@example.com",
        phone: "0901000020",
        gender: Gender.FEMALE,
        dateOfBirth: new Date("2000-09-17"),
        position: "Frontend Developer",
        status: EmployeeStatus.ACTIVE,
        joinedAt: new Date("2024-04-08"),
    },
];

const sampleLeaveRequests: SampleLeaveRequest[] = [
    {
        id: "10000000-0000-4000-8000-000000000001",
        employeeCode: "EMP001",
        leaveType: LeaveType.ANNUAL,
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        endDate: new Date("2026-07-03T00:00:00.000Z"),
        reason: "Nghi phep de giai quyet viec gia dinh.",
        status: LeaveRequestStatus.PENDING,
        reviewedAt: null,
        reviewNote: null,
    },
    {
        id: "10000000-0000-4000-8000-000000000002",
        employeeCode: "EMP002",
        leaveType: LeaveType.SICK,
        startDate: new Date("2026-06-08T00:00:00.000Z"),
        endDate: new Date("2026-06-09T00:00:00.000Z"),
        reason: "Nghi de dieu tri cam sot theo chi dinh cua bac si.",
        status: LeaveRequestStatus.APPROVED,
        reviewedAt: new Date("2026-06-07T08:30:00.000Z"),
        reviewNote: "Da xac nhan thong tin, dong y cho nhan vien nghi benh.",
    },
    {
        id: "10000000-0000-4000-8000-000000000003",
        employeeCode: "EMP003",
        leaveType: LeaveType.UNPAID,
        startDate: new Date("2026-07-13T00:00:00.000Z"),
        endDate: new Date("2026-07-17T00:00:00.000Z"),
        reason: "Nghi khong luong de giai quyet viec ca nhan dai ngay.",
        status: LeaveRequestStatus.REJECTED,
        reviewedAt: new Date("2026-06-15T10:00:00.000Z"),
        reviewNote:
            "Thoi gian nghi trung voi giai doan ban giao du an quan trong.",
    },
    {
        id: "10000000-0000-4000-8000-000000000004",
        employeeCode: "EMP005",
        leaveType: LeaveType.ANNUAL,
        startDate: new Date("2026-08-10T00:00:00.000Z"),
        endDate: new Date("2026-08-12T00:00:00.000Z"),
        reason: "Su dung ngay phep nam cho chuyen di cung gia dinh.",
        status: LeaveRequestStatus.APPROVED,
        reviewedAt: new Date("2026-06-16T09:15:00.000Z"),
        reviewNote: "Lich nghi hop le va da co ke hoach ban giao cong viec.",
    },
    {
        id: "10000000-0000-4000-8000-000000000005",
        employeeCode: "EMP006",
        leaveType: LeaveType.SICK,
        startDate: new Date("2026-06-22T00:00:00.000Z"),
        endDate: new Date("2026-06-22T00:00:00.000Z"),
        reason: "Can nghi mot ngay de kham suc khoe.",
        status: LeaveRequestStatus.PENDING,
        reviewedAt: null,
        reviewNote: null,
    },
    {
        id: "10000000-0000-4000-8000-000000000006",
        employeeCode: "EMP007",
        leaveType: LeaveType.ANNUAL,
        startDate: new Date("2026-07-20T00:00:00.000Z"),
        endDate: new Date("2026-07-24T00:00:00.000Z"),
        reason: "Dang ky nghi phep nam theo ke hoach ca nhan.",
        status: LeaveRequestStatus.REJECTED,
        reviewedAt: new Date("2026-06-17T13:45:00.000Z"),
        reviewNote:
            "Vui long chon thoi gian khac do trung lich phat hanh san pham.",
    },
    {
        id: "10000000-0000-4000-8000-000000000007",
        employeeCode: "EMP009",
        leaveType: LeaveType.UNPAID,
        startDate: new Date("2026-09-01T00:00:00.000Z"),
        endDate: new Date("2026-09-02T00:00:00.000Z"),
        reason: "Nghi khong luong de tham gia khoa hoc ca nhan.",
        status: LeaveRequestStatus.PENDING,
        reviewedAt: null,
        reviewNote: null,
    },
    {
        id: "10000000-0000-4000-8000-000000000008",
        employeeCode: "EMP010",
        leaveType: LeaveType.SICK,
        startDate: new Date("2026-06-11T00:00:00.000Z"),
        endDate: new Date("2026-06-13T00:00:00.000Z"),
        reason: "Nghi phuc hoi suc khoe sau dieu tri.",
        status: LeaveRequestStatus.APPROVED,
        reviewedAt: new Date("2026-06-10T07:50:00.000Z"),
        reviewNote:
            "Dong y nghi theo de nghi va yeu cau cap nhat tien do sau khi quay lai.",
    },
];

const companyDateTime = (date: string, time: string): Date =>
    new Date(`${date}T${time}:00+07:00`);

const attendanceDates = [
    "2026-05-25",
    "2026-05-27",
    "2026-06-02",
    "2026-06-05",
    "2026-06-10",
];

const attendanceEmployeeCodes = [
    "EMP001",
    "EMP002",
    "EMP003",
    "EMP005",
    "EMP006",
];

const presentCheckInTimes = ["07:42", "07:51", "07:58", "08:00"];
const lateCheckInTimes = ["08:07", "08:18", "08:32"];
const checkOutTimes = ["17:05", "17:22", "17:38", "17:52", "18:00"];

const sampleAttendances: SampleAttendance[] = attendanceEmployeeCodes.flatMap(
    (employeeCode, employeeIndex) =>
        attendanceDates.map((attendanceDate, dateIndex) => {
            const isLate = (employeeIndex + dateIndex) % 4 === 0;
            const checkInTime = isLate
                ? lateCheckInTimes[
                      (employeeIndex + dateIndex) % lateCheckInTimes.length
                  ]
                : presentCheckInTimes[
                      (employeeIndex + dateIndex) % presentCheckInTimes.length
                  ];
            const checkOutTime =
                checkOutTimes[
                    (employeeIndex * 2 + dateIndex) % checkOutTimes.length
                ];

            return {
                employeeCode,
                attendanceDate: new Date(
                    `${attendanceDate}T00:00:00.000Z`,
                ),
                checkInTime: companyDateTime(attendanceDate, checkInTime),
                checkOutTime: companyDateTime(attendanceDate, checkOutTime),
                status: isLate
                    ? AttendanceStatus.LATE
                    : AttendanceStatus.PRESENT,
            };
        }),
);

const main = async (): Promise<void> => {
    const password = "12345678";
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: {
            email: "admin@example.com",
        },
        update: {
            passwordHash,
            fullName: "Admin User",
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
        },
        create: {
            email: "admin@example.com",
            passwordHash,
            fullName: "Admin User",
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
        },
    });

    const employee = await prisma.user.upsert({
        where: {
            email: "employee@example.com",
        },
        update: {
            passwordHash,
            fullName: "Employee User",
            role: Role.EMPLOYEE,
            status: UserStatus.ACTIVE,
        },
        create: {
            email: "employee@example.com",
            passwordHash,
            fullName: "Employee User",
            role: Role.EMPLOYEE,
            status: UserStatus.ACTIVE,
        },
    });

    for (const sampleDepartment of sampleDepartments) {
        await prisma.department.upsert({
            where: {
                name: sampleDepartment.name,
            },
            update: {
                description: sampleDepartment.description,
                status: sampleDepartment.status,
            },
            create: {
                name: sampleDepartment.name,
                description: sampleDepartment.description,
                status: sampleDepartment.status,
            },
        });
    }

    for (const sampleEmployee of sampleEmployees) {
        await prisma.employee.upsert({
            where: {
                employeeCode: sampleEmployee.employeeCode,
            },
            update: {
                userId:
                    sampleEmployee.email === employee.email
                        ? employee.id
                        : null,
                fullName: sampleEmployee.fullName,
                email: sampleEmployee.email,
                phone: sampleEmployee.phone,
                gender: sampleEmployee.gender,
                dateOfBirth: sampleEmployee.dateOfBirth,
                position: sampleEmployee.position,
                departmentId: null,
                status: sampleEmployee.status,
                joinedAt: sampleEmployee.joinedAt,
            },
            create: {
                userId:
                    sampleEmployee.email === employee.email
                        ? employee.id
                        : null,
                employeeCode: sampleEmployee.employeeCode,
                fullName: sampleEmployee.fullName,
                email: sampleEmployee.email,
                phone: sampleEmployee.phone,
                gender: sampleEmployee.gender,
                dateOfBirth: sampleEmployee.dateOfBirth,
                position: sampleEmployee.position,
                departmentId: null,
                status: sampleEmployee.status,
                joinedAt: sampleEmployee.joinedAt,
            },
        });
    }

    const relatedEmployeeCodes = [
        ...new Set([
            ...sampleLeaveRequests.map(
                (sampleLeaveRequest) => sampleLeaveRequest.employeeCode,
            ),
            ...sampleAttendances.map(
                (sampleAttendance) => sampleAttendance.employeeCode,
            ),
        ]),
    ];

    const relatedEmployees = await prisma.employee.findMany({
        where: {
            employeeCode: {
                in: relatedEmployeeCodes,
            },
        },
        select: {
            id: true,
            employeeCode: true,
        },
    });

    const employeeIdByCode = new Map(
        relatedEmployees.map((seededEmployee) => [
            seededEmployee.employeeCode,
            seededEmployee.id,
        ]),
    );

    for (const sampleLeaveRequest of sampleLeaveRequests) {
        const employeeId = employeeIdByCode.get(
            sampleLeaveRequest.employeeCode,
        );

        if (!employeeId) {
            throw new Error(
                `Cannot seed leave request: employee ${sampleLeaveRequest.employeeCode} was not found`,
            );
        }

        const reviewedBy =
            sampleLeaveRequest.status === LeaveRequestStatus.PENDING
                ? null
                : admin.id;

        const leaveRequestData = {
            employeeId,
            leaveType: sampleLeaveRequest.leaveType,
            startDate: sampleLeaveRequest.startDate,
            endDate: sampleLeaveRequest.endDate,
            reason: sampleLeaveRequest.reason,
            status: sampleLeaveRequest.status,
            reviewedBy,
            reviewedAt: sampleLeaveRequest.reviewedAt,
            reviewNote: sampleLeaveRequest.reviewNote,
        };

        await prisma.leaveRequest.upsert({
            where: {
                id: sampleLeaveRequest.id,
            },
            update: leaveRequestData,
            create: {
                id: sampleLeaveRequest.id,
                ...leaveRequestData,
            },
        });
    }

    for (const sampleAttendance of sampleAttendances) {
        const employeeId = employeeIdByCode.get(
            sampleAttendance.employeeCode,
        );

        if (!employeeId) {
            throw new Error(
                `Cannot seed attendance: employee ${sampleAttendance.employeeCode} was not found`,
            );
        }

        const attendanceData = {
            checkInTime: sampleAttendance.checkInTime,
            checkOutTime: sampleAttendance.checkOutTime,
            status: sampleAttendance.status,
        };

        await prisma.attendance.upsert({
            where: {
                employeeId_attendanceDate: {
                    employeeId,
                    attendanceDate: sampleAttendance.attendanceDate,
                },
            },
            update: attendanceData,
            create: {
                employeeId,
                attendanceDate: sampleAttendance.attendanceDate,
                ...attendanceData,
            },
        });
    }

    console.log(`Seeded admin user: ${admin.email}`);
    console.log(`Seeded employee user: ${employee.email}`);
    console.log(`Seeded sample departments: ${sampleDepartments.length}`);
    console.log(`Seeded sample employees: ${sampleEmployees.length}`);
    console.log(`Seeded sample leave requests: ${sampleLeaveRequests.length}`);
    console.log(`Seeded sample attendance: ${sampleAttendances.length}`);
    console.log("Seeded credentials:");
    console.log(`ADMIN    -> email: ${admin.email}, password: ${password}`);
    console.log(`EMPLOYEE -> email: ${employee.email}, password: ${password}`);
};

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
