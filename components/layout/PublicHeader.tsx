"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, UserCircle, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeModeDropdown } from "@/components/theme/ThemeModeDropdown";
import { useUser, useClerk } from "@clerk/nextjs";
import type { AuthUser } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface SubNavItem {
  name: string;
  href: string;
}

export interface NavItem {
  id: string;
  name: string;
  href: string;
  subLinks?: SubNavItem[];
}

export const defaultNavStructure: NavItem[] = [
  {
    id: "about",
    name: "About JANIC",
    href: "/about",
    subLinks: [
      { name: "About JANIC", href: "/about" },
      { name: "What We Do", href: "/what-we-do" },
    ],
  },
  {
    id: "hubs",
    name: "Hubs",
    href: "/hubs",
    subLinks: [
      { name: "All Hubs & Programmes", href: "/hubs" },
      { name: "Innovation Pipeline", href: "/innovation-hub" },
    ],
  },
  {
    id: "projects",
    name: "Innovations",
    href: "/projects",
    subLinks: [
      { name: "Featured Projects", href: "/projects" },
      { name: "Project Members & Teams", href: "/project-members" },
      { name: "Submit Innovation", href: "/submit-innovation" },
    ],
  },
  {
    id: "resources",
    name: "Resources",
    href: "/training",
    subLinks: [
      { name: "Training & Workshops", href: "/training" },
      { name: "Events & News", href: "/events" },
      { name: "Research & Publications", href: "/research" },
      { name: "Downloads & Forms", href: "/resources/downloads" },
      { name: "Opportunities", href: "/resources/opportunities" },
      { name: "Sponsors", href: "/sponsors" },
      { name: "Articles & Posts", href: "/posts" },
      { name: "FAQs", href: "/faq" },
    ],
  },
  {
    id: "partnerships",
    name: "Partnerships",
    href: "/partnerships",
    subLinks: [
      { name: "Partnerships", href: "/partnerships" },
      { name: "Community Service", href: "/community-services" },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    href: "/contact",
  },
];

interface PublicHeaderProps {
  navLinks?: { name: string; href: string }[];
  currentUser?: AuthUser | null;
}

function getUserInitial(name: string): string {
  if (!name || name.length === 0) return "U";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "U";
  return trimmed.charAt(0).toUpperCase();
}

interface UserAvatarMenuProps {
  user: AuthUser;
  loggingOut: boolean;
  onLogout: () => void;
}

function UserAvatarMenu({ user, loggingOut, onLogout }: UserAvatarMenuProps) {
  const router = useRouter();
  const initial = getUserInitial(user.name);
  const isJamiila =
    user.username === "jamiila" ||
    user.name.toLowerCase().includes("jamiila") ||
    user.email?.toLowerCase().includes("jamiila");
  const usernameDisplay = user.username ? `@${user.username}` : (isJamiila ? "@jamiila" : user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-all shadow-xs shrink-0 group"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8 xl:h-8.5 xl:w-8.5 ring-2 ring-[#0875D1]/30">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[#0875D1] to-[#08245C] text-white font-bold text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[11px] font-extrabold text-[#08245C] dark:text-slate-100 group-hover:text-[#0875D1] transition-colors">
              {usernameDisplay}
            </span>
            <span className="text-[9px] font-bold text-[#0875D1] dark:text-sky-400 tracking-tight">
              {isJamiila ? "Dean of CS & IT" : user.role}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_20px_45px_-12px_rgba(8,36,92,0.25)] backdrop-blur-xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal rounded-lg bg-gradient-to-br from-[#F5F9FF] via-white to-[#E9F3FD] dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-3 mb-1 border border-slate-100/80 dark:border-slate-800/80">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between gap-1.5">
              <p className="text-sm font-bold leading-none text-[#08245C] dark:text-slate-100">
                {usernameDisplay}
              </p>
              <span className="px-2 py-0.5 rounded-full bg-[#0875D1]/15 text-[#0875D1] dark:text-sky-300 text-[9px] font-black uppercase tracking-wider">
                {isJamiila ? "ADMIN" : user.role}
              </span>
            </div>
            {isJamiila ? (
              <p className="text-xs font-bold text-[#0875D1] dark:text-sky-400">
                Dean of CS & IT
              </p>
            ) : null}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
              {user.email}
            </p>
            <p className="inline-flex items-center w-fit mt-1 px-2 py-0.5 rounded-full bg-[#08245C] dark:bg-[#0875D1] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
              {isJamiila ? "Dean of CS & IT • System Admin" : (user.role as string) === "USER" ? "Member" : user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
        <DropdownMenuItem
          onClick={() => router.push("/account/registrations")}
          className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#E9F3FD] hover:to-white dark:hover:from-slate-900 dark:hover:to-slate-800 focus:bg-gradient-to-r focus:from-[#E9F3FD] focus:to-white dark:focus:from-slate-900 dark:focus:to-slate-800 hover:text-[#08245C] dark:hover:text-white transition-colors"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0875D1]/10 to-[#08245C]/10 dark:from-[#0875D1]/15 dark:to-[#08245C]/15">
            <Ticket className="h-4 w-4 text-[#0875D1]" />
          </span>
          <span className="text-sm font-bold">My Event Registration</span>
        </DropdownMenuItem>
        {(user.role as string) !== "USER" && (
          <>
            <DropdownMenuItem
              onClick={() => router.push(user.role === "STAFF" ? "/staff/profile" : "/admin/profile")}
              className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#E9F3FD] hover:to-white dark:hover:from-slate-900 dark:hover:to-slate-800 focus:bg-gradient-to-r focus:from-[#E9F3FD] focus:to-white dark:focus:from-slate-900 dark:focus:to-slate-800 hover:text-[#08245C] dark:hover:text-white transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0875D1]/10 to-[#08245C]/10 dark:from-[#0875D1]/15 dark:to-[#08245C]/15">
                <UserCircle className="h-4 w-4 text-[#0875D1]" />
              </span>
              <span className="text-sm font-bold">My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(user.role === "STAFF" ? "/staff/dashboard" : "/admin/dashboard")}
              className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#E9F3FD] hover:to-white dark:hover:from-slate-900 dark:hover:to-slate-800 focus:bg-gradient-to-r focus:from-[#E9F3FD] focus:to-white dark:focus:from-slate-900 dark:focus:to-slate-800 hover:text-[#08245C] dark:hover:text-white transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0875D1]/10 to-[#08245C]/10 dark:from-[#0875D1]/15 dark:to-[#08245C]/15">
                <LayoutDashboard className="h-4 w-4 text-[#0875D1]" />
              </span>
              <span className="text-sm font-bold">Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
          </>
        )}
        <DropdownMenuItem
          onClick={onLogout}
          disabled={loggingOut}
          className="text-red-600 focus:text-red-600 cursor-pointer gap-2 rounded-lg px-2.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 transition-colors"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40">
            <LogOut className="h-4 w-4 text-red-600" />
          </span>
          <span className="text-sm font-bold">
            {loggingOut ? "Logging out..." : "Log out"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicHeader({ currentUser }: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedSections, setMobileExpandedSections] = useState<Record<string, boolean>>({
    about: false,
    hubs: false,
    projects: false,
    resources: false,
    partnerships: false,
  });
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user: clerkUser, isSignedIn: isClerkSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const activeUser: AuthUser | null = currentUser || (isClerkSignedIn && clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress || "Member",
    username: clerkUser.username || clerkUser.firstName?.toLowerCase() || "member",
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    role: "USER" as any,
    avatar: clerkUser.imageUrl,
  } : null);
  const isLoggedIn = Boolean(activeUser);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isClerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (email) {
        fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: clerkUser.fullName || clerkUser.username || "Member",
            username: clerkUser.username || email.split("@")[0],
            avatar: clerkUser.imageUrl,
          }),
        }).catch(() => { });
      }
    }
  }, [isClerkSignedIn, clerkUser?.id]);

  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (isClerkSignedIn) {
        await clerkSignOut();
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === "/projects") {
      return (
        pathname === "/projects" ||
        (pathname.startsWith("/projects/") && !pathname.includes("/members"))
      );
    }
    if (href === "/project-members") {
      return (
        pathname === "/project-members" ||
        pathname.startsWith("/project-members") ||
        pathname === "/projects/members"
      );
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  };

  const isNavGroupActive = (item: NavItem) => {
    if (item.subLinks && item.subLinks.length > 0) {
      return item.subLinks.some((sub) => isLinkActive(sub.href));
    }
    return isLinkActive(item.href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800",
        scrolled ? "shadow-sm py-3" : "py-3.5 sm:py-4"
      )}
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" aria-label="JANIC homepage" className="flex items-center shrink-0 group">
          <div className="relative h-9 sm:h-10 w-40 sm:w-48 xl:w-56 transition-transform group-hover:scale-[1.02]">
            <Image
              src="/images/janic-new-with-jazeera-blue.png"
              alt="JANIC — Jazeera Nexus Innovation Center"
              fill
              className="object-contain object-left dark:hidden"
              priority
              sizes="(max-width: 640px) 160px, (max-width: 1280px) 192px, 224px"
            />
            <Image
              src="/images/janic-new-with-jazeera-white.png"
              alt="JANIC — Jazeera Nexus Innovation Center"
              fill
              className="object-contain object-left hidden dark:block"
              priority
              sizes="(max-width: 640px) 160px, (max-width: 1280px) 192px, 224px"
            />
          </div>
        </Link>

        {/* Desktop Navigation Links (Clean single-word names, non-rounded dropdowns) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-8">
          {defaultNavStructure.map((item) => {
            const isGroupActive = isNavGroupActive(item);
            const hasSubLinks = Boolean(item.subLinks && item.subLinks.length > 0);

            if (hasSubLinks && item.subLinks) {
              return (
                <div
                  key={item.id}
                  className="relative group py-2"
                  onMouseEnter={() => setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] xl:text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap py-1",
                      isGroupActive
                        ? "text-[#00A3E0] dark:text-sky-400"
                        : "text-slate-700 hover:text-[#00A3E0] dark:text-slate-300 dark:hover:text-sky-400"
                    )}
                  >
                    <span>{item.name}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        openDropdown === item.id
                          ? "rotate-180 text-[#00A3E0] dark:text-sky-400"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-[#00A3E0] dark:group-hover:text-sky-400"
                      )}
                    />
                  </Link>

                  {/* Dropdown Menu - Simple, non-rounded / straight edges, without any icons */}
                  <div
                    className={cn(
                      "absolute top-full left-0 pt-2 min-w-[190px] xl:min-w-[210px] transition-all duration-150 z-50",
                      openDropdown === item.id
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-1 pointer-events-none"
                    )}
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 p-1 shadow-lg space-y-0.5">
                      {item.subLinks.map((sub) => {
                        const isSubActive = isLinkActive(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setOpenDropdown(null)}
                            className={cn(
                              "block px-3.5 py-2.5 rounded-none text-xs font-semibold tracking-wide transition-colors whitespace-nowrap",
                              isSubActive
                                ? "bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
                            )}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "text-[11px] xl:text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap py-1",
                  isGroupActive
                    ? "text-[#00A3E0] dark:text-sky-400"
                    : "text-slate-700 hover:text-[#00A3E0] dark:text-slate-300 dark:hover:text-sky-400"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Desktop (Theme & Sky Blue Rounded Login Button) */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0">
          <ThemeModeDropdown />
          {isLoggedIn ? (
            activeUser ? (
              <UserAvatarMenu user={activeUser} loggingOut={loggingOut} onLogout={handleLogout} />
            ) : null
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-sm hover:shadow active:scale-95"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:text-[#0875D1] rounded-lg hover:bg-slate-50 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-4 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Theme</p>
            <ThemeModeDropdown />
          </div>

          {/* Logged-in user card (mobile) */}
          {isLoggedIn && activeUser && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-[#F5F9FF] to-white dark:from-slate-900 dark:to-slate-950 p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_25px_-15px_rgba(8,117,209,0.35)]">
              <Avatar className="h-11 w-11 shrink-0">
                {activeUser.avatar ? (
                  <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#0875D1] to-[#08245C] text-white font-bold">
                  {getUserInitial(activeUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {activeUser.username ? `@${activeUser.username}` : activeUser.name}
                </p>
                {activeUser.username === "jamiila" || activeUser.name.toLowerCase().includes("jamiila") ? (
                  <p className="text-xs font-bold text-[#00A3E0] dark:text-sky-400">
                    Dean of CS & IT
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground truncate">
                  {activeUser.email}
                </p>
                <p className="text-[10px] font-extrabold tracking-wider text-[#00A3E0] uppercase mt-0.5">
                  {activeUser.username === "jamiila" || activeUser.name.toLowerCase().includes("jamiila")
                    ? "Dean of CS & IT • System Admin"
                    : activeUser.role}
                </p>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links (Non-rounded dropdowns, without icons) */}
          <div className="space-y-1.5">
            {defaultNavStructure.map((item) => {
              if (item.subLinks && item.subLinks.length > 0) {
                const isExpanded = mobileExpandedSections[item.id] ?? false;
                const isGroupActive = isNavGroupActive(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpandedSections((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className={cn(
                        "w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-colors",
                        isGroupActive
                          ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          isExpanded ? "rotate-180 text-sky-500" : ""
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 pt-0.5 space-y-1 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        {item.subLinks.map((sub) => {
                          const isSubActive = isLinkActive(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "block px-3 py-2 rounded-none text-xs font-medium transition-colors",
                                isSubActive
                                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-sky-600"
                              )}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href || (item.href && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3.5 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors",
                    isActive
                      ? "text-sky-600 bg-sky-50 dark:bg-sky-950/50"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-sky-600"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Actions: Sky Blue Rounded Login Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/account/registrations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#0875D1] to-[#0aa5e8] text-white font-semibold text-xs text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  My Event Registration
                </Link>
                {(currentUser?.role as string) !== "USER" && (
                  <>
                    <Link
                      href={currentUser?.role === "STAFF" ? "/staff/profile" : "/admin/profile"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#0875D1] to-[#0aa5e8] text-white font-semibold text-xs text-center shadow-md flex items-center justify-center gap-1.5"
                    >
                      <UserCircle className="w-3.5 h-3.5" />
                      My Profile
                    </Link>
                    <Link
                      href={currentUser?.role === "STAFF" ? "/staff/dashboard" : "/admin/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs text-center flex items-center justify-center gap-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full py-2.5 px-4 rounded-full border border-red-200 text-red-600 font-semibold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs text-center transition block shadow-sm"
              >
                Login
              </Link>
            )}
            <Link
              href="/submit-innovation"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 rounded-full bg-[#08245C] text-white font-semibold text-xs text-center shadow-sm"
            >
              Submit Innovation Idea
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
