"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Username } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  clearLoveVoucherRedemptionsAction,
  createLoveVoucherAction,
  deleteLoveVoucherAction,
  redeemLoveVoucherAction,
  resetLoveVouchersAction,
  updateLoveVoucherAction,
} from "@/app/actions/loveVoucher";
import { MAX_LOVE_VOUCHERS, type LoveVoucherStatus } from "@/lib/love-voucher";

type VoucherPanel = "weekly" | "history" | "manage";

function formatWeekId(periodKey: string): string {
  // periodKey: YYYYWww
  const match = periodKey.match(/^(\d{4})W(\d{2})$/);
  if (!match) return periodKey;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return periodKey;

  return `Minggu ke-${String(week).padStart(2, "0")} • ${year}`;
}

export function LoveVoucherSection({ currentUser }: { currentUser: Username }) {
  const [status, setStatus] = useState<LoveVoucherStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [spinningText, setSpinningText] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [draftById, setDraftById] = useState<Record<string, { title: string; description: string }>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [manageFeedback, setManageFeedback] = useState<string | null>(null);
  const [isManageError, setIsManageError] = useState(false);
  const [activePanel, setActivePanel] = useState<VoucherPanel>("weekly");

  const spinIntervalRef = useRef<number | null>(null);

  const partnerName = currentUser === "hasbi" ? "Nadya" : "Hasbi";
  const canManage = currentUser === "hasbi";

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/love-voucher", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Gagal ngambil data voucher");
        setStatus(null);
      } else {
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
      setError("Gagal ngambil data voucher");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (spinIntervalRef.current) window.clearInterval(spinIntervalRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!status) return;
    const nextDrafts: Record<string, { title: string; description: string }> = {};
    for (const voucher of status.vouchers) {
      nextDrafts[voucher.id] = {
        title: voucher.title,
        description: voucher.description,
      };
    }
    setDraftById(nextDrafts);
  }, [status]);

  useEffect(() => {
    if (!canManage && activePanel === "manage") {
      setActivePanel("weekly");
    }
  }, [activePanel, canManage]);

  const canRedeem = currentUser === "nadya" && !!status?.canRedeem && !isRedeeming;
  const voucherTitles = status?.vouchers.map((voucher) => voucher.title) || [];

  const startSpin = () => {
    if (spinIntervalRef.current) window.clearInterval(spinIntervalRef.current);
    setResultText(null);
    setSpinningText(voucherTitles[0] || "Voucher...");

    let idx = 0;
    spinIntervalRef.current = window.setInterval(() => {
      idx = (idx + 1) % voucherTitles.length;
      setSpinningText(voucherTitles[idx]);
    }, 70);
  };

  const stopSpinOn = async (finalText: string) => {
    // Let it spin a bit so it feels like a draw.
    await new Promise((r) => setTimeout(r, 1800));
    if (spinIntervalRef.current) window.clearInterval(spinIntervalRef.current);
    spinIntervalRef.current = null;
    setSpinningText(null);
    setResultText(finalText);
  };

  const handleRedeem = async () => {
    if (!status) return;
    if (!canRedeem) return;

    setIsRedeeming(true);
    setError(null);

    startSpin();

    const result = await redeemLoveVoucherAction();

    if ("error" in result) {
      if (spinIntervalRef.current) window.clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
      setSpinningText(null);
      setIsRedeeming(false);
      setError(result.error || "Gagal redeem voucher, coba lagi bentar");
      return;
    }

    const redemption = result.redemption;
    await stopSpinOn(redemption.voucherTitle);

    setIsRedeeming(false);
    await fetchStatus();
  };

  const handleCreate = async () => {
    setManageFeedback(null);
    setIsManageError(false);
    setIsCreating(true);

    const result = await createLoveVoucherAction(newTitle, newDescription);
    setIsCreating(false);

    if ("error" in result) {
      setIsManageError(true);
      setManageFeedback(result.error || "Gagal nambah voucher");
      return;
    }

    setNewTitle("");
    setNewDescription("");
    setManageFeedback("Voucher baru udah ditambahin");
    await fetchStatus();
  };

  const handleSave = async (voucherId: string) => {
    const draft = draftById[voucherId];
    if (!draft) return;

    setManageFeedback(null);
    setIsManageError(false);
    setSavingId(voucherId);

    const result = await updateLoveVoucherAction(voucherId, draft.title, draft.description);
    setSavingId(null);

    if ("error" in result) {
      setIsManageError(true);
      setManageFeedback(result.error || "Gagal update voucher");
      return;
    }

    setManageFeedback("Voucher udah diupdate");
    await fetchStatus();
  };

  const handleDelete = async (voucherId: string) => {
    setManageFeedback(null);
    setIsManageError(false);
    setDeletingId(voucherId);

    const result = await deleteLoveVoucherAction(voucherId);
    setDeletingId(null);

    if ("error" in result) {
      setIsManageError(true);
      setManageFeedback(result.error || "Gagal hapus voucher");
      return;
    }

    setManageFeedback("Voucher udah dihapus");
    await fetchStatus();
  };

  const handleReset = async () => {
    setManageFeedback(null);
    setIsManageError(false);
    setIsResetting(true);

    const result = await resetLoveVouchersAction();
    setIsResetting(false);

    if ("error" in result) {
      setIsManageError(true);
      setManageFeedback(result.error || "Gagal reset voucher");
      return;
    }

    setManageFeedback("Voucher dibalikin ke default");
    await fetchStatus();
  };

  const handleClearRedeemed = async () => {
    const confirmed = window.confirm("Yakin mau clear semua riwayat redeem voucher?");
    if (!confirmed) return;

    setManageFeedback(null);
    setIsManageError(false);
    setIsClearingHistory(true);

    const result = await clearLoveVoucherRedemptionsAction();
    setIsClearingHistory(false);

    if ("error" in result) {
      setIsManageError(true);
      setManageFeedback(result.error || "Gagal clear riwayat voucher");
      return;
    }

    setManageFeedback("Riwayat redeem voucher udah dikosongin");
    setResultText(null);
    setSpinningText(null);
    await fetchStatus();
  };

  return (
    <section className="space-y-5 rounded-[28px] border-2 border-border bg-card p-5 shadow-[0_6px_0_0_rgba(61,44,44,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Love Voucher 🎟️</h2>
          <p className="text-xs text-muted-foreground">
            1 voucher per minggu (zona waktu Jakarta). Random pake spinner, gak bisa milih manual.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-muted/40 px-3 py-2 text-xs sm:justify-start">
          <div className="font-medium text-foreground">{status ? formatWeekId(status.periodKey) : "..."}</div>
          {status && (
            <div className="text-muted-foreground">
              Sisa:{" "}
              <span className="font-medium text-foreground">
                {status.remainingCount}/{status.totalCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" className="text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-foreground/20 bg-destructive/20 p-3 text-sm text-foreground">
          {error}
        </div>
      ) : status ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setActivePanel("weekly")}
              className={cn(
                "min-h-11 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors",
                activePanel === "weekly"
                  ? "border-foreground/40 bg-muted text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Info Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("history")}
              className={cn(
                "min-h-11 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors",
                activePanel === "history"
                  ? "border-foreground/40 bg-muted text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Riwayat
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setActivePanel("manage")}
                className={cn(
                  "col-span-2 min-h-11 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors sm:col-span-1",
                  activePanel === "manage"
                    ? "border-foreground/40 bg-muted text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Atur Voucher
              </button>
            )}
          </div>

          {activePanel === "weekly" && (
            <>
              <div className="rounded-2xl border-2 border-border bg-muted/50 p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Voucher Minggu Ini
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {status.currentPeriodRedemption ? status.currentPeriodRedemption.voucherTitle : "Belom ada yang ke-pick"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {status.currentPeriodRedemption
                    ? status.currentPeriodRedemption.voucherDescription
                    : currentUser === "nadya"
                      ? "Kalau udah siap, pencet tombol redeem ya."
                      : `Nadya yang redeem, lu tinggal nunggu hasilnya aja.`}
                </p>
              </div>

              {(spinningText || resultText) && (
                <div className={cn("rounded-2xl border-2 border-border p-4", spinningText ? "bg-card" : "bg-success/10")}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {spinningText ? "Lagi Muter..." : "Kepilih Nih"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {spinningText || resultText}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {currentUser === "nadya" ? (
                  <Button
                    onClick={handleRedeem}
                    disabled={!status.canRedeem || isRedeeming || status.remainingCount === 0}
                    className="min-h-11 w-full"
                  >
                    {isRedeeming ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="xs" />
                        Muter dulu...
                      </span>
                    ) : status.currentPeriodRedemption ? (
                      "Udah Redeem Minggu Ini"
                    ) : status.remainingCount === 0 ? (
                      "Voucher Udah Abis"
                    ) : (
                      "Redeem Voucher Minggu Ini 🎡"
                    )}
                  </Button>
                ) : (
                  <div className="w-full rounded-2xl border-2 border-border bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
                    Yang bisa redeem cuma {partnerName}.
                  </div>
                )}
              </div>
            </>
          )}

          {activePanel === "history" && (
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                Riwayat Redeem
              </p>
              {status.history.length > 0 ? (
                <div className="space-y-2">
                  {status.history.slice(0, 6).map((h) => (
                    <div key={`${h.periodKey}-${h.voucherId}`} className="flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{h.voucherTitle}</p>
                        <p className="truncate text-muted-foreground">{h.voucherDescription}</p>
                      </div>
                      <div className="shrink-0 text-right text-muted-foreground">
                        {formatWeekId(h.periodKey)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Belom ada riwayat redeem, gas puter dulu pas minggu ini.
                </p>
              )}
            </div>
          )}

          {activePanel === "manage" && canManage && (
            <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Atur Voucher (Hasbi)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isResetting || isClearingHistory}
                    className="min-h-10"
                  >
                    {isResetting ? "Reset..." : "Reset Default"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearRedeemed}
                    disabled={isClearingHistory || isResetting}
                    className="min-h-10"
                  >
                    {isClearingHistory ? "Clearing..." : "Clear Redeemed"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {status.vouchers.map((voucher) => {
                  const draft = draftById[voucher.id] || { title: voucher.title, description: voucher.description };
                  return (
                    <div key={voucher.id} className="rounded-xl border-2 border-border/80 bg-muted/40 p-3">
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          value={draft.title}
                          onChange={(e) =>
                            setDraftById((prev) => ({
                              ...prev,
                              [voucher.id]: { ...draft, title: e.target.value },
                            }))
                          }
                          placeholder="Judul voucher"
                          maxLength={80}
                        />
                        <Input
                          value={draft.description}
                          onChange={(e) =>
                            setDraftById((prev) => ({
                              ...prev,
                              [voucher.id]: { ...draft, description: e.target.value },
                            }))
                          }
                          placeholder="Deskripsi voucher"
                          maxLength={180}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            size="sm"
                            onClick={() => handleSave(voucher.id)}
                            disabled={savingId === voucher.id}
                            className="min-h-10 sm:flex-1"
                          >
                            {savingId === voucher.id ? "Nyimpen..." : "Simpan"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(voucher.id)}
                            disabled={deletingId === voucher.id || status.vouchers.length <= 1}
                            className="min-h-10 sm:flex-1"
                          >
                            {deletingId === voucher.id ? "Ngapus..." : "Hapus"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border-2 border-border/80 bg-muted/40 p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Tambah voucher ({status.vouchers.length}/{MAX_LOVE_VOUCHERS})
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Judul voucher baru"
                    maxLength={80}
                  />
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Deskripsi voucher baru"
                    maxLength={180}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={isCreating || status.vouchers.length >= MAX_LOVE_VOUCHERS}
                    className="min-h-10"
                  >
                    {isCreating ? "Nambah..." : "Tambah Voucher"}
                  </Button>
                </div>
              </div>

              {manageFeedback && (
                <p className={cn("text-xs", isManageError ? "text-destructive" : "text-success")}>
                  {manageFeedback}
                </p>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
