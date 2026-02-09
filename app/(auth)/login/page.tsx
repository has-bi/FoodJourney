"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="w-full max-w-sm">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <Image src="/assets/pixel-plate.svg" alt="" aria-hidden="true" width={56} height={56} className="mx-auto mb-3 h-14 w-14" />
        <h1 className="text-2xl font-medium text-foreground">FoodJourney</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catetan kuliner bareng pasangan, auto anti bingung 🔥
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
        <form action={formAction} className="space-y-5">
          {/* User Selection */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              Lu login jadi siapa?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="username"
                  value="hasbi"
                  className="peer hidden"
                  defaultChecked
                />
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border p-4 transition-all peer-checked:border-foreground/40 peer-checked:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <span className="text-2xl">👨</span>
                  </div>
                  <span className="font-medium text-foreground">Hasbi</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="username"
                  value="nadya"
                  className="peer hidden"
                />
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border p-4 transition-all peer-checked:border-foreground/40 peer-checked:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <span className="text-2xl">👩</span>
                  </div>
                  <span className="font-medium text-foreground">Nadya</span>
                </div>
              </label>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Password Rahasia
            </label>
            <Input
              type="password"
              name="password"
              placeholder="Masukin password lu..."
              required
            />
          </div>

          {/* Error */}
          {state?.error && (
            <div className="rounded-2xl border-2 border-foreground/20 bg-destructive/30 p-3 text-center text-sm text-foreground">
              {state.error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="h-11 w-full" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Bentar...
              </span>
            ) : (
              "Masuk! 🚀"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
