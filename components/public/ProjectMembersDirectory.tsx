"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Users,
  User,
  ArrowRight,
  Sparkles,
  FolderKanban,
  LayoutGrid,
  List as ListIcon,
  Layers,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  MoreHorizontal,
  Mail,
  Copy,
  Check,
  Folder,
} from "lucide-react";
import { ComingSoonCohort } from "./ComingSoonCohort";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { getGroupMeta } from "@/lib/project-team";

export interface ProjectData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  order: number;
  heroImage?: string | null;
  teamMembers?: string | null;
  status: string;
}

export interface ProjectMemberData {
  id: string;
  name: string;
  role: string;
  department?: string | null;
  bio?: string | null;
  avatar?: string | null;
  projectId?: string | null;
  project?: {
    id: string;
    title: string;
    slug: string;
    category: string;
    order: number;
    heroImage?: string | null;
    summary?: string | null;
  } | null;
  github?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  email?: string | null;
  tags?: string | null;
  order: number;
  isActive: boolean;
}

export interface MemberEntry {
  id: string;
  name: string;
  role: string;
  department: string;
  bio?: string | null;
  avatar?: string | null;
  projectId?: string | null;
  projectTitle: string;
  projectSlug: string;
  projectCategory: string;
  projectHeroImage?: string | null;
  groupLabel: string;
  projectType: "group" | "individual";
  order: number;
  github?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  email?: string | null;
  tags?: string | null;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

// Color palettes for member avatars fallback
const avatarGradients = [
  "from-blue-600 to-indigo-700",
  "from-sky-500 to-blue-700",
  "from-emerald-600 to-teal-800",
  "from-indigo-600 to-violet-800",
  "from-cyan-600 to-blue-800",
  "from-teal-600 to-emerald-800",
  "from-blue-700 to-sky-600",
  "from-slate-700 to-slate-900",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarGradients.length;
  return avatarGradients[index];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Crisp Brand SVG Icons
function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GmailIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.248l8.073-5.755c1.618-1.214 3.927-.059 3.927 1.964z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

// 4-Social Icons Row: Only Facebook, GitHub, Gmail, LinkedIn
// If entered -> direct clickable link. If not entered -> sample disabled icon (not working).
interface FourSocialIconsProps {
  facebook?: string | null;
  github?: string | null;
  email?: string | null;
  linkedin?: string | null;
  size?: "md" | "sm";
}

function FourSocialIcons({
  facebook,
  github,
  email,
  linkedin,
  size = "md",
}: FourSocialIconsProps) {
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const btnSize = size === "md" ? "w-9 h-9" : "w-8 h-8";

  const emailHref = email
    ? email.startsWith("mailto:")
      ? email
      : `mailto:${email}`
    : undefined;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 1. Facebook */}
      {facebook ? (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            btnSize,
            "rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1877F2] hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 shrink-0"
          )}
          title={`Facebook: ${facebook}`}
          aria-label="Facebook Profile"
        >
          <FacebookIcon className={iconSize} />
        </a>
      ) : (
        <span
          className={cn(
            btnSize,
            "rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed opacity-35 shrink-0 pointer-events-none"
          )}
          title="Facebook (Sample only - not provided)"
          aria-label="Facebook Not Provided"
        >
          <FacebookIcon className={iconSize} />
        </span>
      )}

      {/* 2. GitHub */}
      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            btnSize,
            "rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 shrink-0"
          )}
          title={`GitHub: ${github}`}
          aria-label="GitHub Profile"
        >
          <GitHubIcon className={iconSize} />
        </a>
      ) : (
        <span
          className={cn(
            btnSize,
            "rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed opacity-35 shrink-0 pointer-events-none"
          )}
          title="GitHub (Sample only - not provided)"
          aria-label="GitHub Not Provided"
        >
          <GitHubIcon className={iconSize} />
        </span>
      )}

      {/* 3. Gmail */}
      {emailHref ? (
        <a
          href={emailHref}
          className={cn(
            btnSize,
            "rounded-xl bg-red-50 dark:bg-red-950/60 text-[#EA4335] hover:bg-[#EA4335] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 shrink-0"
          )}
          title={`Gmail: ${email}`}
          aria-label="Send Email"
        >
          <GmailIcon className={iconSize} />
        </a>
      ) : (
        <span
          className={cn(
            btnSize,
            "rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed opacity-35 shrink-0 pointer-events-none"
          )}
          title="Gmail (Sample only - not provided)"
          aria-label="Gmail Not Provided"
        >
          <GmailIcon className={iconSize} />
        </span>
      )}

      {/* 4. LinkedIn */}
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            btnSize,
            "rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 shrink-0"
          )}
          title={`LinkedIn: ${linkedin}`}
          aria-label="LinkedIn Profile"
        >
          <LinkedInIcon className={iconSize} />
        </a>
      ) : (
        <span
          className={cn(
            btnSize,
            "rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed opacity-35 shrink-0 pointer-events-none"
          )}
          title="LinkedIn (Sample only - not provided)"
          aria-label="LinkedIn Not Provided"
        >
          <LinkedInIcon className={iconSize} />
        </span>
      )}
    </div>
  );
}

interface ProjectMembersDirectoryProps {
  initialMembers?: ProjectMemberData[];
  projects: ProjectData[];
}

export function ProjectMembersDirectory({
  initialMembers,
  projects,
}: ProjectMembersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "group" | "individual">("all");
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "teams">("grid");
  const [sortBy, setSortBy] = useState<"network" | "project" | "name">("network");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const years = [
    { id: "all", label: "All Years" },
    { id: "2026", label: "2026", isCurrent: true },
    { id: "2027", label: "2027" },
    { id: "2028", label: "2028" },
  ];

  const isFutureCohort = selectedYear === "2027" || selectedYear === "2028";

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".member-menu-container")) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Copy member profile link
  const handleCopyLink = (memberId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/project-members#${memberId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(memberId);
      setTimeout(() => setCopiedId(null), 2200);
      setOpenMenuId(null);
    }
  };

  // Compile members list strictly from stored database projects (filters out unlinked/orphan members)
  const allMembers = useMemo(() => {
    if (initialMembers && initialMembers.length > 0) {
      const linkedMembers: MemberEntry[] = [];

      for (const m of initialMembers) {
        const assignedProj =
          projects.find((p) => p.id === m.projectId) ||
          (m.project ? projects.find((p) => p.slug === m.project?.slug || p.id === m.project?.id) : undefined);

        // Strictly ignore members not associated with any stored database project
        if (!assignedProj) {
          continue;
        }

        const projectTitle = assignedProj.title;
        const projectSlug = assignedProj.slug;
        const projectCategory = assignedProj.category || "Technology";
        const projectHeroImage = assignedProj.heroImage;
        const projectOrder = assignedProj.order ?? 99;

        const { label, type } = getGroupMeta(projectOrder, projectTitle);

        linkedMembers.push({
          id: m.id,
          name: m.name,
          role: m.role || "Team Member",
          department: m.department || "Faculty of Computer Science & IT",
          bio: m.bio,
          avatar: m.avatar,
          projectId: m.projectId || assignedProj.id,
          projectTitle,
          projectSlug,
          projectCategory,
          projectHeroImage,
          groupLabel: label,
          projectType: type,
          order: m.order || projectOrder,
          github: m.github,
          linkedin: m.linkedin,
          facebook: m.facebook,
          email: m.email,
          tags: m.tags,
        });
      }

      if (linkedMembers.length > 0) {
        return linkedMembers;
      }
    }

    // Fallback: extract strictly from stored database projects (projects.teamMembers)
    const list: MemberEntry[] = [];
    projects.forEach((proj) => {
      const { label, type } = getGroupMeta(proj.order, proj.title);
      const rawMembers = proj.teamMembers || "";
      const names = rawMembers
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      names.forEach((rawName, idx) => {
        const match = rawName.match(/^(.+?)\s*(?:\((.+?)\))?$/);
        const name = match ? match[1].trim() : rawName;
        const role = match && match[2] ? match[2].trim() : (type === "individual" ? "Lead Innovator" : "Team Member");

        list.push({
          id: `${proj.slug}-${idx}-${name.replace(/\s+/g, "-").toLowerCase()}`,
          name,
          role,
          department: "Faculty of Computer Science & IT",
          projectTitle: proj.title,
          projectSlug: proj.slug,
          projectCategory: proj.category,
          projectHeroImage: proj.heroImage,
          groupLabel: label,
          projectType: type,
          order: proj.order,
          tags: proj.category,
        });
      });
    });
    return list;
  }, [initialMembers, projects]);

  // Filter members according to active tab, project select, and search
  const filteredMembers = useMemo(() => {
    let result = allMembers.filter((member) => {
      // Year filter (Cohort 2026 active, 2027/2028 future)
      if (selectedYear !== "all") {
        if (selectedYear !== "2026") {
          return false;
        }
      }

      // Tab filter
      if (activeTab !== "all" && member.projectType !== activeTab) {
        return false;
      }

      // Project filter
      if (selectedProjectSlug !== "all" && member.projectSlug !== selectedProjectSlug) {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = member.name.toLowerCase().includes(q);
        const matchProject = member.projectTitle.toLowerCase().includes(q);
        const matchGroup = member.groupLabel.toLowerCase().includes(q);
        const matchCat = member.projectCategory.toLowerCase().includes(q);
        const matchRole = member.role.toLowerCase().includes(q);
        const matchTags = (member.tags || "").toLowerCase().includes(q);
        if (!matchName && !matchProject && !matchGroup && !matchCat && !matchRole && !matchTags) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "project") {
      result = [...result].sort((a, b) => a.order - b.order || a.projectTitle.localeCompare(b.projectTitle));
    } else {
      // "network": sort with rich social profiles first, then by group order
      result = [...result].sort((a, b) => {
        const aScore = (a.github ? 1 : 0) + (a.linkedin ? 1 : 0) + (a.facebook ? 1 : 0) + (a.email ? 1 : 0);
        const bScore = (b.github ? 1 : 0) + (b.linkedin ? 1 : 0) + (b.facebook ? 1 : 0) + (b.email ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.order - b.order;
      });
    }

    return result;
  }, [allMembers, activeTab, selectedProjectSlug, searchQuery, sortBy, selectedYear]);

  // Grouped by Project (for "Teams" view mode)
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const { type } = getGroupMeta(proj.order, proj.title);
      if (activeTab !== "all" && type !== activeTab) return false;
      if (selectedProjectSlug !== "all" && proj.slug !== selectedProjectSlug) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchTitle = proj.title.toLowerCase().includes(q);
        const matchMembers = (proj.teamMembers || "").toLowerCase().includes(q);
        const matchCat = proj.category.toLowerCase().includes(q);
        const { label } = getGroupMeta(proj.order, proj.title);
        const matchLabel = label.toLowerCase().includes(q);
        if (!matchTitle && !matchMembers && !matchCat && !matchLabel) return false;
      }

      return true;
    });
  }, [projects, activeTab, selectedProjectSlug, searchQuery]);

  const totalMembersCount = allMembers.length;
  const groupMembersCount = allMembers.filter((m) => m.projectType === "group").length;
  const individualMembersCount = allMembers.filter((m) => m.projectType === "individual").length;

  // 12 items per page pagination
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter, tab, sort, year, or view mode change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, selectedProjectSlug, sortBy, viewMode, selectedYear]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMembers, startIndex]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.getElementById("members-directory-top");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div id="members-directory-top" className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & TABS BAR                                       */}
      {/* ============================================================== */}
      <ScrollReveal animation="fade-up" duration={800} className="space-y-6 sm:space-y-7">
        {/* Top Row: Section heading */}
        <div>
          <p className="flex items-center gap-3 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
            <span className="w-8 h-0.5 bg-current" aria-hidden="true" />
            Student Directory
          </p>
          <h2 className="mt-3.5 text-[30px] sm:text-4xl lg:text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#08245C] dark:text-white">
            Project <span className="text-[#0765ff] dark:text-[#80c2ff]">Members</span>
          </h2>
          <p className="mt-3 max-w-2xl text-base sm:text-lg leading-relaxed text-[#6b7fa6] dark:text-slate-400">
            Browse student innovators, software engineers, and hardware builders across all {projects.length} innovation projects.
          </p>
        </div>

        {/* Tab Row: All | Group Teams | Individual Projects */}
        <div className="flex items-center gap-6 sm:gap-9 border-b border-[#d6e7ff] dark:border-[#273b56] pb-0 text-sm font-bold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "pb-3.5 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0",
              activeTab === "all"
                ? "text-[#0075ff] dark:text-sky-400 font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === "all"
                  ? "bg-blue-100 dark:bg-blue-900/60 text-[#0075ff] dark:text-sky-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {totalMembersCount}
            </span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0075ff] dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("group")}
            className={cn(
              "pb-3.5 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0",
              activeTab === "group"
                ? "text-[#0075ff] dark:text-sky-400 font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Teams</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === "group"
                  ? "bg-blue-100 dark:bg-blue-900/60 text-[#0075ff] dark:text-sky-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {groupMembersCount}
            </span>
            {activeTab === "group" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0075ff] dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("individual")}
            className={cn(
              "pb-3.5 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0",
              activeTab === "individual"
                ? "text-[#0075ff] dark:text-sky-400 font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual Projects</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold",
                activeTab === "individual"
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {individualMembersCount}
            </span>
            {activeTab === "individual" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0075ff] dark:bg-sky-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Subheader Controls: Responsive layout */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 pt-1">
          {/* Left: Section Label */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base sm:text-lg font-extrabold text-[#08245C] dark:text-white tracking-tight">
              All Members
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ff] dark:bg-[#152e4f] text-[#0075ff] dark:text-[#80c2ff]">
              {filteredMembers.length}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#0075ff] dark:text-[#80c2ff] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Name or Tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] text-sm text-[#08245C] dark:text-slate-100 placeholder:text-[#8a9bbd] shadow-[0_10px_28px_rgb(46_114_187/8%)] focus:outline-none focus:ring-2 focus:ring-[#0075ff]/60 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: View Toggle + Sort + Project Select */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
            {/* View Icons */}
            <div className="flex items-center bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] p-1 rounded-full shadow-[0_10px_28px_rgb(46_114_187/8%)]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  viewMode === "grid"
                    ? "bg-[#0075ff] text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title="Grid View (Influencer Cards)"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  viewMode === "list"
                    ? "bg-[#0075ff] text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title="List View"
                aria-label="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("teams")}
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  viewMode === "teams"
                    ? "bg-[#0075ff] text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title="By Teams (Project View)"
                aria-label="By Teams"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-8 py-3 rounded-full bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] text-xs font-semibold text-[#08245C] dark:text-slate-200 shadow-[0_10px_28px_rgb(46_114_187/8%)] focus:outline-none focus:ring-2 focus:ring-[#0075ff]/60 cursor-pointer"
              >
                <option value="network">Sort By: Network</option>
                <option value="project">Sort By: Project Order</option>
                <option value="name">Sort By: Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#0075ff] dark:text-[#80c2ff] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Project Filter Selector */}
            <div className="relative">
              <select
                value={selectedProjectSlug}
                onChange={(e) => setSelectedProjectSlug(e.target.value)}
                className="appearance-none pl-4 pr-8 py-3 rounded-full bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] text-xs font-semibold text-[#08245C] dark:text-slate-200 shadow-[0_10px_28px_rgb(46_114_187/8%)] focus:outline-none focus:ring-2 focus:ring-[#0075ff]/60 cursor-pointer max-w-[150px] sm:max-w-[170px] truncate"
              >
                <option value="all">All {projects.length} Projects</option>
                {projects.filter((p) => getGroupMeta(p.order, p.title).type === "group").length > 0 && (
                  <optgroup label="Group Projects">
                    {projects
                      .filter((p) => getGroupMeta(p.order, p.title).type === "group")
                      .map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {getGroupMeta(p.order, p.title).label}: {p.title}
                        </option>
                      ))}
                  </optgroup>
                )}
                {projects.filter((p) => getGroupMeta(p.order, p.title).type === "individual").length > 0 && (
                  <optgroup label="Individual Projects">
                    {projects
                      .filter((p) => getGroupMeta(p.order, p.title).type === "individual")
                      .map((p) => (
                        <option key={p.slug} value={p.slug}>
                          INDIVIDUAL: {p.title}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#0075ff] dark:text-[#80c2ff] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Year Filter Bar with 2026 (green dot), 2027, 2028 matching Projects page */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#6b7fa6] dark:text-slate-400 uppercase tracking-[0.08em] mr-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0075ff] dark:text-[#80c2ff]" /> Cohort Year:
            </span>

            {years.map((y) => {
              const isSelected = selectedYear === y.id;
              return (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setSelectedYear(y.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer",
                    isSelected
                      ? "bg-[#0075ff] text-white shadow-[0_6px_16px_rgb(0_117_255/25%)] dark:bg-[#0869db]"
                      : "bg-white dark:bg-[#0f1e35] text-[#4a5f86] dark:text-slate-300 hover:text-[#0075ff] dark:hover:text-[#80c2ff] border border-[#e2edf8] dark:border-[#273b56] hover:border-[#b9d9ff]"
                  )}
                >
                  <span>{y.label}</span>

                  {/* Current year green dot */}
                  {y.isCurrent && (
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                      title="Current Cohort"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Reset Filters / Member Count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6b7fa6] dark:text-slate-400 font-medium">
              Showing <strong className="text-[#08245C] dark:text-white">{isFutureCohort ? 0 : filteredMembers.length}</strong> {filteredMembers.length === 1 ? "member" : "members"}
            </span>

            {(selectedYear !== "all" || selectedProjectSlug !== "all" || searchQuery || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedProjectSlug("all");
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="text-sm font-bold text-[#0075ff] dark:text-[#80c2ff] hover:underline underline-offset-4 cursor-pointer"
              >
                Reset all
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Copied Link Toast */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#08245C] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Profile link copied to clipboard!</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MAIN CONTENT AREA (GRID / LIST / TEAMS / COMING SOON)       */}
      {/* ============================================================== */}
      {isFutureCohort ? (
        <ComingSoonCohort year={selectedYear} />
      ) : viewMode === "grid" ? (
        /* ================= RESPONSIVE INFLUENCER GRID ================= */
        filteredMembers.length === 0 ? (
          <div className="py-16 text-center max-w-lg mx-auto">
            <span className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#eff8ff] to-[#dceeff] dark:from-[#1b385a] dark:to-[#122a48] text-[#0075ff] dark:text-[#80c2ff]">
              <Sparkles className="w-7 h-7" />
            </span>
            <h3 className="text-xl font-bold text-[#08245C] dark:text-white">
              No project members match your search
            </h3>
            <p className="text-sm text-[#6279a1] dark:text-slate-400 mt-2">
              Try adjusting your query or resetting filter options.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedProjectSlug("all");
                setSearchQuery("");
              }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0075ff] text-white text-sm font-bold hover:bg-[#0064dd] shadow-md shadow-blue-500/20 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {paginatedMembers.map((member, cardIndex) => {
              const isGroup = member.projectType === "group";
              const gradient = getAvatarGradient(member.name);
              const initials = getInitials(member.name);
              const isMenuOpen = openMenuId === member.id;

              // Parse skill tags
              const skillTags = (member.tags || member.projectCategory)
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

              return (
                <ScrollReveal
                  key={member.id}
                  animation="fade-up"
                  duration={700}
                  delay={(cardIndex % 4) * 90}
                  className={cn("flex min-w-0", isMenuOpen && "relative z-20")}
                >
                <div
                  id={member.id}
                  className="w-full min-w-0 bg-white dark:bg-[#0f1e35] rounded-[20px] border border-white dark:border-[#273b56] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgb(61_128_191/7%)] hover:shadow-[0_20px_40px_rgb(30_104_175/16%)] hover:-translate-y-1.5 transition-all duration-500 ease-out relative group scroll-mt-28"
                >
                  <div>
                    {/* Top Header: Pill on left + 3-dots menu on right */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Group / Individual Pill */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors",
                          isGroup
                            ? "bg-blue-50/90 dark:bg-blue-950/70 text-[#0075ff] dark:text-sky-300 border border-blue-200/80 dark:border-blue-900"
                            : "bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900"
                        )}
                      >
                        {isGroup ? <Users className="w-3 h-3 text-[#0075ff]" /> : <User className="w-3 h-3 text-emerald-600" />}
                        <span>{member.groupLabel}</span>
                      </span>

                      <div className="flex items-center gap-1.5 relative member-menu-container">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[100px] hidden sm:inline">
                          {member.projectCategory}
                        </span>

                        {/* 3-dots button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : member.id);
                          }}
                          className="w-8 h-8 rounded-full hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f] flex items-center justify-center text-slate-400 hover:text-[#0075ff] dark:hover:text-[#80c2ff] transition-colors"
                          title="More options"
                          aria-label="Member options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* 3-dots dropdown menu (Edit in Admin Side removed per user request) */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-30 w-48 rounded-2xl bg-white dark:bg-[#0f1e35] border border-[#e2edf8] dark:border-[#273b56] shadow-[0_20px_45px_rgb(28_94_165/18%)] p-1.5 text-xs animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(member.id)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f] text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Profile Link</span>
                            </button>
                            <Link
                              href={`/projects/${member.projectSlug}`}
                              onClick={() => setOpenMenuId(null)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f] text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                            >
                              <Folder className="w-3.5 h-3.5 text-[#0075ff]" />
                              <span>View Project</span>
                            </Link>
                            {member.email && (
                              <a
                                href={member.email.startsWith("mailto:") ? member.email : `mailto:${member.email}`}
                                onClick={() => setOpenMenuId(null)}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f] text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Send Email</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Centered Circular Avatar */}
                    <div className="mt-2 mb-3 text-center">
                      <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full mx-auto overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-[#0f1e35] ring-2 ring-[#cfe3ff] dark:ring-[#273b56] group-hover:ring-[#0075ff]/60 shadow-[0_8px_20px_rgb(46_114_187/14%)] group-hover:scale-105 transition-all duration-500">
                        {member.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 88px, 96px"
                          />
                        ) : (
                          <div
                            className={cn(
                              "w-full h-full flex items-center justify-center font-extrabold text-white text-xl bg-gradient-to-br shadow-inner",
                              gradient
                            )}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Centered Member Name */}
                      <h3 className="font-extrabold text-base text-[#08245C] dark:text-slate-100 mt-3.5 leading-snug tracking-[-0.02em] group-hover:text-[#0075ff] dark:group-hover:text-[#80c2ff] transition-colors truncate px-1">
                        {member.name}
                      </h3>

                      {/* Centered Role */}
                      <p className="text-xs font-semibold text-[#0075ff] dark:text-sky-400 mt-0.5 truncate px-1">
                        {member.role}
                      </p>

                      {/* Centered Department */}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate px-1">
                        {member.department}
                      </p>

                      {/* Centered Skill Tags Row */}
                      <div className="flex items-center justify-center flex-wrap gap-1.5 mt-2.5 px-1">
                        {skillTags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-0.5 rounded-full bg-[#e7f3ff] dark:bg-[#152e4f] text-[#0075ff] dark:text-[#80c2ff] text-[10px] font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                        {skillTags.length > 3 && (
                          <span
                            className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0075ff] dark:text-sky-300 text-[10px] font-bold flex items-center justify-center"
                            title={`More: ${skillTags.slice(3).join(", ")}`}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ASSIGNED PROJECT CARD */}
                    <div className="mt-4 pt-4 border-t border-[#e2edf8] dark:border-[#273b56]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#0075ff] dark:text-sky-400 mb-1.5 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>ASSIGNED PROJECT</span>
                      </div>

                      <Link
                        href={`/projects/${member.projectSlug}`}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#f0f6fe] dark:bg-[#13253f] hover:bg-[#e3f0ff] dark:hover:bg-[#173055] transition-colors group/proj"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-[#08245C] dark:text-slate-100 group-hover/proj:text-[#0075ff] transition-colors truncate">
                            {member.projectTitle}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            View project specifications & prototype
                          </p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-[#0082f5] dark:bg-[#0869db] flex items-center justify-center text-white group-hover/proj:translate-x-0.5 transition-transform duration-300 shrink-0">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* BOTTOM: 4 SOCIAL ICONS ONLY (NO NUMBERS, ACTIVE/SAMPLE)   */}
                  {/* ========================================================= */}
                  <div className="mt-4 border-t border-[#e2edf8] dark:border-[#273b56] -mx-5 -mb-5 px-3 py-3 bg-[#f7fbff] dark:bg-[#0c1a2e] rounded-b-[20px]">
                    <FourSocialIcons
                      facebook={member.facebook}
                      github={member.github}
                      email={member.email}
                      linkedin={member.linkedin}
                      size="md"
                    />
                  </div>
                </div>
                </ScrollReveal>
              );
            })}
          </div>
        )
      ) : viewMode === "list" ? (
        /* ================= LIST VIEW (LEFT ALIGNED & STRUCTURED) ================= */
        <div className="space-y-3">
          {paginatedMembers.map((member, rowIndex) => {
            const isGroup = member.projectType === "group";
            const gradient = getAvatarGradient(member.name);
            const initials = getInitials(member.name);

            return (
              <ScrollReveal key={member.id} animation="fade-up" duration={650} delay={Math.min(rowIndex, 5) * 60}>
              <div
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 rounded-[20px] bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] shadow-[0_8px_24px_rgb(61_128_191/6%)] hover:shadow-[0_16px_34px_rgb(30_104_175/13%)] hover:-translate-y-0.5 transition-all duration-500 ease-out"
              >
                {/* 1. MEMBER PROFILE (Left Column - fixed width on desktop for clean alignment) */}
                <div className="flex items-center gap-3.5 w-full lg:w-72 xl:w-80 shrink-0 text-left">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-[#0f1e35] ring-2 ring-[#cfe3ff] dark:ring-[#273b56]">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br",
                          gradient
                        )}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm sm:text-base text-[#08245C] dark:text-slate-100 truncate text-left tracking-[-0.01em]">
                        {member.name}
                      </h4>
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                          isGroup
                            ? "bg-blue-50 text-[#0075ff] dark:bg-blue-950/70 dark:text-sky-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                        )}
                      >
                        {member.groupLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#0075ff] dark:text-sky-400 truncate mt-0.5 text-left">
                      {member.role}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 text-left">
                      {member.department}
                    </p>
                  </div>
                </div>

                {/* 2. ASSIGNED PROJECT (Left-aligned column with clean standard width) */}
                <div className="w-full lg:w-80 xl:w-96 text-left shrink-0">
                  <Link
                    href={`/projects/${member.projectSlug}`}
                    className="block p-3 rounded-2xl bg-[#f0f6fe] dark:bg-[#13253f] hover:bg-[#e3f0ff] dark:hover:bg-[#173055] transition-colors text-left group/proj"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#0075ff] dark:text-sky-400 mb-1">
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>ASSIGNED PROJECT</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#08245C] dark:text-slate-100 group-hover/proj:text-[#0075ff] transition-colors truncate text-left">
                      {member.projectTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate text-left mt-0.5">
                      {member.projectCategory} • Specifications & prototype
                    </p>
                  </Link>
                </div>

                {/* 3. 4 SOCIAL ICONS + EXPLORE ARROW (Right-aligned row) */}
                <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#e2edf8] dark:border-[#273b56]">
                  <FourSocialIcons
                    facebook={member.facebook}
                    github={member.github}
                    email={member.email}
                    linkedin={member.linkedin}
                    size="md"
                  />

                  <Link
                    href={`/projects/${member.projectSlug}`}
                    className="w-10 h-10 rounded-full bg-[#0082f5] hover:bg-[#006bd6] dark:bg-[#0869db] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shrink-0"
                    title={`Explore ${member.projectTitle}`}
                    aria-label="Explore Project"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        /* ================= BY TEAMS VIEW ================= */
        <div className="divide-y divide-[#d6e7ff] dark:divide-[#273b56]">
          {filteredProjects.map((proj) => {
            const { label, type } = getGroupMeta(proj.order, proj.title);
            const isGroup = type === "group";
            const projectMembersList = allMembers.filter((m) => m.projectSlug === proj.slug);

            return (
              <ScrollReveal key={proj.id} animation="fade-up" duration={750} className="py-10 first:pt-2">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 text-left">
                  <div className="space-y-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          isGroup
                            ? "bg-blue-50 dark:bg-blue-950/70 text-[#0075ff] dark:text-sky-300 border border-blue-200/60 dark:border-blue-900"
                            : "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900"
                        )}
                      >
                        {isGroup ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {label}
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        {proj.category}
                      </span>

                      <span className="text-xs text-slate-400">
                        {projectMembersList.length} {projectMembersList.length === 1 ? "Innovator" : "Engineers"}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-[28px] font-extrabold tracking-[-0.03em] text-[#08245C] dark:text-white text-left">
                      {proj.title}
                    </h3>

                    <p className="text-sm sm:text-base text-[#6279a1] dark:text-slate-400 max-w-3xl leading-relaxed text-left">
                      {proj.summary}
                    </p>
                  </div>

                  <Link
                    href={`/projects/${proj.slug}`}
                    className="group/btn inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full bg-[#0075ff] hover:bg-[#0064dd] dark:bg-[#0869db] text-white text-sm font-bold shadow-[0_8px_20px_rgb(0_117_255/22%)] transition-colors shrink-0 self-start lg:self-auto"
                  >
                    <span>Explore Project</span>
                    <span className="grid place-items-center w-8 h-8 rounded-full bg-white text-[#0075ff]">
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                    </span>
                  </Link>
                </div>

                {/* Team Members in this project */}
                <div className="pt-7">
                  <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-[#6b7fa6] dark:text-slate-400 mb-4 flex items-center gap-1.5 text-left">
                    <Users className="w-3.5 h-3.5 text-[#0075ff] dark:text-[#80c2ff]" />
                    Project Team Members
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projectMembersList.map((member, idx) => {
                      const gradient = getAvatarGradient(member.name);
                      const initials = getInitials(member.name);

                      return (
                        <div
                          key={member.id || idx}
                          className="p-4 rounded-[18px] bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] flex flex-col justify-between shadow-[0_8px_24px_rgb(61_128_191/6%)] hover:shadow-[0_16px_32px_rgb(30_104_175/14%)] hover:-translate-y-1 transition-all duration-500 ease-out"
                        >
                          <div className="flex items-center gap-3 text-left">
                            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                              {member.avatar ? (
                                <Image
                                  src={member.avatar}
                                  alt={member.name}
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "w-full h-full flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br",
                                    gradient
                                  )}
                                >
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-sm font-extrabold text-[#08245C] dark:text-slate-100 truncate text-left">
                                {member.name}
                              </p>
                              <p className="text-[10px] font-semibold text-[#0075ff] dark:text-sky-400 truncate text-left">
                                {member.role}
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate text-left">
                                Member #{idx + 1}
                              </p>
                            </div>
                          </div>

                          {/* 4 Social Icons row */}
                          <div className="pt-3 mt-3 border-t border-[#e2edf8] dark:border-[#273b56] flex justify-center">
                            <FourSocialIcons
                              facebook={member.facebook}
                              github={member.github}
                              email={member.email}
                              linkedin={member.linkedin}
                              size="sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Pagination Numbers Below - Displayed when list reaches 12 (more than 12 items) */}
      {!isFutureCohort && (viewMode === "grid" || viewMode === "list") && filteredMembers.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#d6e7ff] dark:border-[#273b56]">
          <div className="text-sm text-[#6b7fa6] dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredMembers.length)}
            </span>{" "}
            of <span className="font-bold text-slate-900 dark:text-white">{filteredMembers.length}</span> members
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous */}
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => handlePageChange(Math.max(safeCurrentPage - 1, 1))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#e2edf8] dark:border-[#273b56] bg-white dark:bg-[#0f1e35] text-xs font-semibold text-[#08245C] dark:text-slate-200 hover:text-[#0075ff] hover:border-[#b9d9ff] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400 select-none">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => handlePageChange(p as number)}
                  className={cn(
                    "w-9 h-9 rounded-full text-xs font-bold transition-colors flex items-center justify-center",
                    safeCurrentPage === p
                      ? "bg-[#0075ff] text-white shadow-[0_6px_16px_rgb(0_117_255/25%)]"
                      : "border border-[#e2edf8] dark:border-[#273b56] bg-white dark:bg-[#0f1e35] hover:text-[#0075ff] hover:border-[#b9d9ff] text-[#08245C] dark:text-slate-200"
                  )}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => handlePageChange(Math.min(safeCurrentPage + 1, totalPages))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#e2edf8] dark:border-[#273b56] bg-white dark:bg-[#0f1e35] text-xs font-semibold text-[#08245C] dark:text-slate-200 hover:text-[#0075ff] hover:border-[#b9d9ff] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
