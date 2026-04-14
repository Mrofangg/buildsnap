"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Star, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/projects", icon: LayoutGrid, label: "Projekte" },
  { href: "/marketing", icon: Star, label: "Marketing" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const visibleNav = navItems;

  return (
    <div className="min-h-screen bg-brand-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-brand-black border-b border-brand-black px-4 h-14 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/fanger-logo.png" alt="Fanger" className="h-9 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-brand-black" />
            </div>
            <span className="font-medium text-white/80">
              {user?.displayName?.split(" ")[0]}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4 text-white/60" />
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
                  active ? "text-brand-black" : "text-brand-gray-300 hover:text-brand-gray-500"
                )}
              >
                <div className={cn("w-10 h-6 flex items-center justify-center rounded-full transition-all", active && "bg-brand-yellow")}>
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
