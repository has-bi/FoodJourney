"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/suggested", label: "Suggested", icon: "💡" },
  { href: "/planned", label: "Planned", icon: "📋" },
  { href: "/archived", label: "Archived", icon: "📸" },
];

interface TabNavigationProps {
  pendingCount?: number;
}

export function TabNavigation({ pendingCount = 0 }: TabNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="btm-nav btm-nav-sm bg-base-100 border-t border-base-300 safe-bottom">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${pathname === tab.href ? "active text-primary" : "text-base-content/70"}`}
        >
          <span className="text-lg relative">
            {tab.icon}
            {tab.href === "/suggested" && pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 badge badge-xs badge-secondary">
                {pendingCount}
              </span>
            )}
          </span>
          <span className="btm-nav-label text-xs">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}
