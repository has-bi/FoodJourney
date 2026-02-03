import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default users
  const hasbi = await prisma.user.upsert({
    where: { username: "hasbi" },
    update: {},
    create: {
      username: "hasbi",
      displayName: "Hasbi",
      color: "#6366f1", // Indigo
    },
  });

  const nadya = await prisma.user.upsert({
    where: { username: "nadya" },
    update: {},
    create: {
      username: "nadya",
      displayName: "Nadya",
      color: "#ec4899", // Pink
    },
  });

  console.log("Created users:", { hasbi, nadya });

  // Create app config for shared password
  // Default password is "foodjourney" - should be changed in production
  await prisma.appConfig.upsert({
    where: { key: "shared_password" },
    update: {},
    create: {
      key: "shared_password",
      value: "foodjourney", // Plain text for now, will be hashed by auth system
    },
  });

  console.log("Created app config");
  console.log("Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
