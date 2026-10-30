import { JanicHero } from "@/components/public/JanicHero";
import { JanicAbout } from "@/components/public/JanicAbout";
import { JanicFunctions } from "@/components/public/JanicFunctions";
import { ResearchService } from "@/services/research/research.service";
import { EventService } from "@/services/events/event.service";
import { ProjectService } from "@/services/projects/project.service";
import { InnovationPipelineNodes } from "@/components/public/InnovationPipelineNodes";
import { JanicCommunitySections } from "@/components/public/JanicCommunitySections";
import { JanicPortfolio } from "@/components/public/JanicPortfolio";
import { TrustedOrganizationsSection } from "@/components/public/TrustedOrganizationsSection";
import { JanicCta } from "@/components/public/JanicCta";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [researchPapers, upcomingEvents, featuredProjects] = await Promise.all([
    ResearchService.getFeaturedPapers(3),
    EventService.getUpcomingEvents(3),
    ProjectService.getFeaturedProjects(8),
  ]);

  const heroTitle = await getSetting("hero_title", "Innovating Technology. Empowering the Future.");
  const heroSubtitle = await getSetting("hero_subtitle", "JANIC is where ideas become practical digital solutions. Based at Jazeera University, we connect students, faculty, industry, and communities to develop technology, strengthen digital skills, and turn promising ideas into meaningful impact.");
  const savedHeroImage = await getSetting("hero_image", "/images/jazeera.jpeg");
  const heroImage = savedHeroImage === "/images/janic-hero-lab.jpg" ? "/images/jazeera.jpeg" : savedHeroImage;
  const heroBadgeValue = await getSetting("hero_badge_value", "18+");
  const heroBadgeLabel = await getSetting("hero_badge_label", "STUDENT INNOVATION PROJECTS");

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 overflow-x-clip">
      <JanicHero title={heroTitle} subtitle={heroSubtitle} image={heroImage} badgeValue={heroBadgeValue} badgeLabel={heroBadgeLabel} />
      <JanicAbout />

      <JanicFunctions />

      <InnovationPipelineNodes />

      {(() => {
        const fallbackGrid: {
          title: string;
          summary: string;
          category: string;
          heroImage: string;
          slug: string;
          videoUrl?: string | null;
        }[] = [
            {
              title: "MAAL HUB",
              summary: "Integrated financial management system for micro enterprises.",
              category: "FINTECH",
              heroImage: "/images/maal-hub.jpg",
              slug: "maal-hub",
              videoUrl: null,
            },
            {
              title: "Robot Car Cleaner",
              summary: "Autonomous cleaning solutions for urban environments.",
              category: "ROBOTICS",
              heroImage: "/images/robot-car-cleaner.jpg",
              slug: "robot-car-cleaner",
              videoUrl: null,
            },
            {
              title: "SAHAL SACCO",
              summary: "Automating credit and savings operations.",
              category: "SAAS",
              heroImage: "/images/sahal-sacco.jpg",
              slug: "sahal-sacco",
              videoUrl: null,
            },
            {
              title: "BADBAADO Platform",
              summary: "Digital coordination for emergency health services.",
              category: "SAFETY TECH",
              heroImage: "/images/badbaado-safety.jpg",
              slug: "badbaado",
              videoUrl: null,
            },
          ];


        const allProjects = featuredProjects || [];

        // Match stored DB projects
        const findProject = (matchSlug: string, matchTitle: string) =>
          allProjects.find(
            (p) =>
              p.slug.toLowerCase().includes(matchSlug) ||
              p.title.toLowerCase().includes(matchTitle)
          );

        const p1 = findProject("maal", "maal") || allProjects[0] || fallbackGrid[0];
        const p2 = findProject("robot", "robot") || allProjects[1] || fallbackGrid[1];
        const p3 = findProject("sahal", "sahal") || allProjects[2] || fallbackGrid[2];
        const p4 =
          allProjects.find(
            (p) =>
              p.id !== p1?.id &&
              p.id !== p2?.id &&
              p.id !== p3?.id
          ) || fallbackGrid[3];

        const gridCards = [
          {
            title: p1?.title || fallbackGrid[0].title,
            summary: p1?.summary || fallbackGrid[0].summary,
            category: p1?.category || fallbackGrid[0].category,
            heroImage: p1?.heroImage || fallbackGrid[0].heroImage,
            videoUrl: p1?.videoUrl || null,
            slug: p1?.slug || fallbackGrid[0].slug,
          },
          {
            title: p2?.title || fallbackGrid[1].title,
            summary: p2?.summary || fallbackGrid[1].summary,
            category: p2?.category || fallbackGrid[1].category,
            heroImage: p2?.heroImage || fallbackGrid[1].heroImage,
            videoUrl: p2?.videoUrl || null,
            slug: p2?.slug || fallbackGrid[1].slug,
          },
          {
            title: p3?.title || fallbackGrid[2].title,
            summary: p3?.summary || fallbackGrid[2].summary,
            category: p3?.category || fallbackGrid[2].category,
            heroImage: p3?.heroImage || fallbackGrid[2].heroImage,
            videoUrl: p3?.videoUrl || null,
            slug: p3?.slug || fallbackGrid[2].slug,
          },
          {
            title: p4?.title || fallbackGrid[3].title,
            summary: p4?.summary || fallbackGrid[3].summary,
            category: p4?.category || fallbackGrid[3].category,
            heroImage: p4?.heroImage || fallbackGrid[3].heroImage,
            videoUrl: p4?.videoUrl || null,
            slug: p4?.slug || fallbackGrid[3].slug,
          },
        ];
        return <JanicPortfolio cards={gridCards} />;
      })()}

      <JanicCommunitySections
        research={(researchPapers || []).map(paper => ({ title: paper.title, abstract: paper.abstract, slug: paper.slug }))}
        events={(upcomingEvents || []).map(event => ({ title: event.title, slug: event.slug, date: new Date(event.eventDate).toISOString(), location: event.location, coverImage: event.coverImage }))}
      />

      <TrustedOrganizationsSection />

      <JanicCta
        eyebrow="Join JANIC"
        description="Whether you are a student with a bold idea, a faculty mentor, or an industry partner seeking applied research, JANIC is your innovation platform."
        primary={{ href: "/submit-innovation", label: "Join JANIC Today" }}
        secondary={{ href: "/partnerships", label: "Partner With Us" }}
      />
    </div>
  );
}
