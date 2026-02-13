"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

interface LoveLetterModalProps {
  recipientName: string;
}

export function LoveLetterModal({ recipientName }: LoveLetterModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed this session
  useEffect(() => {
    const key = "love-letter-dismissed";
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    // Small delay so the page loads first
    const timer = setTimeout(() => setIsOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setDismissed(true);
    sessionStorage.setItem("love-letter-dismissed", "1");
    dialogRef.current?.close();
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  if (dismissed) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-70 w-full bg-transparent backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-center justify-center p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
          {!isRevealed ? (
            /* === Sealed envelope state === */
            <button
              onClick={() => setIsRevealed(true)}
              className="group w-full cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-3xl border-2 border-secondary/30 bg-linear-to-br from-secondary/10 via-card to-primary/10 p-8 shadow-[0_8px_0_0_rgba(61,44,44,0.1)] transition-all duration-300 group-hover:shadow-[0_12px_0_0_rgba(61,44,44,0.12)] group-hover:-translate-y-1">
                {/* Decorative hearts */}
                <div className="absolute -right-3 -top-3 text-4xl opacity-20 rotate-12">
                  <span>&#10084;&#65039;</span>
                </div>
                <div className="absolute -left-2 -bottom-2 text-3xl opacity-15 -rotate-12">
                  <span>&#10084;&#65039;</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {/* Envelope icon */}
                  <div className="relative">
                    <div className="text-6xl animate-pulse">
                      <span>&#128140;</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-medium text-foreground">
                      Buat kamu, {recipientName}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ada sesuatu buat kamu nih...
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-2 rounded-full border-2 border-secondary/40 bg-secondary/10 px-6 py-2.5 text-sm font-medium text-secondary transition-all group-hover:bg-secondary/20 group-hover:border-secondary/60">
                    Tap untuk buka
                  </div>
                </div>
              </div>
            </button>
          ) : (
            /* === Revealed letter state === */
            <div className="animate-in fade-in zoom-in-95 duration-500 overflow-hidden rounded-3xl border-2 border-secondary/30 bg-card shadow-[0_8px_0_0_rgba(61,44,44,0.1)]">
              {/* Letter header */}
              <div className="border-b border-secondary/20 bg-linear-to-r from-secondary/10 to-primary/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Dari sang maha raja mulia laksana{" "}
                    <span>&#10084;&#65039;</span>
                  </p>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Letter body */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4">
                <p className="text-lg font-medium text-foreground">
                  Hi cegundeng,
                </p>

                <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                  <p>
                    how was this last 2 year? i know its full of{" "}
                    <span className="font-bold text-foreground">BULLLYING</span>{" "}
                    wkwkwk
                  </p>
                  <p>but its also full of joy and happiness, right?</p>

                  <p>
                    have you ever wondered you have so many nicknames?{" "}
                    <span className="italic text-secondary">
                      cegundeng, sambilung, Heru Tamcit, brengsek kecil
                    </span>{" "}
                    and sooooo many more
                  </p>

                  <p>
                    Have you ever wondered always got full when try new food{" "}
                    <br />
                    being <span className="italic">plenger</span>, being{" "}
                    <span className="italic">
                      {"\u201C"}tek tambah nasi ya{"\u201D"}
                    </span>
                    , being{" "}
                    <span className="italic">
                      {"\u201C"}wuihhh shedepp nyoooo{"\u201D"}
                    </span>
                  </p>

                  <p>
                    Have you ever wondered being loved in every your conditions{" "}
                    <br />
                    being ileran, being sariawan for a weeks, and being crying
                    cause of salmon{" "}
                    <span className="text-xs text-muted-foreground">
                      (but still got bullied for sure)
                    </span>
                  </p>

                  <p>
                    Have you ever wondered got bullied <br />
                    and you still feel happy, feel loved, and angry at the same
                    time
                  </p>

                  <p className="pt-2 text-base text-foreground font-medium">
                    but i also never ever wondered have someone like you that
                    truly loved me.
                  </p>

                  <p className="text-base text-primary font-medium">
                    Thank you love.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-3">
                <button
                  onClick={handleClose}
                  className="w-full rounded-full bg-secondary/10 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20"
                >
                  Apasichhhh kamu nih <span>&#128149;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
