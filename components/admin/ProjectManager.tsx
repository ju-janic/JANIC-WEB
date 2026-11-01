"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Star,
  X,
  Loader2,
  AlertCircle,
  FolderGit2,
  Users,
  User,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Upload,
  Layers,
  Link2,
  Calendar,
  Check,
  Tag,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ImageUploadChoice } from "./ImageUploadChoice";
import { FileUploadChoice } from "./FileUploadChoice";
import { KpiRow } from "./KpiRow";
import { ProjectCategoryModal } from "./ProjectCategoryModal";

// Brand SVG Icons
function FacebookIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="#0A66C2" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
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

export interface MemberFormItem {
  id?: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  email?: string;
  facebook?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  problem: string;
  solution: string;
  technology: string;
  innovation?: string | null;
  outcomes?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  heroImage?: string | null;
  demoUrl?: string | null;
  videoUrl?: string | null;
  githubUrl?: string | null;
  teamMembers?: string | null;
  order: number;
  gallery?: { id?: string; imageUrl: string; caption?: string | null; order?: number }[];
  members?: Array<{
    id?: string;
    name: string;
    role?: string;
    department?: string;
    avatar?: string | null;
    github?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    email?: string | null;
  }>;
  createdAt?: string | Date;
  updatedAt: string | Date;
}

interface ProjectManagerProps {
  initialProjects: ProjectItem[];
  categories: string[];
}

export function ProjectManager({
  initialProjects,
  categories,
}: ProjectManagerProps) {
  const router = useRouter();

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [categoriesList, setCategoriesList] = useState<string[]>(categories);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    }
  }, [categories]);

  const handleCategoriesUpdated = (
    newCategoryNames: string[],
    renamedInfo?: { oldName: string; newName: string }
  ) => {
    setCategoriesList(newCategoryNames);

    if (renamedInfo && renamedInfo.oldName !== renamedInfo.newName) {
      setProjects((prev) =>
        prev.map((proj) =>
          proj.category.toLowerCase() === renamedInfo.oldName.toLowerCase()
            ? { ...proj, category: renamedInfo.newName }
            : proj
        )
      );
      setProjectDetails((prev) =>
        prev.category.toLowerCase() === renamedInfo.oldName.toLowerCase()
          ? { ...prev, category: renamedInfo.newName }
          : prev
      );
      if (selectedCategory.toLowerCase() === renamedInfo.oldName.toLowerCase()) {
        setSelectedCategory(renamedInfo.newName);
      }
    }
  };

  // Secondary Filter Tabs: All | Group Teams | Individual Projects
  const [projectTypeFilter, setProjectTypeFilter] = useState<"all" | "group" | "individual">("all");

  // 10 items pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Right-Side Slide-Over Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Multi-step Form State
  const [projectClassification, setProjectClassification] = useState<"group" | "individual">("group");
  const [projectDetails, setProjectDetails] = useState({
    title: "",
    category: categories[0] || "Web Platform",
    order: 0,
    summary: "",
    problem: "",
    solution: "",
    technology: "",
    innovation: "",
    outcomes: "",
  });

  const [projectMedia, setProjectMedia] = useState({
    heroImage: "",
    demoUrl: "",
    videoUrl: "",
    githubUrl: "",
    galleryImages: [] as string[],
    newGalleryUrl: "",
  });
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [projectMembersList, setProjectMembersList] = useState<MemberFormItem[]>([
    {
      name: "",
      role: "Lead Innovator",
      department: "Faculty of Computer Science & IT",
      avatar: "",
      github: "",
      linkedin: "",
      email: "",
      facebook: "",
    },
  ]);

  const [projectSettings, setProjectSettings] = useState({
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    isFeatured: false,
    order: 0,
  });

  // Calculate project classifications
  const isProjectGroup = (p: ProjectItem) => {
    if (p.members && p.members.length > 1) return true;
    if (p.members && p.members.length === 1) return false;
    const count = (p.teamMembers || "").split(",").filter((s) => s.trim().length > 0).length;
    return count > 1 || count === 0;
  };

  const allProjectsCount = projects.length;
  const groupProjectsCount = useMemo(() => projects.filter((p) => isProjectGroup(p)).length, [projects]);
  const individualProjectsCount = useMemo(() => projects.filter((p) => !isProjectGroup(p)).length, [projects]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus, selectedYear, projectTypeFilter]);

  // Open Drawer for Add
  const handleOpenAdd = () => {
    setEditingProject(null);
    setCurrentStep(1);
    setProjectClassification("group");
    setProjectDetails({
      title: "",
      category: categoriesList[0] || "Web Platform",
      order: projects.length + 1,
      summary: "",
      problem: "",
      solution: "",
      technology: "",
      innovation: "",
      outcomes: "",
    });
    setProjectMedia({
      heroImage: "",
      demoUrl: "",
      videoUrl: "",
      githubUrl: "",
      galleryImages: [],
      newGalleryUrl: "",
    });
    setProjectMembersList([
      {
        name: "",
        role: "Lead Innovator",
        department: "Faculty of Computer Science & IT",
        avatar: "",
        github: "",
        linkedin: "",
        email: "",
        facebook: "",
      },
    ]);
    setProjectSettings({
      status: "PUBLISHED",
      isFeatured: false,
      order: projects.length + 1,
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (p: ProjectItem) => {
    setEditingProject(p);
    setCurrentStep(1);
    const isGroup = isProjectGroup(p);
    setProjectClassification(isGroup ? "group" : "individual");

    setProjectDetails({
      title: p.title,
      category: p.category,
      order: p.order || 0,
      summary: p.summary,
      problem: p.problem,
      solution: p.solution,
      technology: p.technology,
      innovation: p.innovation || "",
      outcomes: p.outcomes || "",
    });

    const galleryUrls =
      p.gallery && Array.isArray(p.gallery)
        ? p.gallery.map((g) => g.imageUrl).filter(Boolean)
        : [];

    setProjectMedia({
      heroImage: p.heroImage || "",
      demoUrl: p.demoUrl || "",
      videoUrl: p.videoUrl || "",
      githubUrl: p.githubUrl || "",
      galleryImages: galleryUrls,
      newGalleryUrl: "",
    });

    if (p.members && p.members.length > 0) {
      setProjectMembersList(
        p.members.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role || "Team Member",
          department: m.department || "Faculty of Computer Science & IT",
          avatar: m.avatar || "",
          github: m.github || "",
          linkedin: m.linkedin || "",
          email: m.email || "",
          facebook: m.facebook || "",
        }))
      );
    } else if (p.teamMembers) {
      const names = p.teamMembers.split(",").map((s) => s.trim()).filter(Boolean);
      setProjectMembersList(
        names.map((rawName) => {
          const match = rawName.match(/^(.+?)\s*(?:\((.+?)\))?$/);
          return {
            name: match ? match[1].trim() : rawName,
            role: match && match[2] ? match[2].trim() : "Team Member",
            department: "Faculty of Computer Science & IT",
            avatar: "",
            github: "",
            linkedin: "",
            email: "",
            facebook: "",
          };
        })
      );
    } else {
      setProjectMembersList([
        {
          name: "",
          role: isGroup ? "Team Member" : "Lead Innovator",
          department: "Faculty of Computer Science & IT",
          avatar: "",
          github: "",
          linkedin: "",
          email: "",
          facebook: "",
        },
      ]);
    }

    setProjectSettings({
      status: p.status,
      isFeatured: p.isFeatured,
      order: p.order || 0,
    });

    setFormError(null);
    setDrawerOpen(true);
  };

  // Add another member in Step 3
  const handleAddMember = () => {
    setProjectMembersList((prev) => [
      ...prev,
      {
        name: "",
        role: "Team Member",
        department: "Faculty of Computer Science & IT",
        avatar: "",
        github: "",
        linkedin: "",
        email: "",
        facebook: "",
      },
    ]);
  };

  // Remove a member in Step 3
  const handleRemoveMember = (index: number) => {
    setProjectMembersList((prev) => prev.filter((_, i) => i !== index));
  };

  // Update member field
  const handleMemberChange = (index: number, field: keyof MemberFormItem, val: string) => {
    setProjectMembersList((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: val } : m))
    );
  };

  // Gallery File Upload Handler (Multi-file upload support)
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryUploading(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("folder", "projects");
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload gallery photos");
      }

      const newUrls: string[] = [];
      if (data.items && Array.isArray(data.items)) {
        newUrls.push(...data.items.map((it: any) => it.url).filter(Boolean));
      } else if (data.url) {
        newUrls.push(data.url);
      }

      setProjectMedia((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...newUrls],
      }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error uploading gallery photos");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  // Add gallery photo from URL
  const handleAddGalleryUrl = () => {
    if (projectMedia.newGalleryUrl.trim()) {
      setProjectMedia((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, prev.newGalleryUrl.trim()],
        newGalleryUrl: "",
      }));
    }
  };

  // Validation before advancing
  const handleNextStep = () => {
    setFormError(null);
    if (currentStep === 1) {
      if (!projectDetails.title.trim()) {
        setFormError("Project Title is required");
        return;
      }
      if (!projectDetails.summary.trim()) {
        setFormError("Project Summary is required");
        return;
      }
      if (!projectDetails.problem.trim()) {
        setFormError("Problem description is required");
        return;
      }
      if (!projectDetails.solution.trim()) {
        setFormError("Solution description is required");
        return;
      }
      if (!projectDetails.technology.trim()) {
        setFormError("Technologies used are required");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  // Submit Final
  const handleSubmitProject = async () => {
    setFormLoading(true);
    setFormError(null);

    try {
      const validMembers = projectMembersList.filter((m) => m.name.trim().length > 0);

      const payload = {
        title: projectDetails.title.trim(),
        category: projectDetails.category,
        summary: projectDetails.summary.trim(),
        problem: projectDetails.problem.trim(),
        solution: projectDetails.solution.trim(),
        technology: projectDetails.technology.trim(),
        innovation: projectDetails.innovation.trim() || null,
        outcomes: projectDetails.outcomes.trim() || null,
        heroImage: projectMedia.heroImage.trim() || null,
        demoUrl: projectMedia.demoUrl.trim() || null,
        videoUrl: projectMedia.videoUrl.trim() || null,
        githubUrl: projectMedia.githubUrl.trim() || null,
        galleryImages: projectMedia.galleryImages.filter((img) => img && img.trim().length > 0),
        status: projectSettings.status,
        isFeatured: projectSettings.isFeatured,
        order: Number(projectDetails.order) || 0,
        members: validMembers.map((m) => ({
          id: m.id,
          name: m.name.trim(),
          role: m.role.trim() || "Team Member",
          department: m.department.trim() || "Faculty of Computer Science & IT",
          avatar: m.avatar?.trim() || null,
          github: m.github?.trim() || null,
          linkedin: m.linkedin?.trim() || null,
          email: m.email?.trim() || null,
          facebook: m.facebook?.trim() || null,
        })),
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save project");
      }

      setDrawerOpen(false);
      router.refresh();

      if (editingProject) {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === editingProject.id
              ? ({
                  ...item,
                  ...payload,
                  members: payload.members,
                  updatedAt: new Date(),
                } as any)
              : item
          )
        );
      } else {
        setProjects((prev) => [data.project, ...prev]);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error saving project");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle status inline
  const handleToggleStatus = async (p: ProjectItem, nextStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
        );
        router.refresh();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // Toggle featured inline
  const handleToggleFeatured = async (p: ProjectItem) => {
    const nextVal = !p.isFeatured;
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextVal }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, isFeatured: nextVal } : item))
        );
        router.refresh();
      }
    } catch {
      alert("Failed to update featured status");
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
      }
    } catch {
      alert("Error deleting project");
    }
  };

  // Filter projects by search, category, status, year, and classification
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.summary.toLowerCase().includes(search.toLowerCase()) ||
        p.technology.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;

      // Year Filter
      const matchesYear =
        selectedYear === "all" ||
        (() => {
          if (selectedYear === "2026") {
            return true; // Active cohort
          }
          return false; // 2027 & 2028 are upcoming cohorts
        })();

      const isGroup = isProjectGroup(p);
      const matchesType =
        projectTypeFilter === "all"
          ? true
          : projectTypeFilter === "group"
          ? isGroup
          : !isGroup;

      return matchesSearch && matchesCategory && matchesStatus && matchesType && matchesYear;
    });
  }, [projects, search, selectedCategory, selectedStatus, selectedYear, projectTypeFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProjects, startIndex]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Summary Cards */}
      <KpiRow
        items={[
          { title: "Total Projects", value: allProjectsCount, sub: "all prototypes" },
          {
            title: "Published",
            value: projects.filter((p) => p.status === "PUBLISHED").length,
            sub: "live on portal",
          },
          {
            title: "Drafts",
            value: projects.filter((p) => p.status === "DRAFT").length,
            sub: "in development",
          },
          {
            title: "Archived",
            value: projects.filter((p) => p.status === "ARCHIVED").length,
            sub: "retired prototypes",
          },
        ]}
      />

      {/* Top Filter and Controls Card */}
      <div className="bg-card dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-border dark:border-slate-800 shadow-xs space-y-4">
        {/* Classification Filter Tabs: All | Group Teams | Individual Projects */}
        <div className="flex items-center gap-5 sm:gap-8 border-b border-border dark:border-slate-800 pb-0 text-xs sm:text-sm font-bold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setProjectTypeFilter("all")}
            className={cn(
              "pb-3 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer",
              projectTypeFilter === "all"
                ? "text-[#0875D1] dark:text-sky-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                projectTypeFilter === "all"
                  ? "bg-blue-100 dark:bg-blue-900/60 text-[#0875D1] dark:text-sky-300"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400"
              )}
            >
              {allProjectsCount}
            </span>
            {projectTypeFilter === "all" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0875D1] dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setProjectTypeFilter("group")}
            className={cn(
              "pb-3 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer",
              projectTypeFilter === "group"
                ? "text-[#0875D1] dark:text-sky-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Teams</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                projectTypeFilter === "group"
                  ? "bg-blue-100 dark:bg-blue-900/60 text-[#0875D1] dark:text-sky-300"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400"
              )}
            >
              {groupProjectsCount}
            </span>
            {projectTypeFilter === "group" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0875D1] dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setProjectTypeFilter("individual")}
            className={cn(
              "pb-3 relative transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer",
              projectTypeFilter === "individual"
                ? "text-[#0875D1] dark:text-sky-400 font-extrabold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual Projects</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                projectTypeFilter === "individual"
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400"
              )}
            >
              {individualProjectsCount}
            </span>
            {projectTypeFilter === "individual" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0875D1] dark:bg-sky-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 dark:bg-slate-950/70 border border-border dark:border-slate-800 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters: Year Dropdown, Category, Status & Add Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Year / Cohort Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="pl-3 pr-8 py-2 bg-muted/50 dark:bg-slate-950/70 border border-border dark:border-slate-800 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                title="Filter by Year / Cohort"
              >
                <option value="all">All Cohorts / Years</option>
                <option value="2026">Cohort 2026 (Active)</option>
                <option value="2027">Cohort 2027 (Upcoming)</option>
                <option value="2028">Cohort 2028 (Upcoming)</option>
              </select>
              <Calendar className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-muted/50 dark:bg-slate-950/70 border border-border dark:border-slate-800 rounded-xl text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-muted/50 dark:bg-slate-950/70 border border-border dark:border-slate-800 rounded-xl text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Manage Categories Action */}
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted/60 hover:bg-muted dark:bg-slate-950/70 dark:hover:bg-slate-800 text-foreground border border-border dark:border-slate-800 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              title="Manage Project Categories"
            >
              <Layers className="w-4 h-4 text-[#0875D1] dark:text-sky-400" />
              <span>Categories</span>
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-extrabold">
                {categoriesList.length}
              </span>
            </button>

            {/* Add Project Primary Action */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0875D1] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table - Cleanly sized without horizontal scrolling on normal viewports */}
      <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-border dark:border-slate-800 bg-muted/40 dark:bg-slate-950/60 text-[11px] font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[200px]">Project</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Team</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Featured</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Updated</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-slate-800/80 text-xs sm:text-sm">
              {paginatedProjects.map((p) => {
                const isGroup = isProjectGroup(p);
                const membersCount = p.members?.length || (p.teamMembers ? p.teamMembers.split(",").length : 0);

                return (
                  <tr key={p.id} className="hover:bg-muted/30 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Project Info */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted dark:bg-slate-800 overflow-hidden shrink-0 relative border border-border dark:border-slate-700 shadow-xs">
                          {p.heroImage ? (
                            <Image
                              src={p.heroImage}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground dark:text-slate-400">
                              <FolderGit2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground dark:text-white truncate max-w-[190px] sm:max-w-xs">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground dark:text-slate-400 truncate max-w-[190px]">
                            /projects/{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Project Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                          isGroup
                            ? "bg-blue-100 dark:bg-blue-900/50 text-[#0875D1] dark:text-sky-300 border border-blue-200 dark:border-blue-800"
                            : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        )}
                      >
                        {isGroup ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        <span>{isGroup ? "Group Team" : "Individual"}</span>
                      </span>
                    </td>

                    {/* Category - Fixed wrapping */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-300 text-xs font-semibold whitespace-nowrap inline-block">
                        {p.category}
                      </span>
                    </td>

                    {/* Team Members */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground dark:text-slate-200">
                          {membersCount} {membersCount === 1 ? "member" : "members"}
                        </span>
                        {p.members && p.members.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {p.members.slice(0, 3).map((m, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border border-background dark:border-slate-900 bg-muted dark:bg-slate-800 overflow-hidden shrink-0 relative"
                                title={`${m.name} (${m.role || "Team Member"})`}
                              >
                                {m.avatar ? (
                                  <Image
                                    src={m.avatar}
                                    alt={m.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                    {m.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          handleToggleStatus(p, e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")
                        }
                        className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer uppercase",
                          p.status === "PUBLISHED"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : p.status === "DRAFT"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            : "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-700"
                        )}
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>

                    {/* Featured (Clickable Star) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(p)}
                        className="p-1 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition cursor-pointer"
                        title={p.isFeatured ? "Featured on Homepage (Click to unfeature)" : "Click to feature on homepage"}
                      >
                        {p.isFeatured ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <Star className="w-4 h-4 text-muted-foreground/30 dark:text-slate-600 hover:text-amber-400" />
                        )}
                      </button>
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground dark:text-slate-400 whitespace-nowrap">
                      {formatDate(p.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/projects/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200 transition"
                          title="View Live Showcase"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200 transition cursor-pointer"
                          title="Edit Project & Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-muted-foreground dark:text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground dark:text-slate-400">
                    <p className="text-sm font-semibold">
                      {selectedYear === "2027" || selectedYear === "2028"
                        ? `No projects registered for Cohort ${selectedYear} yet.`
                        : "No projects found matching your search or filters."}
                    </p>
                    <p className="text-xs text-muted-foreground/70 dark:text-slate-500 mt-1">
                      {selectedYear === "2027" || selectedYear === "2028"
                        ? "Upcoming innovations will appear here once submitted."
                        : "Try adjusting your search query, cohort, category, or status."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAGINATION NUMBERS (Displayed when list reaches 10 or more)    */}
      {/* ============================================================== */}
      {filteredProjects.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <div className="text-xs text-muted-foreground dark:text-slate-400">
            Showing <span className="font-bold text-foreground dark:text-white">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-foreground dark:text-white">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredProjects.length)}
            </span>{" "}
            of <span className="font-bold text-foreground dark:text-white">{filteredProjects.length}</span> projects
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous Button */}
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(p - 1, 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border dark:border-slate-800 text-xs font-semibold hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Number Buttons */}
            {getPageNumbers(safeCurrentPage, totalPages).map((pNum, idx) => {
              if (pNum === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-muted-foreground select-none"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = pNum === safeCurrentPage;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pNum as number);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer",
                    isCurrent
                      ? "bg-[#0875D1] dark:bg-sky-500 text-white shadow-xs"
                      : "border border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800"
                  )}
                >
                  {pNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(p + 1, totalPages));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border dark:border-slate-800 text-xs font-semibold hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RIGHT-SIDE SLIDE-OVER DRAWER WITH CONNECTED STEPPER & GALLERY  */}
      {/* ============================================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over Container (Slides in smoothly from the right) */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-8 z-50">
            <div className="w-screen max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              {/* STICKY TOP HEADER */}
              <div className="px-5 sm:px-7 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {editingProject ? "Edit Project Showcase" : "Add New Innovation Project"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Follow the connected steps to configure the prototype, gallery, and team members.
                    </p>
                  </div>
                  {/* CLOSE BUTTON - Permanently Visible and Sticky */}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* CONNECTED 4-STEP WIZARD PROGRESS BAR */}
                <div className="pt-5 pb-1">
                  <div className="flex items-center justify-between relative">
                    {[
                      { step: 1, label: "Project", icon: Layers },
                      { step: 2, label: "Upload", icon: Upload },
                      { step: 3, label: "Members", icon: Users },
                      { step: 4, label: "Submit", icon: CheckCircle2 },
                    ].map(({ step, label, icon: Icon }, idx, arr) => {
                      const isActive = currentStep === step;
                      const isDone = currentStep > step;

                      return (
                        <React.Fragment key={step}>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer z-10 shrink-0"
                          >
                            {/* Step Circle Node */}
                            <div
                              className={cn(
                                "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                                isDone
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : isActive
                                  ? "bg-[#0875D1] dark:bg-sky-500 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100 dark:ring-sky-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                              )}
                            >
                              {isDone ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>

                            {/* Step Label */}
                            <span
                              className={cn(
                                "text-[11px] font-bold transition-colors whitespace-nowrap",
                                isActive
                                  ? "text-[#0875D1] dark:text-sky-400 font-extrabold"
                                  : isDone
                                  ? "text-slate-700 dark:text-slate-300"
                                  : "text-slate-400 dark:text-slate-500"
                              )}
                            >
                              {step}. {label}
                            </span>
                          </button>

                          {/* Connected Track Line between nodes */}
                          {idx < arr.length - 1 && (
                            <div className="flex-1 mx-2 sm:mx-3 h-0.5 -mt-5 relative bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-300",
                                  currentStep > step
                                    ? "bg-[#0875D1] dark:bg-sky-400 w-full"
                                    : "w-0"
                                )}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ERROR BANNER */}
              {formError && (
                <div className="mx-5 sm:mx-7 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SCROLLABLE FORM BODY (Custom thin scrollbar) */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 custom-scrollbar">
                {/* ---------------------------------------------------- */}
                {/* STEP 1: PROJECT DETAILS                              */}
                {/* ---------------------------------------------------- */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Project Classification: Group Team vs Individual */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Project Classification *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setProjectClassification("group")}
                          className={cn(
                            "p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer",
                            projectClassification === "group"
                              ? "border-[#0875D1] dark:border-sky-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-[#0875D1] dark:ring-sky-500"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                          )}
                        >
                          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0875D1] dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Group Team</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                              Multi-student cohort collaborating on this prototype
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProjectClassification("individual")}
                          className={cn(
                            "p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer",
                            projectClassification === "individual"
                              ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                          )}
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Individual Project</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                              Solo student innovator engineering this prototype
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        value={projectDetails.title}
                        onChange={(e) => setProjectDetails({ ...projectDetails, title: e.target.value })}
                        placeholder="e.g. Robot Car Cleaner, Auto Water, Dalag App"
                        className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        required
                      />
                    </div>

                    {/* Category & Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Category *
                          </label>
                          <button
                            type="button"
                            onClick={() => setCategoryModalOpen(true)}
                            className="text-[11px] font-bold text-[#0875D1] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Tag className="w-3 h-3" />
                            <span>Manage Categories</span>
                          </button>
                        </div>
                        <select
                          value={projectDetails.category}
                          onChange={(e) => setProjectDetails({ ...projectDetails, category: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500 cursor-pointer"
                        >
                          {projectDetails.category && !categoriesList.includes(projectDetails.category) && (
                            <option value={projectDetails.category}>
                              {projectDetails.category}
                            </option>
                          )}
                          {categoriesList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={projectDetails.order}
                          onChange={(e) =>
                            setProjectDetails({ ...projectDetails, order: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Summary (Brief Pitch) *
                      </label>
                      <textarea
                        rows={2}
                        value={projectDetails.summary}
                        onChange={(e) => setProjectDetails({ ...projectDetails, summary: e.target.value })}
                        placeholder="Concise overview of what this innovation does..."
                        className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        required
                      />
                    </div>

                    {/* Problem */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Problem Statement *
                      </label>
                      <textarea
                        rows={2}
                        value={projectDetails.problem}
                        onChange={(e) => setProjectDetails({ ...projectDetails, problem: e.target.value })}
                        placeholder="What challenge does this prototype address?"
                        className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        required
                      />
                    </div>

                    {/* Solution */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Solution & Innovation *
                      </label>
                      <textarea
                        rows={2}
                        value={projectDetails.solution}
                        onChange={(e) => setProjectDetails({ ...projectDetails, solution: e.target.value })}
                        placeholder="How did the student team engineer the solution?"
                        className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        required
                      />
                    </div>

                    {/* Technologies Used */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Technologies Used *
                      </label>
                      <input
                        type="text"
                        value={projectDetails.technology}
                        onChange={(e) => setProjectDetails({ ...projectDetails, technology: e.target.value })}
                        placeholder="e.g. Next.js, Arduino, Python, FastApi, IoT Sensors"
                        className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                        required
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Comma-separated tech badges shown on the public showcase page.
                      </p>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 2: UPLOAD (HERO IMAGE, MULTI-GALLERY & LINKS)   */}
                {/* ---------------------------------------------------- */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Hero Image */}
                    <div>
                      <ImageUploadChoice
                        label="Hero Cover Image"
                        value={projectMedia.heroImage}
                        onChange={(url) => setProjectMedia({ ...projectMedia, heroImage: url })}
                        folder="projects"
                        placeholder="Paste image link or upload hero photo"
                        required
                      />
                    </div>

                    {/* Gallery Images with FILE UPLOAD SUPPORT */}
                    <div className="bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-900 dark:text-white">
                            Project Gallery Photos ({projectMedia.galleryImages.length})
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Upload multiple prototype photos from your computer or paste image links.
                          </p>
                        </div>
                        {projectMedia.galleryImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setProjectMedia({ ...projectMedia, galleryImages: [] })}
                            className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* File Upload Dropzone */}
                      <label
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                          galleryUploading
                            ? "border-blue-400 bg-blue-50/30 dark:bg-blue-950/20 opacity-70 cursor-wait"
                            : "border-slate-300 dark:border-slate-700 hover:border-[#0875D1] dark:hover:border-sky-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50/20 dark:hover:bg-slate-850"
                        )}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={galleryUploading}
                          onChange={handleGalleryFileUpload}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0875D1] dark:text-sky-300 flex items-center justify-center shadow-xs">
                          {galleryUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {galleryUploading ? "Uploading photos to gallery..." : "Click to upload photos or drag & drop"}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            PNG, JPG, WebP supported. Multiple photos allowed at once.
                          </p>
                        </div>
                      </label>

                      {/* Fallback / Direct Image URL Input */}
                      <div className="flex gap-2 pt-1">
                        <div className="relative flex-1">
                          <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={projectMedia.newGalleryUrl}
                            onChange={(e) => setProjectMedia({ ...projectMedia, newGalleryUrl: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddGalleryUrl();
                              }
                            }}
                            placeholder="Or paste direct image URL and click Add..."
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddGalleryUrl}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Uploaded Gallery Thumbnails Grid */}
                      {projectMedia.galleryImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                          {projectMedia.galleryImages.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-xs"
                            >
                              <Image
                                src={imgUrl}
                                alt={`Gallery ${idx + 1}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProjectMedia({
                                      ...projectMedia,
                                      galleryImages: projectMedia.galleryImages.filter((_, i) => i !== idx),
                                    })
                                  }
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-transform hover:scale-110 cursor-pointer shadow-md"
                                  title="Remove photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/90 drop-shadow-md">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Demo URLs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Live Demo URL
                        </label>
                        <div className="relative">
                          <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={projectMedia.demoUrl}
                            onChange={(e) => setProjectMedia({ ...projectMedia, demoUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          GitHub Repository
                        </label>
                        <div className="relative">
                          <GitHubIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={projectMedia.githubUrl}
                            onChange={(e) => setProjectMedia({ ...projectMedia, githubUrl: e.target.value })}
                            placeholder="https://github.com/..."
                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Video Demo File / URL */}
                    <FileUploadChoice
                      label="Video Demonstration"
                      fileType="video"
                      value={projectMedia.videoUrl}
                      onChange={(url) => setProjectMedia({ ...projectMedia, videoUrl: url })}
                      folder="videos"
                      placeholder="YouTube link or upload video MP4..."
                      helperText="Paste YouTube/Vimeo demonstration link or upload video file"
                    />
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 3: MEMBERS (STUDENT INNOVATORS & SOCIAL LINKS)  */}
                {/* ---------------------------------------------------- */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {projectClassification === "group" ? "Team Members" : "Lead Innovator"} (
                          {projectMembersList.length})
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {projectClassification === "group"
                            ? "Register students working on this team with their roles and social links."
                            : "Add the student engineer who built this solo prototype."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0875D1] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3.5">
                      {projectMembersList.map((member, index) => (
                        <div
                          key={index}
                          className="bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80 pb-2.5">
                            <span className="text-xs font-extrabold text-[#0875D1] dark:text-sky-400">
                              Member #{index + 1}
                            </span>
                            {projectMembersList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                                placeholder="e.g. Abdi Najiib Aytan"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Role / Title *
                              </label>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => handleMemberChange(index, "role", e.target.value)}
                                placeholder="e.g. Lead Engineer, UI/UX"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1] dark:focus:ring-sky-500"
                              />
                            </div>
                          </div>

                          {/* Avatar URL or Upload */}
                          <div>
                            <ImageUploadChoice
                              label="Profile Headshot / Avatar"
                              value={member.avatar || ""}
                              onChange={(url) => handleMemberChange(index, "avatar", url)}
                              folder="members"
                              placeholder="Headshot URL or upload student photo"
                            />
                          </div>

                          {/* Social handles */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                GitHub
                              </label>
                              <input
                                type="text"
                                value={member.github || ""}
                                onChange={(e) => handleMemberChange(index, "github", e.target.value)}
                                placeholder="username / url"
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                LinkedIn
                              </label>
                              <input
                                type="text"
                                value={member.linkedin || ""}
                                onChange={(e) => handleMemberChange(index, "linkedin", e.target.value)}
                                placeholder="linkedin url"
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                Email
                              </label>
                              <input
                                type="email"
                                value={member.email || ""}
                                onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                                placeholder="student@janic.edu"
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                Facebook
                              </label>
                              <input
                                type="text"
                                value={member.facebook || ""}
                                onChange={(e) => handleMemberChange(index, "facebook", e.target.value)}
                                placeholder="facebook profile"
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 4: SUBMIT & LIVE REVIEW SUMMARY CARD            */}
                {/* ---------------------------------------------------- */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Live Preview Card */}
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#0875D1] dark:text-sky-400 uppercase tracking-wider">
                          Live Portal Preview
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                            projectClassification === "group"
                              ? "bg-blue-100 dark:bg-blue-900/60 text-[#0875D1] dark:text-sky-300"
                              : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                          )}
                        >
                          {projectClassification === "group" ? "Group Team" : "Individual Project"}
                        </span>
                      </div>

                      <div className="flex gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border border-slate-200 dark:border-slate-700">
                          {projectMedia.heroImage ? (
                            <Image
                              src={projectMedia.heroImage}
                              alt="Hero Preview"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <FolderGit2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                            {projectDetails.title || "Untitled Project"}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {projectDetails.summary || "No summary provided."}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {projectDetails.category}
                            </span>
                            {projectDetails.technology.split(",").slice(0, 3).map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Members Attached */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          👥 {projectMembersList.filter((m) => m.name.trim()).length} student innovator(s) attached
                        </span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {projectMembersList
                            .filter((m) => m.name.trim())
                            .slice(0, 4)
                            .map((m, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border border-background dark:border-slate-900 bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 relative text-[8px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-200"
                              >
                                {m.avatar ? (
                                  <Image src={m.avatar} alt={m.name} fill className="object-cover" />
                                ) : (
                                  m.name.charAt(0)
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Publishing Settings */}
                    <div className="bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Publishing Controls</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Status
                          </label>
                          <select
                            value={projectSettings.status}
                            onChange={(e) =>
                              setProjectSettings({
                                ...projectSettings,
                                status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED",
                              })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 uppercase focus:outline-none"
                          >
                            <option value="PUBLISHED">PUBLISHED (Live on portal)</option>
                            <option value="DRAFT">DRAFT (Hidden)</option>
                            <option value="ARCHIVED">ARCHIVED (Retired)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Display Order
                          </label>
                          <input
                            type="number"
                            value={projectDetails.order}
                            onChange={(e) =>
                              setProjectDetails({
                                ...projectDetails,
                                order: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={projectSettings.isFeatured}
                          onChange={(e) =>
                            setProjectSettings({ ...projectSettings, isFeatured: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Feature on JANIC Homepage</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY BOTTOM ACTION FOOTER */}
              <div className="px-5 sm:px-7 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between sticky bottom-0 z-20 shrink-0">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <span>
                      {currentStep === 1
                        ? "Next: Upload"
                        : currentStep === 2
                        ? "Next: Members"
                        : "Next: Submit"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={formLoading}
                    onClick={handleSubmitProject}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0875D1] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold shadow-md transition disabled:opacity-60 cursor-pointer"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing Project...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingProject ? "Update Project & Team" : "Create & Publish Project"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Category Management Modal */}
      <ProjectCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoriesUpdated={handleCategoriesUpdated}
      />
    </div>
  );
}
