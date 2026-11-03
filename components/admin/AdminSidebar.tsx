"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  GraduationCap,
  FlaskConical,
  Calendar,
  Lightbulb,
  Handshake,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Settings,
  UserCircle,
  ExternalLink,
  X,
  Heart,
  Package,
  Layers,
  Briefcase,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separatorators";
import { AuthUser } from "@/types/user";
import { hasCapability } from "@/lib/permissions/client-helper";
import { PermissionCapability } from "@/lib/permissions/capabilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  capability?: PermissionCapability;
}

const allNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { title: "Projects", href: "/admin/projects", icon: FolderGit2, capability: "projects:read" },
      { title: "Hubs & Programmes", href: "/admin/hubs", icon: Layers },
      { title: "Training", href: "/admin/training", icon: GraduationCap, capability: "training:read" },
      { title: "Research", href: "/admin/research", icon: FlaskConical, capability: "research:read" },
      { title: "Events", href: "/admin/events", icon: Calendar, capability: "events:read" },
      { title: "Guest Registrations", href: "/admin/guests", icon: UserCheck, capability: "events:read" },
      { title: "Submissions", href: "/admin/submissions", icon: Lightbulb, capability: "submissions:read" },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Opportunities", href: "/admin/opportunities", icon: Briefcase },
      { title: "Downloads & Forms", href: "/admin/downloads", icon: FileText },
    ],
  },
  {
    label: "Engagement",
    items: [
      { title: "Partnerships", href: "/admin/partnerships", icon: Handshake, capability: "partnerships:read" },
      { title: "Community Services", href: "/admin/community-services", icon: Heart, capability: "community_services:read" },
      { title: "Service Catalog", href: "/admin/community-services/catalog", icon: Package, capability: "community_services:create" },
      { title: "Messages", href: "/admin/messages", icon: MessageSquare, capability: "messages:read" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Mentors & Faculty", href: "/admin/team", icon: Users, capability: "team:read" },
      { title: "Media", href: "/admin/media", icon: ImageIcon, capability: "media:read" },
      { title: "Settings", href: "/admin/settings", icon: Settings, capability: "settings:read" },
      { title: "My Profile", href: "/admin/profile", icon: UserCircle },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  user?: AuthUser | null;
}

export function AdminSidebar({ open, onClose, user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navGroups = React.useMemo(() => {
    return allNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.capability || hasCapability(user, item.capability)),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[208px] flex-col overflow-hidden border-r border-border bg-card transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="relative w-[150px] h-9">
              <Image
                src="/images/janic-new-with-jazeera-blue.png"
                alt="JANIC Admin"
                fill
                className="object-contain object-left dark:hidden"
                priority
                sizes="150px"
              />
              <Image
                src="/images/janic-new-with-jazeera-white.png"
                alt="JANIC Admin"
                fill
                className="object-contain object-left hidden dark:block"
                priority
                sizes="150px"
              />
            </div>
          </Link>
          <button className="lg:hidden p-1 text-muted-foreground" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-2 py-2.5">
          <div className="flex min-h-full flex-col justify-between gap-3">
            <div className="space-y-2">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label}>
                  <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <nav className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex h-8 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  {groupIndex < navGroups.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border bg-muted/30 p-2.5 space-y-2">
          {user && (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-card border border-border/70 shadow-xs">
              <Avatar className="h-7 w-7 shrink-0 ring-1 ring-primary/30">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-[#0875D1] to-[#08245C] text-white text-[11px] font-bold">
                  {user.name ? user.name.charAt(0) : "J"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate leading-tight">
                  {user.username ? `@${user.username}` : (user.name.toLowerCase().includes("jamiila") ? "@jamiila" : user.name)}
                </p>
                <p className="text-[10px] text-[#0875D1] dark:text-sky-400 font-bold truncate leading-tight">
                  {user.username === "jamiila" || user.name.toLowerCase().includes("jamiila")
                    ? "Dean of CS & IT"
                    : user.role}
                </p>
              </div>
            </div>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Portal
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
              Live
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
