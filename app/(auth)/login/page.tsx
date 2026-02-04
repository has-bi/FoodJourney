"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="w-full max-w-sm">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🍽️</div>
        <h1 className="text-2xl font-bold text-base-content">FoodJourney</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Track your culinary adventures together
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
        <form action={formAction} className="space-y-5">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-3">
              Who are you?
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
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-base-300 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">👨</span>
                  </div>
                  <span className="font-medium text-base-content">Hasbi</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="username"
                  value="nadya"
                  className="peer hidden"
                />
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-base-300 rounded-xl peer-checked:border-secondary peer-checked:bg-secondary/5 transition-all">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl">👩</span>
                  </div>
                  <span className="font-medium text-base-content">Nadya</span>
                </div>
              </label>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter shared password"
              className="w-full px-4 py-3 border border-base-300 rounded-xl bg-base-100 text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              required
            />
          </div>

          {/* Error */}
          {state?.error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-xl p-3 text-center">
              {state.error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-content font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
