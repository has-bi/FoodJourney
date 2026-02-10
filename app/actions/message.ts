"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_MESSAGE_LENGTH = 120;

export async function setPartnerMessage(rawMessage: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "Sesi lu abis, login lagi ya" };
  }

  const message = rawMessage.replace(/\r?\n/g, " ").trim();

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Pesan kepanjangan, maksimal ${MAX_MESSAGE_LENGTH} karakter` };
  }

  const targetKey = currentUser === "hasbi" ? "message_to_nadya" : "message_to_hasbi";

  try {
    await db.appConfig.upsert({
      where: { key: targetKey },
      update: { value: message },
      create: { key: targetKey, value: message },
    });

    revalidatePath("/buat-lu");
    revalidatePath("/planned");
    return { success: true };
  } catch (error) {
    console.error("Error saving partner message:", error);
    return { error: "Gagal ngirim pesan, coba lagi bentar" };
  }
}
