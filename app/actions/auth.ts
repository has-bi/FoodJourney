"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession, verifyPassword, setCurrentUser } from "@/lib/auth";
import type { Username } from "@/lib/types";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  const username = formData.get("username") as Username;

  if (!password) {
    return { error: "Password is required" };
  }

  if (!username || !["hasbi", "nadya"].includes(username)) {
    return { error: "Please select a user" };
  }

  // Get stored password from database
  const config = await db.appConfig.findUnique({
    where: { key: "shared_password" },
  });

  if (!config) {
    return { error: "System not configured" };
  }

  const isValid = verifyPassword(password, config.value);

  if (!isValid) {
    return { error: "Invalid password" };
  }

  await createSession(username);
  redirect("/suggested");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function switchUser(username: Username) {
  await setCurrentUser(username);
}
