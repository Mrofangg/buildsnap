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
    <div className="min-h-screen bg-brand-gray-50">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 bg-brand-black flex-col z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/fanger-logo.png" alt="Fanger" className="h-10 w-auto object-contain" />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
                  active
                    ? "bg-brand-yellow text-brand-black"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-brand-black" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.displayName}
              </p>
              <p className="text-xs text-white/40 truncate capitalize">
                {user?.role}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar (hidden on desktop) ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-brand-black border-b border-brand-black px-4 h-14 flex items-center justify-between max-w-md mx-auto">
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

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-8 lg:ml-60 max-w-md mx-auto lg:max-w-none lg:mx-0">
        <div className="lg:max-w-7xl lg:mx-auto lg:px-6">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-brand-gray-100 safe-area-inset-bottom">
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
