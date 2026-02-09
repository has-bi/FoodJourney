import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const username = await getCurrentUser();

    if (!username) {
      return NextResponse.json(
        { error: "Belom login nih" },
        { status: 401 }
      );
    }

    return NextResponse.json({ username });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Gagal ngambil data user" },
      { status: 500 }
    );
  }
}
