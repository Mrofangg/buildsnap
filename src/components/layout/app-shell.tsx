"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Star, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/projects", icon: LayoutGrid, label: "Projekte" },
  { href: "/marketing", icon: Star, label: "Marketing", roles: ["admin", "marketing"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-brand-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-brand-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
            <span className="text-xs font-black text-brand-black">B</span>
          </div>
          <span className="font-black text-brand-black tracking-tight text-lg">
            BuildSnap
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-brand-gray-400">
            <div className="w-6 h-6 bg-brand-black rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-brand-yellow" />
            </div>
            <span className="font-medium text-brand-gray-600">
              {user?.displayName?.split(" ")[0]}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-brand-gray-100 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4 text-brand-gray-400" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-brand-gray-100 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-6 py-2 rounded-2xl transition-all",
                  active
                    ? "text-brand-black"
                    : "text-brand-gray-300 hover:text-brand-gray-500"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-6 flex items-center justify-center rounded-full transition-all",
                    active && "bg-brand-yellow"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
