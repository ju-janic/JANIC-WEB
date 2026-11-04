import React from "react";
import type { PartnershipInquiry } from "@prisma/client";
import styles from "./CollaborationFramework.module.css";
import { SectionHero } from "@/components/layout/SectionHero";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { JanicCta } from "@/components/public/JanicCta";
import { PartnershipForm } from "@/components/forms/PartnershipForm";
import { SponsorMarquee } from "@/components/public/SponsorMarquee";
import { PartnershipService } from "@/services/partnerships/partnership.service";
import { Building2, Globe2, Rocket, Award, ShieldCheck, Users, GraduationCap, HeartHandshake, Landmark, Cpu, Microscope, Handshake } from "lucide-react";

export const metadata = {
  title: "Partnerships & Collaboration",
  description:
    "Partner with JANIC at Jazeera University. Collaborative research, student incubators, hardware lab sponsorships, and IT certifications.",
};

export const dynamic = "force-dynamic";

export default async function PartnershipsPage() {
  const approvedPartners: PartnershipInquiry[] = await PartnershipService.getApprovedPublic().catch(
    () => []
  );

  const partnerItems = approvedPartners.map((partner) => ({
    id: partner.id,
    organizationName: partner.organizationName,
    logoUrl: (partner.logoUrl ?? null) as string | null,
    sponsorshipLevel: null as string | null,
  }));

  const waysToCollaborate = [
    {
      title: "Mentoring & Technical Expertise",
      desc: "Lead guest lectures, offer industry mentorship, and share technical expertise with student developers and researchers.",
      icon: Users,
    },
    {
      title: "Industry Problem Statements & R&D",
      desc: "Propose real-world business challenges and co-create applied research prototypes with academic supervision.",
      icon: Building2,
    },
    {
      title: "Internships & Career Opportunities",
      desc: "Host student interns, organize corporate workplace visits, and recruit verified top talent graduating from JANIC.",
      icon: Rocket,
    },
    {
      title: "Workshops, Equipment & Cloud Credits",
      desc: "Support student hackathons, sponsor specialized hardware kits, developer tools, or institutional cloud credits.",
      icon: Award,
    },
    {
      title: "Research, Pilot Testing & Community Pilots",
      desc: "Joint peer-reviewed publications, live field prototype testing, pilot trials, and civic community initiatives.",
      icon: Globe2,
    },
  ];

  const coreSectors = [
    { title: "SMEs & Startups", desc: "Scaling with digital solutions & tech talent", icon: Rocket },
    { title: "Women-Owned Businesses", desc: "Empowering with technology & mentorship", icon: Users },
    { title: "Universities & Education", desc: "Research, curriculum & student programs", icon: GraduationCap },
    { title: "NGOs & Development Organizations", desc: "Digital transformation & community tech", icon: HeartHandshake },
    { title: "Government Institutions", desc: "Digital governance & public innovation", icon: Landmark },
    { title: "Technology Companies", desc: "R&D, talent & co-development", icon: Cpu },
    { title: "Researchers & Professionals", desc: "Joint publications & applied research", icon: Microscope },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-clip">
      {/* 1. HERO SECTION */}
      <SectionHero
        badge="Strategic Alliances"
        title="Let's Build the Future Together"
        description="JANIC welcomes collaboration with universities, technology companies, government ministries, NGOs, and venture investors."
        breadcrumbs={[{ label: "Partnerships" }]}
      />

      {/* 2. TRUSTED BY SECTION - HORIZONTAL SCROLL SLIDER (EXACT 7 SECTORS ONLY) */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-b from-white via-[#F8FBFF] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        <div className="relative max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-down" duration={850}>
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0875D1] bg-blue-50 dark:bg-[#0875D1]/15 dark:text-blue-300 px-4 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0875D1] dark:bg-blue-300"></span>
                Our Network
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#08245C] dark:text-white tracking-tight leading-tight mt-4">
                Trusted by the Organizations We Work With
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mt-3 max-w-2xl mx-auto">
                We Partner With A Wide Range Of Organizations Across Sectors, Helping Them Grow, Innovate, And Reach Their Goals.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal animation="fade-up" duration={800} delay={200}>
          <div className={styles.networkTrack + " group relative"}>
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent z-10 pointer-events-none"></div>

            <div className="overflow-hidden">
              <div className="flex w-max gap-4 sm:gap-5 animate-marquee group-hover:[animation-play-state:paused]">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-4 sm:gap-5 shrink-0" aria-hidden={setIndex === 1 ? true : undefined}>
                    {coreSectors.map((org, orgIndex) => {
                      const Icon = org.icon;
                      return (
                        <article key={org.title} className={styles.networkCard}>
                          <div className={styles.networkCardTop}>
                            <span className={styles.networkIcon}><Icon size={27} strokeWidth={1.7} aria-hidden="true" /></span>
                            <span className={styles.networkNumber} aria-hidden="true">{String(orgIndex + 1).padStart(2, "0")}</span>
                          </div>
                          <h3>{org.title}</h3>
                          <p>{org.desc}</p>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 2b. OUR PARTNERS - APPROVED PARTNERSHIPS INFINITE SCROLL */}
      <section className="py-14 sm:py-16 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-down" duration={850}>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0875D1] bg-blue-50 dark:bg-[#0875D1]/15 dark:text-blue-300 px-4 py-1.5 rounded-full">
                <Handshake className="w-3.5 h-3.5" />
                Our Partners
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#08245C] dark:text-white tracking-tight leading-tight mt-4">
                Organizations Partnering with JANIC
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mt-3 max-w-2xl mx-auto">
                The partners that collaborate with JANIC on research, student programs,
                and innovation initiatives.
              </p>
            </div>
          </ScrollReveal>

          {partnerItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm max-w-xl mx-auto">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No partners yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Be the first to collaborate with JANIC — submit a partnership proposal below.
              </p>
            </div>
          ) : (
            <SponsorMarquee sponsors={partnerItems} />
          )}
        </div>
      </section>

      {/* 3. FULL-WIDTH COLLABORATION FRAMEWORK */}
      <section className="w-full py-10 sm:py-14 bg-[#F0F6FE] overflow-hidden">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-left" duration={850}>
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className={`${styles.framework} lg:col-span-6`}>
                  <header className={styles.heading}>
                    <span className={styles.eyebrow}>Ways to Collaborate</span>
                    <h2>Partnering with JANIC</h2>
                    <p>JANIC welcomes collaboration with technology companies, public institutions, NGOs, universities, alumni, startups, and development partners to connect real-world challenges with student talent and academic expertise.</p>
                  </header>
                  <div className={styles.benefits}>
                    {waysToCollaborate.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <ScrollReveal key={item.title} animation="fade-up" duration={700} delay={index * 90} className={styles.cardEntrance}>
                          <article className={styles.benefitCard}>
                            <span className={styles.icon}><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>
                            <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                          </article>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                  <aside className={styles.integrity} aria-labelledby="partnership-integrity-title">
                    <span className={styles.integrityIcon}><ShieldCheck size={26} aria-hidden="true" /></span>
                    <div>
                      <h3 id="partnership-integrity-title">Institutional Integrity</h3>
                      <p>All partnerships are governed under formal Memorandums of Understanding (MoU) with the Faculty of Computer Science &amp; IT at Jazeera University.</p>
                    </div>
                  </aside>
                </div>

                <div className="lg:col-span-6 space-y-8">
                  <div className="bg-white p-8 sm:p-10 rounded-2xl border border-blue-100/80 shadow-md space-y-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00A3E0] block mb-1">
                        Partnership Inquiries
                      </span>
                      <h3 className="text-2xl font-bold text-[#0B3B82] tracking-tight">
                        Start a Collaboration
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Tell us about your organization and how we can work together.
                      </p>
                    </div>

                    <PartnershipForm />
                  </div>

                  {/* Sponsorship Categories Notice as per Section 7 */}
                  <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A3E0] block mb-1">
                      Sponsorship Opportunities
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      Sponsorship Tiers (Gold, Silver, Supporting & In-Kind)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      JANIC offers tiered sponsorship opportunities for regional tech innovators, equipment manufacturers, and corporate donors. Specific sponsorship benefits and partner logo inclusions are activated upon formal bilateral approval.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold text-[#0B3B82]">
                      <div className="p-2.5 bg-amber-50 border border-amber-200/70 rounded-lg">Gold Partner</div>
                      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg">Silver Partner</div>
                      <div className="p-2.5 bg-blue-50 border border-blue-200/70 rounded-lg">Supporting</div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200/70 rounded-lg">In-Kind</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CALL TO ACTION — shared Home "Get Involved" section */}
      <JanicCta />
    </div>
  );
}
