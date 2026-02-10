import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLoveVoucherStatus } from "@/lib/love-voucher";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Belom login nih" }, { status: 401 });
    }

    // Voucher state is shared, but only Nadya can redeem.
    const status = await getLoveVoucherStatus("nadya");
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("Error getting love voucher status:", error);
    return NextResponse.json({ error: "Gagal ngambil data voucher" }, { status: 500 });
  }
}
