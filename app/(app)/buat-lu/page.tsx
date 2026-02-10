"use client";

import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import { setPartnerMessage } from "@/app/actions/message";
import { LoveVoucherSection } from "@/components/LoveVoucherSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Username } from "@/lib/types";

export default function BuatLuPage() {
  const [currentUser, setCurrentUser] = useState<Username>("hasbi");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [isMessageError, setIsMessageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMessage, startSavingMessage] = useTransition();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRes, messageRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/message"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.username);
      }

      if (messageRes.ok) {
        const messageData = await messageRes.json();
        setIncomingMessage(messageData.incomingMessage || "");
        setMessageDraft(messageData.outgoingMessage || "");
      }
    } catch (error) {
      console.error("Error fetching buat-lu data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const partnerName = currentUser === "hasbi" ? "Nadya" : "Hasbi";

  const handleMessageSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessageFeedback(null);

    startSavingMessage(async () => {
      const result = await setPartnerMessage(messageDraft);

      if (result?.error) {
        setIsMessageError(true);
        setMessageFeedback(result.error);
        return;
      }

      setIsMessageError(false);
      setMessageFeedback("Pesan lu kekirim ke doi");
      await fetchData();
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border-2 border-border bg-card p-4 shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Private Space</p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">Buat lu 💌</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tempat ngobrol singkat, redeem voucher, dan keep things sweet.
            </p>
          </div>
          <span className={`text-xs ${currentUser === "hasbi" ? "text-primary" : "text-secondary"}`}>
            Akun aktif: {currentUser === "hasbi" ? "Hasbi" : "Nadya"}
          </span>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border-2 border-border bg-card p-4 shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pesan Kilat</p>
        <div className="rounded-2xl border-2 border-border bg-muted/50 p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Pesan Dari {partnerName}
          </p>
          <p className="mt-2 min-h-10 text-sm leading-relaxed text-foreground">
            {incomingMessage || "Belom ada pesan masuk nih."}
          </p>
        </div>

        <form onSubmit={handleMessageSubmit} className="space-y-3">
          <label htmlFor="partner-message" className="block text-sm font-medium text-foreground">
            Kirim Pesan Kilat Buat {partnerName}
          </label>
          <div className="flex flex-col gap-2">
            <Input
              id="partner-message"
              maxLength={120}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value.replace(/\r?\n/g, " "))}
              placeholder="Contoh: Nanti malem gas kesini ya"
            />
            <Button type="submit" size="sm" disabled={isSavingMessage} className="w-full">
              {isSavingMessage ? "Ngirim..." : "Kirim"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">1 baris doang, maksimal 120 karakter.</p>
          {messageFeedback && (
            <p className={cn("text-xs", isMessageError ? "text-destructive" : "text-success")}>
              {messageFeedback}
            </p>
          )}
        </form>
      </section>

      <LoveVoucherSection currentUser={currentUser} />
    </div>
  );
}
