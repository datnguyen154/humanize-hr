import bcrypt from "bcrypt";
import { PrismaClient, Role, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash("12345678", 10);

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

  console.log(`Seeded admin user: ${admin.email}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
