"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import type { Username } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface UserSelectorProps {
  currentUser: Username;
}

export function UserSelector({ currentUser }: UserSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = currentUser === "hasbi" ? "Hasbi" : "Nadya";
  const isHasbi = currentUser === "hasbi";

  const handleLogout = () => {
    startTransition(() => {
      logout();
    });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isHasbi ? "bg-primary" : "bg-secondary"
          )}
        />
        <span>{displayName}</span>
        {isPending ? (
          <Spinner size="xs" className="text-muted-foreground" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border-2 border-border bg-card p-2 shadow-[0_4px_0_0_rgba(61,44,44,0.08)]">
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Akun Aktif
          </p>
          <div className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2 text-sm font-medium text-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", isHasbi ? "bg-primary" : "bg-secondary")} />
            {displayName}
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-destructive/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar Akun
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
