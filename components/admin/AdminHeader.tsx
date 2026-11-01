"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, Bell, LogOut, UserCircle } from "lucide-react";
import { AuthUser } from "@/types/user";
import { ThemeModeDropdown } from "@/components/theme/ThemeModeDropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/admin/NotificationBell";

interface AdminHeaderProps {
  user: AuthUser | null;
  onMenu: () => void;
  notifCount?: number;
}

export function AdminHeader({ user, onMenu, notifCount = 0 }: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isJamiila =
    user?.username === "jamiila" ||
    Boolean(user?.name && user.name.toLowerCase().includes("jamiila")) ||
    Boolean(user?.email && user.email.toLowerCase().includes("jamiila"));
  const displayName = user?.username
    ? `@${user.username}`
    : isJamiila
    ? "@jamiila"
    : user?.name || "Administrator";
  const displayTitle = isJamiila ? "Dean of CS & IT" : user?.role || "Administrator";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="lg:hidden px-2" onClick={onMenu}>
          <Menu className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Search className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell initialCount={notifCount} basePath="/admin" />

        <ThemeModeDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 px-2 sm:px-2.5 gap-2 rounded-full hover:bg-accent border border-border/60 transition-all shrink-0"
            >
              <Avatar className="h-7 w-7 ring-1 ring-primary/30">
                {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-[#0875D1] to-[#08245C] text-white font-bold text-xs">
                  {user?.name ? user.name.charAt(0) : "J"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-foreground">
                  {displayName}
                </span>
                <span className="text-[10px] font-semibold text-[#0875D1] dark:text-sky-400">
                  {displayTitle}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-muted/60 border border-border/50">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-sm font-bold text-foreground">
                    {displayName}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary">
                    {isJamiila ? "ADMIN" : user?.role || "ADMIN"}
                  </span>
                </div>
                {isJamiila ? (
                  <p className="text-xs font-bold text-[#0875D1] dark:text-sky-400">
                    Dean of CS & IT
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground break-all">
                  {user?.email || "jamiila@janic.edu.so"}
                </p>
                {isJamiila && (
                  <div className="mt-1 pt-1.5 border-t border-border/40">
                    <p className="text-[10px] font-extrabold text-[#0875D1] dark:text-sky-400 uppercase tracking-wider">
                      Dean, Faculty of CS & IT • System Admin
                    </p>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/admin/profile" className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
