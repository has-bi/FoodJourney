"use client";

import { useTransition } from "react";
import { switchUser, logout } from "@/app/actions/auth";
import type { Username } from "@/lib/types";

interface UserSelectorProps {
  currentUser: Username;
}

export function UserSelector({ currentUser }: UserSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (username: Username) => {
    startTransition(() => {
      switchUser(username);
    });
  };

  const handleLogout = () => {
    startTransition(() => {
      logout();
    });
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            currentUser === "hasbi" ? "bg-primary" : "bg-secondary"
          }`}
        />
        <span className="text-sm font-medium text-base-content capitalize">
          {currentUser}
        </span>
        {isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 mt-2 p-2 shadow-lg bg-base-100 rounded-xl w-44 border border-base-200"
      >
        <li className="px-3 py-1.5 text-xs font-medium text-base-content/50 uppercase tracking-wide">
          Switch User
        </li>
        <li>
          <button
            onClick={() => handleSwitch("hasbi")}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
              currentUser === "hasbi"
                ? "bg-primary/10 text-primary"
                : "hover:bg-base-200 text-base-content"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-sm font-medium">Hasbi</span>
            {currentUser === "hasbi" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </li>
        <li>
          <button
            onClick={() => handleSwitch("nadya")}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
              currentUser === "nadya"
                ? "bg-secondary/10 text-secondary"
                : "hover:bg-base-200 text-base-content"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-sm font-medium">Nadya</span>
            {currentUser === "nadya" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </li>
        <li className="border-t border-base-200 mt-2 pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-error hover:bg-error/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
