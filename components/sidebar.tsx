"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Clock, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin: boolean;
  userEmail: string;
}

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/battle-cards/new", label: "New Battle Card", icon: PlusCircle },
  { href: "/history", label: "History", icon: Clock },
];

export function Sidebar({ isAdmin, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Image src="/genea-logo.svg" alt="Genea" width={100} height={18} priority />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-blue-ice text-brand-blue"
                  : "text-gray-text hover:bg-gray-50 hover:text-brand-navy"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin/competitors"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-brand-blue-ice text-brand-blue"
                : "text-gray-text hover:bg-gray-50 hover:text-brand-navy"
            )}
          >
            <Settings size={18} />
            Admin
          </Link>
        )}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-gray-200 px-3 py-4">
        <p className="mb-2 truncate px-3 text-xs text-gray-400">{userEmail}</p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-text transition-colors hover:bg-gray-50 hover:text-brand-navy"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
