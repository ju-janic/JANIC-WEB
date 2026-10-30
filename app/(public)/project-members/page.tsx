import React from "react";
import { SectionHero } from "@/components/layout/SectionHero";
import { ProjectService } from "@/services/projects/project.service";
import { ProjectMemberRepository } from "@/repositories/project-member.repository";
import { ProjectMembersDirectory } from "@/components/public/ProjectMembersDirectory";
import { getGroupMeta } from "@/lib/project-team";
import { Users, Sparkles, FolderGit2, Award } from "lucide-react";

export const metadata = {
  title: "Project Members & Teams | JANIC",
  description:
    "Meet the student innovators, developers, and engineers behind the innovation projects developed at the Jazeera Nexus Innovation Center (JANIC).",
};

export const dynamic = "force-dynamic";

export default async function ProjectMembersPage() {
  const [members, rawProjects] = await Promise.all([
    ProjectMemberRepository.findAll({ isActive: true }),
    ProjectService.getPublishedProjects(),
  ]);

  // Sort projects in canonical order
  const projects = (rawProjects as any[])
    .sort((a: any, b: any) => a.order - b.order)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      category: p.category,
      order: p.order,
      heroImage: p.heroImage,
      teamMembers: p.teamMembers,
      status: p.status,
    }));

  const validProjectIds = new Set(projects.map((p: any) => p.id));
  const validProjectSlugs = new Set(projects.map((p: any) => p.slug));

  // Only keep member records that belong to stored database projects
  const memberRecords = (members as any[])
    .filter((m: any) => {
      if (m.projectId && validProjectIds.has(m.projectId)) return true;
      if (
        m.project &&
        (validProjectIds.has(m.project.id) || validProjectSlugs.has(m.project.slug))
      )
        return true;
      return false;
    })
    .map((m: any) => {
      const proj =
        projects.find((p: any) => p.id === m.projectId) ||
        (m.project
          ? projects.find(
              (p: any) => p.slug === m.project?.slug || p.id === m.project?.id
            )
          : null);

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        department: m.department,
        bio: m.bio,
        avatar: m.avatar,
        projectId: proj ? proj.id : m.projectId,
        project: proj
          ? {
              id: proj.id,
              title: proj.title,
              slug: proj.slug,
              category: proj.category,
              order: proj.order,
              heroImage: proj.heroImage,
              summary: proj.summary,
            }
          : null,
        facebook: m.facebook,
        github: m.github,
        email: m.email,
        linkedin: m.linkedin,
        tags: m.tags,
        order: m.order,
        isActive: m.isActive,
      };
    });

  const totalProjectsCount = projects.length;
  const groupTeamsCount = projects.filter(
    (p: any) => getGroupMeta(p.order, p.title).type === "group"
  ).length;
  const individualProjectsCount = projects.filter(
    (p: any) => getGroupMeta(p.order, p.title).type === "individual"
  ).length;
  const totalEngineersCount = memberRecords.length;

  const heroStats = [
    { icon: FolderGit2, value: `${totalProjectsCount}`, label: "Total Projects" },
    { icon: Users, value: `${groupTeamsCount}`, label: "Group Teams" },
    { icon: Sparkles, value: `${individualProjectsCount}`, label: "Individual Projects" },
    { icon: Award, value: `${totalEngineersCount}`, label: "Student Engineers" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 overflow-x-clip">
      {/* 1. HERO SECTION (ROUNDED CARD HERO MATCHING OTHER PAGES) */}
      <SectionHero
        badge="JIT Innovation Cohort"
        title="Project Members & Teams"
        description={
          totalProjectsCount > 0
            ? `Meet the dedicated student innovators, developers, and engineers behind the ${totalProjectsCount} projects at JANIC. Explore collaborative group teams and individual ventures driving regional technology.`
            : "Meet the dedicated student innovators, developers, and engineers at JANIC."
        }
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Project Members" },
        ]}
      >
        {/* Hero stats — dynamically computed from stored database records */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 py-4 rounded-[20px] bg-white/40 dark:bg-[#0c1b30]/80 border border-white/70 dark:border-[#263e5d] backdrop-blur-md shadow-[0_15px_35px_rgb(91_155_218/6%)] max-w-[640px]">
          {heroStats.map(({ icon: Icon, value, label }, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 min-w-0 ${i === 3 ? "" : i % 2 === 0 ? "border-r" : "sm:border-r"} border-[#d6e7ff] dark:border-[#2a405d]`}
            >
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-[14px] bg-[#deedff] dark:bg-[#152e4f] text-[#0075ff] dark:text-[#80c2ff]">
                <Icon className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="flex flex-col-reverse min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d7fa4] dark:text-[#acbfd9] leading-tight">{label}</dt>
                <dd className="text-xl font-extrabold text-[#031541] dark:text-white leading-tight">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </SectionHero>

      {/* 2. DIRECTORY SECTION WITH FILTER CONTROLS */}
      <section className="py-14 sm:py-20 bg-[#f0f6fe] dark:bg-[#081225] min-h-[600px] overflow-hidden">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8">
          <ProjectMembersDirectory
            initialMembers={memberRecords}
            projects={projects}
          />
        </div>
      </section>
    </div>
  );
}
