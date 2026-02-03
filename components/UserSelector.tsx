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
        className="btn btn-ghost btn-sm gap-2"
      >
        <span
          className={`w-3 h-3 rounded-full ${
            currentUser === "hasbi" ? "bg-indigo-500" : "bg-pink-500"
          }`}
        ></span>
        <span className="capitalize">{currentUser}</span>
        {isPending && <span className="loading loading-spinner loading-xs"></span>}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-40"
      >
        <li className="menu-title">
          <span>Switch User</span>
        </li>
        <li>
          <button
            onClick={() => handleSwitch("hasbi")}
            className={currentUser === "hasbi" ? "active" : ""}
          >
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            Hasbi
          </button>
        </li>
        <li>
          <button
            onClick={() => handleSwitch("nadya")}
            className={currentUser === "nadya" ? "active" : ""}
          >
            <span className="w-3 h-3 rounded-full bg-pink-500"></span>
            Nadya
          </button>
        </li>
        <div className="divider my-1"></div>
        <li>
          <button onClick={handleLogout} className="text-error">
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
