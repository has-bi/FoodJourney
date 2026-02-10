"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import type { Username } from "@/lib/types";
import {
  clearLoveVoucherRedemptions,
  DEFAULT_LOVE_VOUCHERS,
  MAX_LOVE_VOUCHERS,
  getLoveVoucherStatus,
  getLoveVouchersFromConfig,
  normalizeVouchersForSave,
  redeemWeeklyLoveVoucher,
  saveLoveVouchersToConfig,
  type LoveVoucher,
} from "@/lib/love-voucher";

export async function getLoveVoucherStatusAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };

  // Voucher state is shared, but only Nadya can redeem.
  return getLoveVoucherStatus("nadya");
}

export async function redeemLoveVoucherAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };

  const result = await redeemWeeklyLoveVoucher(currentUser as Username);

  if ("success" in result) {
    revalidatePath("/planned");
  }

  return result;
}

function canManageVoucher(currentUser: Username) {
  return currentUser === "hasbi";
}

function normalizeText(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function generateVoucherId(existing: LoveVoucher[]) {
  const existingIds = new Set(existing.map((voucher) => voucher.id));
  let number = existing.length + 1;
  let candidate = `voucher_${String(number).padStart(2, "0")}`;
  while (existingIds.has(candidate)) {
    number += 1;
    candidate = `voucher_${String(number).padStart(2, "0")}`;
  }
  return candidate;
}

export async function createLoveVoucherAction(title: string, description: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };
  if (!canManageVoucher(currentUser)) return { error: "Yang boleh ngatur voucher cuma Hasbi" as const };

  const cleanTitle = normalizeText(title);
  const cleanDescription = normalizeText(description);

  if (!cleanTitle || !cleanDescription) {
    return { error: "Judul dan deskripsi voucher wajib diisi" as const };
  }

  const vouchers = await getLoveVouchersFromConfig();
  if (vouchers.length >= MAX_LOVE_VOUCHERS) {
    return { error: `Maksimal ${MAX_LOVE_VOUCHERS} voucher ya` as const };
  }

  const next = [
    ...vouchers,
    {
      id: generateVoucherId(vouchers),
      title: cleanTitle,
      description: cleanDescription,
    },
  ];

  await saveLoveVouchersToConfig(next);
  revalidatePath("/planned");
  return { success: true as const };
}

export async function updateLoveVoucherAction(voucherId: string, title: string, description: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };
  if (!canManageVoucher(currentUser)) return { error: "Yang boleh ngatur voucher cuma Hasbi" as const };

  const cleanTitle = normalizeText(title);
  const cleanDescription = normalizeText(description);
  if (!cleanTitle || !cleanDescription) {
    return { error: "Judul dan deskripsi voucher wajib diisi" as const };
  }

  const vouchers = await getLoveVouchersFromConfig();
  const exists = vouchers.some((voucher) => voucher.id === voucherId);
  if (!exists) return { error: "Voucher kagak ketemu" as const };

  const next = vouchers.map((voucher) =>
    voucher.id === voucherId
      ? { ...voucher, title: cleanTitle, description: cleanDescription }
      : voucher
  );

  await saveLoveVouchersToConfig(next);
  revalidatePath("/planned");
  return { success: true as const };
}

export async function deleteLoveVoucherAction(voucherId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };
  if (!canManageVoucher(currentUser)) return { error: "Yang boleh ngatur voucher cuma Hasbi" as const };

  const vouchers = await getLoveVouchersFromConfig();
  const next = vouchers.filter((voucher) => voucher.id !== voucherId);
  if (next.length === vouchers.length) {
    return { error: "Voucher kagak ketemu" as const };
  }

  if (next.length === 0) {
    return { error: "Minimal harus ada 1 voucher" as const };
  }

  await saveLoveVouchersToConfig(next);
  revalidatePath("/planned");
  return { success: true as const };
}

export async function resetLoveVouchersAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };
  if (!canManageVoucher(currentUser)) return { error: "Yang boleh ngatur voucher cuma Hasbi" as const };

  await saveLoveVouchersToConfig(normalizeVouchersForSave(DEFAULT_LOVE_VOUCHERS));
  revalidatePath("/planned");
  return { success: true as const };
}

export async function clearLoveVoucherRedemptionsAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi lu abis, login lagi ya" as const };
  if (!canManageVoucher(currentUser)) return { error: "Yang boleh ngatur voucher cuma Hasbi" as const };

  await clearLoveVoucherRedemptions();
  revalidatePath("/planned");
  return { success: true as const };
}
