import type { Username } from "@/lib/types";
import { db } from "@/lib/db";
import { randomInt } from "crypto";

export type LoveVoucher = {
  id: string;
  title: string;
  description: string;
};

const LOVE_VOUCHERS_CONFIG_KEY = "love_vouchers";
export const MAX_LOVE_VOUCHERS = 12;

export const DEFAULT_LOVE_VOUCHERS: LoveVoucher[] = [
  {
    id: "voucher_01",
    title: "Eskrim",
    description: "Yang dinging dinging shedep nihhh.",
  },
  {
    id: "voucher_02",
    title: "Snack Asin",
    description: "Bertransaksi permicinan untuk pribadi itu.",
  },
  {
    id: "voucher_03",
    title: "Dessert Manis",
    description: "Camilan manis semanis orang Ciamis.",
  },
  {
    id: "voucher_04",
    title: "Bioskop",
    description: "Kita nonton film yang ada di bioskop, tapi random.",
  },
  {
    id: "voucher_05",
    title: "Jajan",
    description: "Beli 1 snack random, yang enak yang beli minum.",
  },
  {
    id: "voucher_06",
    title: "Ngopagg",
    description: "Kite ngopag dulu cuy, dimane aje.",
  },
  {
    id: "voucher_07",
    title: "Piknik",
    description: "Berjemur dibawah sinar mentari sore hari.",
  },
  {
    id: "voucher_08",
    title: "Peluk",
    description: "Boleh peluk 30 detik.",
  },
  {
    id: "voucher_09",
    title: "Ter.se.rah",
    description: "Bebas ngapain aja, tapi jangan mahal-mahal plissss.",
  },
  {
    id: "voucher_10",
    title: "Tatap-tatapan",
    description: "Yang ketawa atau senyum duluan beliin jajan wkwkkw.",
  },
];

const TERSERAH_WEIGHT_BPS = 500; // 0.05
const WEIGHT_SCALE_BPS = 10000;

function normalizeVoucherText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isTerserahVoucher(voucher: LoveVoucher): boolean {
  const titleKey = normalizeVoucherText(voucher.title);
  const descriptionKey = normalizeVoucherText(voucher.description);
  return titleKey.includes("terserah") || descriptionKey.includes("terserah");
}

function pickVoucherWithWeights(remaining: LoveVoucher[]): LoveVoucher {
  if (remaining.length <= 1) return remaining[0];

  const terserahVoucher = remaining.find(isTerserahVoucher);
  if (!terserahVoucher) {
    return remaining[randomInt(remaining.length)];
  }

  const others = remaining.filter((voucher) => voucher.id !== terserahVoucher.id);
  if (others.length === 0) {
    return terserahVoucher;
  }

  const shouldPickTerserah = randomInt(WEIGHT_SCALE_BPS) < TERSERAH_WEIGHT_BPS;
  if (shouldPickTerserah) {
    return terserahVoucher;
  }

  return others[randomInt(others.length)];
}

function sanitizeVoucher(voucher: LoveVoucher): LoveVoucher {
  return {
    id: voucher.id.trim(),
    title: voucher.title.replace(/\r?\n/g, " ").trim(),
    description: voucher.description.replace(/\r?\n/g, " ").trim(),
  };
}

function isVoucherValid(voucher: LoveVoucher): boolean {
  return Boolean(voucher.id) && Boolean(voucher.title) && Boolean(voucher.description);
}

function parseLoveVouchers(raw: string | null | undefined): LoveVoucher[] {
  if (!raw) return DEFAULT_LOVE_VOUCHERS;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_LOVE_VOUCHERS;

    const mapped = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const id = (item as Record<string, unknown>).id;
        const title = (item as Record<string, unknown>).title;
        const description = (item as Record<string, unknown>).description;
        if (typeof id !== "string" || typeof title !== "string" || typeof description !== "string") {
          return null;
        }
        return sanitizeVoucher({ id, title, description });
      })
      .filter((item): item is LoveVoucher => Boolean(item && isVoucherValid(item)));

    if (mapped.length === 0) return DEFAULT_LOVE_VOUCHERS;

    return mapped.slice(0, MAX_LOVE_VOUCHERS);
  } catch {
    return DEFAULT_LOVE_VOUCHERS;
  }
}

function dedupeVoucherIds(vouchers: LoveVoucher[]): LoveVoucher[] {
  const used = new Set<string>();
  const result: LoveVoucher[] = [];

  for (const voucher of vouchers) {
    const clean = sanitizeVoucher(voucher);
    if (!isVoucherValid(clean)) continue;
    if (used.has(clean.id)) continue;
    used.add(clean.id);
    result.push(clean);
  }

  return result;
}

export function normalizeVouchersForSave(vouchers: LoveVoucher[]): LoveVoucher[] {
  return dedupeVoucherIds(vouchers).slice(0, MAX_LOVE_VOUCHERS);
}

export async function getLoveVouchersFromConfig(): Promise<LoveVoucher[]> {
  const config = await db.appConfig.findUnique({
    where: { key: LOVE_VOUCHERS_CONFIG_KEY },
  });

  return parseLoveVouchers(config?.value);
}

export async function saveLoveVouchersToConfig(vouchers: LoveVoucher[]) {
  const normalized = normalizeVouchersForSave(vouchers);
  await db.appConfig.upsert({
    where: { key: LOVE_VOUCHERS_CONFIG_KEY },
    update: { value: JSON.stringify(normalized) },
    create: { key: LOVE_VOUCHERS_CONFIG_KEY, value: JSON.stringify(normalized) },
  });
}

function toJakartaDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  return { year, month, day };
}

function getIsoWeekKey(year: number, month: number, day: number): string {
  const dateUtc = new Date(Date.UTC(year, month - 1, day));
  let dayNumber = dateUtc.getUTCDay();
  if (dayNumber === 0) dayNumber = 7;

  dateUtc.setUTCDate(dateUtc.getUTCDate() + 4 - dayNumber);
  const weekYear = dateUtc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil(((dateUtc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${weekYear}W${String(weekNumber).padStart(2, "0")}`;
}

export function getJakartaWeekKey(date: Date = new Date()): string {
  const { year, month, day } = toJakartaDateParts(date);
  return getIsoWeekKey(year, month, day);
}

export type LoveVoucherStatus = {
  vouchers: LoveVoucher[];
  periodKey: string;
  totalCount: number;
  redeemedCount: number;
  remainingCount: number;
  canRedeem: boolean;
  currentPeriodRedemption: null | {
    voucherId: string;
    voucherTitle: string;
    voucherDescription: string;
    redeemedAt: string;
    periodKey: string;
    redeemedBy: string;
  };
  history: Array<{
    voucherId: string;
    voucherTitle: string;
    voucherDescription: string;
    redeemedAt: string;
    periodKey: string;
    redeemedBy: string;
  }>;
};

export async function getLoveVoucherStatus(redeemer: Username): Promise<LoveVoucherStatus> {
  const periodKey = getJakartaWeekKey();
  const vouchers = await getLoveVouchersFromConfig();

  const [currentPeriod, history, redeemedAll] = await Promise.all([
    db.loveVoucherRedemption.findUnique({
      where: { redeemerMonthKey: { redeemedBy: redeemer, monthKey: periodKey } },
    }),
    db.loveVoucherRedemption.findMany({
      where: { redeemedBy: redeemer },
      orderBy: { redeemedAt: "desc" },
      take: 24,
    }),
    db.loveVoucherRedemption.findMany({
      select: { voucherId: true },
    }),
  ]);

  const redeemedIds = new Set(redeemedAll.map((r) => r.voucherId));
  const totalCount = vouchers.length;
  const redeemedCount = vouchers.filter((voucher) => redeemedIds.has(voucher.id)).length;
  const remainingCount = Math.max(0, totalCount - redeemedCount);

  const canRedeem = !currentPeriod && remainingCount > 0;

  return {
    vouchers,
    periodKey,
    totalCount,
    redeemedCount,
    remainingCount,
    canRedeem,
    currentPeriodRedemption: currentPeriod
      ? {
          voucherId: currentPeriod.voucherId,
          voucherTitle: currentPeriod.voucherTitle,
          voucherDescription: currentPeriod.voucherDescription,
          redeemedAt: currentPeriod.redeemedAt.toISOString(),
          periodKey: currentPeriod.monthKey,
          redeemedBy: currentPeriod.redeemedBy,
        }
      : null,
    history: history.map((h) => ({
      voucherId: h.voucherId,
      voucherTitle: h.voucherTitle,
      voucherDescription: h.voucherDescription,
      redeemedAt: h.redeemedAt.toISOString(),
      periodKey: h.monthKey,
      redeemedBy: h.redeemedBy,
    })),
  };
}

export async function redeemWeeklyLoveVoucher(redeemer: Username) {
  if (redeemer !== "nadya") {
    return { error: "Yang boleh redeem voucher cuma Nadya ya, cuy" as const };
  }

  const periodKey = getJakartaWeekKey();

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.loveVoucherRedemption.findUnique({
        where: { redeemerMonthKey: { redeemedBy: redeemer, monthKey: periodKey } },
      });

      if (existing) {
        return { existing, created: false as const };
      }

      const redeemed = await tx.loveVoucherRedemption.findMany({
        select: { voucherId: true },
      });
      const config = await tx.appConfig.findUnique({
        where: { key: LOVE_VOUCHERS_CONFIG_KEY },
      });
      const redeemedIds = new Set(redeemed.map((r) => r.voucherId));
      const vouchers = parseLoveVouchers(config?.value);
      const remaining = vouchers.filter((v) => !redeemedIds.has(v.id));

      if (remaining.length === 0) {
        return { error: "Voucher udah abis semua, nanti bikin batch baru ya" as const };
      }

      const picked = pickVoucherWithWeights(remaining);

      const created = await tx.loveVoucherRedemption.create({
        data: {
          voucherId: picked.id,
          voucherTitle: picked.title,
          voucherDescription: picked.description,
          monthKey: periodKey,
          redeemedBy: redeemer,
        },
      });

      return { created, picked, createdNew: true as const };
    });

    // Existing redemption this week
    if ("existing" in result) {
      const r = result.existing;
      if (!r) {
        return { error: "Gagal redeem voucher, coba lagi bentar" as const };
      }
      return {
        success: true as const,
        alreadyRedeemedThisPeriod: true as const,
        redemption: {
          voucherId: r.voucherId,
          voucherTitle: r.voucherTitle,
          voucherDescription: r.voucherDescription,
          redeemedAt: r.redeemedAt.toISOString(),
          periodKey: r.monthKey,
          redeemedBy: r.redeemedBy,
        },
      };
    }

    if ("error" in result) {
      return { error: result.error };
    }

    if (!("created" in result) || !result.created) {
      return { error: "Gagal redeem voucher, coba lagi bentar" as const };
    }

    const r = result.created;
    return {
      success: true as const,
      alreadyRedeemedThisPeriod: false as const,
      redemption: {
        voucherId: r.voucherId,
        voucherTitle: r.voucherTitle,
        voucherDescription: r.voucherDescription,
        redeemedAt: r.redeemedAt.toISOString(),
        periodKey: r.monthKey,
        redeemedBy: r.redeemedBy,
      },
    };
  } catch (error) {
    console.error("Error redeeming love voucher:", error);
    return { error: "Gagal redeem voucher, coba lagi bentar" as const };
  }
}

export async function clearLoveVoucherRedemptions() {
  await db.loveVoucherRedemption.deleteMany({});
}
