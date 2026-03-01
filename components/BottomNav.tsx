"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/ros", label: "ROs" },
  { href: "/techs", label: "Techs" },
  { href: "/spread", label: "Spread" },
  { href: "/settings", label: "Settings" }
];

export function BottomNav() {
  const path = usePathname();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg/80 backdrop-blur border-t border-white/5 md:hidden">
      <div className="max-w-6xl mx-auto px-3 py-2 flex justify-between">
        {tabs.map(t => {
          const active = path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "px-3 py-2 rounded-xl text-xs",
                active ? "bg-white/10 text-text" : "text-muted"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
