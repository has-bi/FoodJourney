"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-sm">
      <div className="card-body">
        <h1 className="card-title text-2xl font-bold text-center justify-center">
          FoodJourney
        </h1>
        <p className="text-center text-base-content/70 mb-4">
          Track your culinary adventures together
        </p>

        <form action={formAction} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Who are you?</span>
            </label>
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="radio"
                  name="username"
                  value="hasbi"
                  className="peer hidden"
                  defaultChecked
                />
                <div className="btn btn-outline w-full peer-checked:btn-primary peer-checked:text-primary-content">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
                  Hasbi
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="username"
                  value="nadya"
                  className="peer hidden"
                />
                <div className="btn btn-outline w-full peer-checked:btn-secondary peer-checked:text-secondary-content">
                  <span className="w-3 h-3 rounded-full bg-pink-500 mr-2"></span>
                  Nadya
                </div>
              </label>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter shared password"
              className="input input-bordered w-full"
              required
            />
          </div>

          {state?.error && (
            <div className="alert alert-error">
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Enter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
