"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Clock, Building2, Users, LayoutTemplate, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Permissions } from "@/lib/permissions";

interface SidebarProps {
  permissions: Permissions | null;
  userEmail: string;
}

export function Sidebar({ permissions, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      href: "/battle-cards/new",
      label: "New Battle Card",
      icon: PlusCircle,
      show: permissions?.can_create_battlecards,
    },
    { href: "/history", label: "History", icon: Clock, show: permissions?.can_view_history },
    { href: "/us", label: "Us", icon: Building2, show: permissions?.can_edit_us },
    { href: "/them", label: "Them", icon: Users, show: permissions?.can_edit_them },
    {
      href: "/templates",
      label: "Templates",
      icon: LayoutTemplate,
      show: permissions?.can_manage_templates,
    },
    { href: "/admin", label: "Admin", icon: Settings, show: permissions?.can_manage_users },
  ];

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
        {navLinks
          .filter((link) => link.show)
          .map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
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
