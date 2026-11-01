import React from "react";
import Link from "next/link";
import { SectionHero } from "@/components/layout/SectionHero";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { JanicCta } from "@/components/public/JanicCta";
import { ProjectService } from "@/services/projects/project.service";
import { ProjectsFilterControls } from "@/components/public/ProjectsFilterControls";
import { ComingSoonCohort } from "@/components/public/ComingSoonCohort";
import { ProjectMediaCover } from "@/components/public/ProjectMediaCover";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Student Innovation Projects",
  description:
    "Explore student-engineered solutions in Web Platforms, HealthTech, Robotics, Arduino, IoT, and AI developed at JANIC.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; year?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || "all";
  const searchQuery = resolvedParams.q || "";
  const currentYear = resolvedParams.year || "all";

  const [rawProjects, categories] = await Promise.all([
    ProjectService.getPublishedProjects({
      category: currentCategory === "all" ? undefined : currentCategory,
      search: searchQuery || undefined,
    }),
    ProjectService.getCategories(),
  ]);

  const isFutureCohort = currentYear === "2027" || currentYear === "2028";

  // Filter projects by year when a specific active year like 2026 is chosen
  const projects = isFutureCohort
    ? []
    : currentYear !== "all"
    ? rawProjects.filter((p) => {
        const d = new Date(p.publishedAt || p.createdAt);
        return d.getFullYear() === parseInt(currentYear, 10);
      })
    : rawProjects;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 overflow-x-clip">
      {/* 1. HERO */}
      <SectionHero
        badge="Innovations in Action"
        title="Student Innovation Showcase"
        description="From classroom ideas to real-world solutions. Discover functional prototypes, robotics hardware, and software platforms engineered by Jazeera University students."
        breadcrumbs={[{ label: "Projects" }]}
      />

      {/* 2. FILTERS & PROJECT GRID */}
      <section className="py-14 sm:py-20 bg-[#f0f6fe] dark:bg-[#081225] min-h-[600px]">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8">
          <ScrollReveal animation="fade-up" duration={800} className="relative z-30">
            <header className="mb-8 sm:mb-10">
              <p className="flex items-center gap-3 text-[#0075ff] dark:text-[#80c2ff] text-xs font-bold uppercase tracking-[0.08em]">
                <span className="w-8 h-0.5 bg-current" aria-hidden="true" />
                Projects Portfolio
              </p>
              <h2 className="mt-3.5 text-[30px] sm:text-4xl lg:text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#08245C] dark:text-slate-100">
                Explore Student <span className="text-[#0765ff] dark:text-[#80c2ff]">Innovations</span>
              </h2>
            </header>

            <ProjectsFilterControls
              categories={categories}
              currentCategory={currentCategory}
              currentYear={currentYear}
              searchQuery={searchQuery}
              totalProjectsCount={isFutureCohort ? 0 : projects.length}
            />
          </ScrollReveal>

          {/* If 2027 or 2028 is selected, display the Coming Soon component */}
          {isFutureCohort ? (
            <ComingSoonCohort year={currentYear} />
          ) : projects.length === 0 ? (
            <ScrollReveal animation="fade-up" duration={700}>
              <div className="py-16 text-center max-w-lg mx-auto">
                <span className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#eff8ff] to-[#dceeff] dark:from-[#1b385a] dark:to-[#122a48] text-[#0075ff] dark:text-[#80c2ff]">
                  <Sparkles className="w-7 h-7" />
                </span>
                <h3 className="text-xl font-bold text-[#08245C] dark:text-slate-100">No projects found</h3>
                <p className="text-sm text-[#6279a1] dark:text-slate-400 mt-2">
                  Try adjusting your search query, selecting another category, or viewing another cohort year.
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-[#0075ff] hover:bg-[#0064dd] text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-colors"
                >
                  Reset all filters
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 relative z-10">
              {projects.map((project, index) => (
                <ScrollReveal
                  key={project.id}
                  animation="fade-up"
                  duration={750}
                  delay={(index % 3) * 110}
                  className="flex min-w-0"
                >
                  <Link
                    href={`/projects/${project.slug}`}
                    className="group flex flex-col w-full min-w-0 p-[5px] rounded-[20px] bg-white/95 dark:bg-[#0f1e35] border border-white dark:border-[#273b56] shadow-[0_10px_30px_rgb(61_128_191/7%)] hover:shadow-[0_20px_40px_rgb(30_104_175/16%)] hover:-translate-y-1.5 transition-all duration-500 ease-out"
                  >
                    {/* Media (video prioritised when uploaded) */}
                    <div className="relative aspect-[16/10] rounded-[16px] overflow-hidden bg-slate-900">
                      <ProjectMediaCover
                        videoUrl={project.videoUrl}
                        imageUrl={project.heroImage}
                        alt={project.title}
                        fallbackImage="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
                        className="object-cover group-hover:scale-[1.045] transition-transform duration-700 ease-out"
                      />
                      <span className="absolute top-3 left-3 z-10 px-3.5 py-1.5 rounded-full bg-[#f2faff]/95 dark:bg-[#152e4f] text-[#0075e8] dark:text-[#80c2ff] text-[10px] font-bold uppercase tracking-[0.06em] max-w-[calc(100%-24px)] truncate">
                        {project.category}
                      </span>
                    </div>

                    {/* Card content */}
                    <div className="flex flex-1 flex-col px-4 pt-4 pb-4 sm:px-5">
                      <h3 className="text-lg font-extrabold leading-snug tracking-[-0.02em] text-[#08245C] dark:text-slate-100 group-hover:text-[#0075ff] dark:group-hover:text-[#80c2ff] transition-colors">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#6279a1] dark:text-slate-400 line-clamp-3">
                        {project.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {project.technology
                          .split(",")
                          .slice(0, 3)
                          .map((tech, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#e7f3ff] dark:bg-[#152e4f] text-[#0075ff] dark:text-[#80c2ff]"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#e2edf8] dark:border-[#273b56]">
                          <span className="text-sm font-bold text-[#08245C] dark:text-slate-100 group-hover:text-[#0075ff] dark:group-hover:text-[#80c2ff] transition-colors">
                            View Solution
                          </span>
                          <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-[#0082f5] group-hover:bg-[#006bd6] dark:bg-[#0869db] text-white transition-colors">
                            <ArrowRight className="w-[18px] h-[18px] transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CALL TO ACTION — shared Home "Get Involved" section */}
      <JanicCta />
    </div>
  );
}
