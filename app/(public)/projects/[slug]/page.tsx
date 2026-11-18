import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectService } from "@/services/projects/project.service";
import { TeamRepository } from "@/repositories/team.repository";
import { SectionHero } from "@/components/layout/SectionHero";
import { ProjectMemberRepository } from "@/repositories/project-member.repository";
import { ProjectTeamGrid, ProjectTeamGridMember } from "@/components/public/ProjectTeamGrid";
import {
  ExternalLink,
  Code2,
  Video,
  Users,
  CheckCircle2,
  Cpu,
  Sparkles,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/jwt";
import { ProjectMediaCover } from "@/components/public/ProjectMediaCover";
import { ProjectSidebarGallery } from "@/components/public/ProjectSidebarGallery";
import { ScrollReveal } from "@/components/public/ScrollReveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await ProjectService.getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} | JANIC`,
      description: project.summary,
      images: project.heroImage ? [project.heroImage] : [],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await ProjectService.getProjectBySlug(slug);

  const currentUser = await getCurrentUser();
  const isAdminOrEditor =
    currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR";

  if (!project || (project.status !== "PUBLISHED" && !isAdminOrEditor)) {
    notFound();
  }

  const techList = project.technology.split(",").map((t) => t.trim());

  // Resolve rich student members for this project
  const rawMembers = ((project as any).members || []) as any[];
  let projectTeam: ProjectTeamGridMember[] = [];

  if (rawMembers.length > 0) {
    projectTeam = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role || "Innovator",
      department: m.department || "Faculty of Computer Science & IT",
      bio: m.bio || null,
      avatar: m.avatar || null,
      email: m.email || null,
      phone: m.phone || null,
      linkedin: m.linkedin || null,
      github: m.github || null,
      facebook: m.facebook || null,
      twitter: m.twitter || null,
      website: m.website || null,
      tags: m.tags || null,
    }));
  } else {
    const allStudentMembers = await ProjectMemberRepository.findAll();
    const matchedByProj = allStudentMembers.filter(
      (m) => m.projectId === project.id || (m.project && m.project.slug === project.slug)
    );

    if (matchedByProj.length > 0) {
      projectTeam = matchedByProj.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role || "Innovator",
        department: m.department || "Faculty of Computer Science & IT",
        bio: m.bio || null,
        avatar: m.avatar || null,
        email: m.email || null,
        phone: m.phone || null,
        linkedin: m.linkedin || null,
        github: m.github || null,
        facebook: m.facebook || null,
        twitter: m.twitter || null,
        website: m.website || null,
        tags: m.tags || null,
      }));
    } else if (project.teamMembers) {
      const names = project.teamMembers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      projectTeam = names.map((entry) => {
        const match = entry.match(/^(.+?)\s*(?:\((.+?)\))?$/);
        const parsedName = match ? match[1].trim() : entry;
        const parsedRole = match && match[2] ? match[2].trim() : null;

        const student = allStudentMembers.find(
          (s) =>
            s.name.toLowerCase().trim() === parsedName.toLowerCase().trim() ||
            s.name.toLowerCase().includes(parsedName.toLowerCase().trim()) ||
            parsedName.toLowerCase().includes(s.name.toLowerCase().trim())
        );

        if (student) {
          return {
            id: student.id,
            name: student.name,
            role: student.role || parsedRole || "Innovator",
            department: student.department || "Faculty of Computer Science & IT",
            bio: student.bio || null,
            avatar: student.avatar || null,
            email: student.email || null,
            phone: student.phone || null,
            linkedin: student.linkedin || null,
            github: student.github || null,
            facebook: student.facebook || null,
            twitter: student.twitter || null,
            website: student.website || null,
            tags: student.tags || null,
          };
        }

        return {
          name: parsedName,
          role: parsedRole || "Team Member",
          department: "Faculty of Computer Science & IT",
          bio: null,
          avatar: null,
        };
      });
    }
  }


  const storySections = [
    { key: "problem", eyebrow: "The Problem", title: "Challenge & Context", body: project.problem },
    { key: "solution", eyebrow: "The Solution", title: "Engineered Approach & Architecture", body: project.solution },
  ];

  return (
    <div className="bg-white dark:bg-slate-950 overflow-x-clip">
      {project.status !== "PUBLISHED" && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>⚠️ Preview Mode: This project is currently saved as {project.status} (Visible only to Admin/Editor staff)</span>
        </div>
      )}
      <SectionHero
        image={project.heroImage}
        badge={project.category}
        title={project.title}
        description={project.summary}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {project.demoUrl && project.demoUrl.trim().length > 0 && !project.demoUrl.includes("example.com") && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0075ff] hover:bg-[#0064dd] text-white font-bold text-sm shadow-[0_6px_20px_rgb(0_117_255/22%)] hover:-translate-y-0.5 transition-all duration-500"
            >
              <ExternalLink className="w-4 h-4" />
              Live Demo / Website
            </a>
          )}
          {project.videoUrl && project.videoUrl.trim().length > 0 && (
            <a
              href={project.videoUrl.startsWith("http") ? project.videoUrl : "#video-player"}
              target={project.videoUrl.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 hover:bg-white/90 text-[#071a4b] dark:bg-[#0f223a]/60 dark:hover:bg-[#1e3d63]/85 dark:text-white font-bold text-sm border border-[#0075ff] dark:border-[#568fc9] hover:-translate-y-0.5 transition-all duration-500"
            >
              <Video className="w-4 h-4 text-[#0075ff] dark:text-[#80c2ff]" />
              Watch Video Demo
            </a>
          )}
          {project.githubUrl && project.githubUrl.trim().length > 0 && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#08245C] hover:bg-[#051532] text-white font-bold text-sm shadow-[0_6px_20px_rgb(8_36_92/22%)] hover:-translate-y-0.5 transition-all duration-500"
            >
              <Code2 className="w-4 h-4 text-[#80c2ff]" />
              GitHub Repository
            </a>
          )}
        </div>
      </SectionHero>

      <section className="py-14 sm:py-20">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
            {/* Main Content (8 cols) */}
            <div className="lg:col-span-8 min-w-0">
              {/* Hero Media (Video with Voice Volume Control & Timeline Scroll, Hero Image as Fallback) */}
              {(project.videoUrl || project.heroImage) && (
                <ScrollReveal animation="fade-up" duration={800}>
                  <div id="video-player" className="aspect-[16/9] relative rounded-[22px] overflow-hidden bg-slate-950 shadow-[0_20px_45px_rgb(28_94_165/16%)] scroll-mt-28">
                    <ProjectMediaCover
                      videoUrl={project.videoUrl}
                      imageUrl={project.heroImage}
                      alt={project.title}
                      priority
                      showControls={true}
                    />
                  </div>
                </ScrollReveal>
              )}

              {/* The Problem & The Solution */}
              {storySections.map((s, i) => (
                <ScrollReveal key={s.key} animation="fade-up" duration={800}>
                  <article className="pt-12 sm:pt-14">
                    <div className="flex items-start gap-5 sm:gap-7">
                      <span className="hidden sm:block text-5xl font-extrabold tracking-[-0.05em] leading-none text-[#cfe3ff] dark:text-slate-700 select-none" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-3 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
                          <span className="w-8 h-0.5 bg-current" aria-hidden="true" />
                          {s.eyebrow}
                        </p>
                        <h2 className="mt-3 text-2xl sm:text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-[#08245C] dark:text-slate-100">
                          {s.title}
                        </h2>
                        <p className="mt-4 text-base sm:text-[17px] leading-relaxed text-[#5f739a] dark:text-slate-400">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}

              {/* Key Innovation */}
              {project.innovation && (
                <ScrollReveal animation="fade-up" duration={800}>
                  <article className="mt-12 sm:mt-14 relative pl-6 sm:pl-8 py-2 border-l-[3px] border-[#0075ff] dark:border-[#80c2ff]">
                    <p className="inline-flex items-center gap-2 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
                      <Sparkles className="w-4 h-4" />
                      Key Innovation
                    </p>
                    <h2 className="mt-3 text-2xl sm:text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-[#08245C] dark:text-slate-100">
                      What Makes This <span className="text-[#0765ff] dark:text-[#80c2ff]">Unique</span>
                    </h2>
                    <p className="mt-4 text-base sm:text-[17px] leading-relaxed text-[#5f739a] dark:text-slate-400">
                      {project.innovation}
                    </p>
                  </article>
                </ScrollReveal>
              )}

              {/* Outcomes & Impact */}
              {project.outcomes && (
                <ScrollReveal animation="fade-up" duration={800}>
                  <article className="pt-12 sm:pt-14">
                    <div className="flex items-start gap-5 sm:gap-7">
                      <span className="hidden sm:block text-5xl font-extrabold tracking-[-0.05em] leading-none text-[#cfe3ff] dark:text-slate-700 select-none" aria-hidden="true">
                        03
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-3 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
                          <span className="w-8 h-0.5 bg-current" aria-hidden="true" />
                          Outcomes & Validation
                        </p>
                        <h2 className="mt-3 text-2xl sm:text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-[#08245C] dark:text-slate-100">
                          Results & Testing Performance
                        </h2>
                        <p className="mt-4 text-base sm:text-[17px] leading-relaxed text-[#5f739a] dark:text-slate-400">
                          {project.outcomes}
                        </p>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              )}

              {/* Student Innovators & Engineering Team */}
              {projectTeam.length > 0 && (
                <ScrollReveal animation="fade-up" duration={800}>
                  <div className="mt-14 sm:mt-16 pt-12 sm:pt-14 border-t border-[#e2edf8] dark:border-[#273b56] space-y-7">
                    <div>
                      <p className="flex items-center gap-3 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
                        <span className="w-8 h-0.5 bg-current" aria-hidden="true" />
                        Student Innovators & Engineering Team
                      </p>
                      <h2 className="mt-3 text-2xl sm:text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-[#08245C] dark:text-white">
                        Built by <span className="text-[#0765ff] dark:text-[#80c2ff]">{projectTeam.length}{" "}
                        {projectTeam.length === 1 ? "Student Innovator" : "Student Innovators"}</span>
                      </h2>
                      <p className="mt-3 text-base text-[#6b7fa6] dark:text-slate-400">
                        Meet the student inventors, developers, and researchers behind this prototype.
                      </p>
                    </div>

                    <ProjectTeamGrid members={projectTeam} />
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* Sidebar (4 cols) */}
            <aside className="lg:col-span-4 min-w-0">
              <div className="space-y-5">
                {/* Technology Stack */}
                <ScrollReveal animation="fade-up" duration={750}>
                  <div className="p-6 rounded-[20px] bg-[#f0f6fe] dark:bg-[#0f1e35] space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#6b7fa6] dark:text-slate-400">
                      <Cpu className="w-4 h-4 text-[#0075ff] dark:text-[#80c2ff]" />
                      Technologies Used
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {techList.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#152e4f] text-[#0075ff] dark:text-[#80c2ff] font-semibold text-xs shadow-[0_4px_12px_rgb(46_114_187/8%)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Student Team */}
                {projectTeam.length > 0 && (
                  <ScrollReveal animation="fade-up" duration={750} delay={80}>
                    <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#062253] to-[#031331] text-white space-y-3 relative overflow-hidden">
                      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#0075ff]/25 blur-3xl pointer-events-none" aria-hidden="true" />
                      <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#80c2ff]">
                        <Users className="w-4 h-4" />
                        Engineering Team
                      </div>
                      <p className="relative text-5xl font-extrabold tracking-[-0.04em] leading-none">
                        {projectTeam.length}
                      </p>
                      <p className="relative text-xs text-slate-300">
                        {projectTeam.length === 1 ? "engineer" : "engineers"} built this project
                      </p>
                      <p className="relative text-sm text-slate-200 leading-relaxed font-medium pt-1">
                        {project.teamMembers}
                      </p>
                      <p className="relative text-[11px] text-slate-400 pt-1">
                        Faculty of Computer Science & IT, Jazeera University
                      </p>
                    </div>
                  </ScrollReveal>
                )}

                {/* Project Meta */}
                <ScrollReveal animation="fade-up" duration={750} delay={160}>
                  <dl className="px-1 text-sm">
                    <div className="flex justify-between gap-4 py-3 border-b border-[#e2edf8] dark:border-[#273b56]">
                      <dt className="text-[#6b7fa6] dark:text-slate-400">Category</dt>
                      <dd className="font-semibold text-[#08245C] dark:text-slate-100 text-right">{project.category}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3 border-b border-[#e2edf8] dark:border-[#273b56]">
                      <dt className="text-[#6b7fa6] dark:text-slate-400">Published Date</dt>
                      <dd className="font-semibold text-[#08245C] dark:text-slate-100 text-right">
                        {formatDate(project.publishedAt || project.createdAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3 border-b border-[#e2edf8] dark:border-[#273b56]">
                      <dt className="text-[#6b7fa6] dark:text-slate-400">Incubation Status</dt>
                      <dd className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">Active Lab Prototype</dd>
                    </div>
                  </dl>
                </ScrollReveal>

                {/* Back to list button */}
                <Link
                  href="/projects"
                  className="group w-full py-3.5 px-4 rounded-full border border-[#0075ff] dark:border-[#568fc9] text-[#0075ff] dark:text-[#80c2ff] hover:bg-[#0075ff] hover:text-white dark:hover:bg-[#0869db] dark:hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-300"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  Back to All Projects
                </Link>

                {/* Project Gallery in the Sidebar Empty Space */}
                {project.gallery && project.gallery.length > 0 && (
                  <ProjectSidebarGallery
                    gallery={project.gallery as any}
                    projectTitle={project.title}
                    studentInnovators={projectTeam}
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
