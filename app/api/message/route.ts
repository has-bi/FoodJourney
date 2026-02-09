import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Belom login nih" },
        { status: 401 }
      );
    }

    const incomingKey = currentUser === "hasbi" ? "message_to_hasbi" : "message_to_nadya";
    const outgoingKey = currentUser === "hasbi" ? "message_to_nadya" : "message_to_hasbi";

    const [incoming, outgoing] = await Promise.all([
      db.appConfig.findUnique({ where: { key: incomingKey } }),
      db.appConfig.findUnique({ where: { key: outgoingKey } }),
    ]);

    return NextResponse.json({
      incomingMessage: incoming?.value ?? "",
      outgoingMessage: outgoing?.value ?? "",
    });
  } catch (error) {
    console.error("Error getting partner message:", error);
    return NextResponse.json(
      { error: "Gagal ngambil pesan pasangan" },
      { status: 500 }
    );
  }
}
