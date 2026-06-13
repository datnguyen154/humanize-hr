import bcrypt from "bcrypt";
import { PrismaClient, Role, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log(`Seeded admin user: ${admin.email}`);
  console.log(`Seeded employee user: ${employee.email}`);
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
