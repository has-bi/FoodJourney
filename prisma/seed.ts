import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

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

  // Per-user password config (bcrypt hash)
  await prisma.appConfig.upsert({
    where: { key: "password_hasbi" },
    update: {
      value: hashSync("tektektek", 10),
    },
    create: {
      key: "password_hasbi",
      value: hashSync("tektektek", 10),
    },
  });

  await prisma.appConfig.upsert({
    where: { key: "password_nadya" },
    update: {
      value: hashSync("cegundengdong", 10),
    },
    create: {
      key: "password_nadya",
      value: hashSync("cegundengdong", 10),
    },
  });

  // Keep legacy shared password key for backward compatibility.
  await prisma.appConfig.upsert({
    where: { key: "shared_password" },
    update: {},
    create: {
      key: "shared_password",
      value: hashSync("foodjourney", 10),
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
