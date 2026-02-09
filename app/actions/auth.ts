"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession, verifyPassword } from "@/lib/auth";
import type { Username } from "@/lib/types";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  const username = formData.get("username") as Username;

  if (!password) {
    return { error: "Password jangan kosong, cuy" };
  }

  if (!username || !["hasbi", "nadya"].includes(username)) {
    return { error: "Pilih akun dulu, cuy" };
  }

  // Get password by account (production), fallback to legacy shared password
  const config =
    (await db.appConfig.findUnique({
      where: { key: `password_${username}` },
    })) ||
    (await db.appConfig.findUnique({
      where: { key: "shared_password" },
    }));

  if (!config) {
    return { error: "Sistem belom disetel, kabarin yang ngurus" };
  }

  const isValid = verifyPassword(password, config.value);

  if (!isValid) {
    return { error: "Password lu salah, cek lagi" };
  }

  await createSession(username);
  redirect("/suggested");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
