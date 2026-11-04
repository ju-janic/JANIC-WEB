import React from "react";
import Link from "next/link";
import { SectionHero } from "@/components/layout/SectionHero";
import { SponsorForm } from "@/components/forms/SponsorForm";
import { SponsorMarquee } from "@/components/public/SponsorMarquee";
import { SponsorService } from "@/services/sponsors/sponsor.service";
import { Building2, Sparkles } from "lucide-react";

export const metadata = {
  title: "Sponsors | JANIC Resources",
  description:
    "Meet the sponsors of Jazeera Nexus Innovation Center (JANIC) and submit a sponsorship proposal for student technology projects, innovation challenges, training, and events.",
};

export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  const sponsors = await SponsorService.getApprovedSponsors();

  const marqueeSponsors = sponsors.map((sponsor) => ({
    id: sponsor.id,
    organizationName: sponsor.organizationName,
    logoUrl: sponsor.logoUrl ?? null,
    sponsorshipLevel: sponsor.sponsorshipLevel ?? null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 overflow-x-clip">
      <SectionHero
        badge="Partnership & Sponsorship"
        title="JANIC Sponsors"
        description="The organizations and companies that power student technology projects, innovation challenges, training programs, and events at Jazeera Nexus Innovation Center."
        breadcrumbs={[
          { label: "Resources", href: "/training" },
          { label: "Sponsors" },
        ]}
      />

      {/* OUR SPONSORS */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0875D1] bg-blue-50 dark:bg-[#0875D1]/15 dark:text-blue-300 px-4 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Our Partners
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mt-4">
              <span className="bg-gradient-to-r from-[#08245C] via-[#0875D1] to-[#00A3E0] bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-sky-400">
                Our Sponsors
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              The organizations and companies that sponsor JANIC&apos;s innovation
              programs, training, and student activities.
            </p>
          </div>

          {sponsors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No sponsors yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Be the first to support JANIC! Submit a sponsorship proposal and our team will review it.
              </p>
              <Link
                href="/sponsors#sponsorship-form"
                className="inline-block mt-5 px-5 py-2.5 bg-[#0875D1] hover:bg-[#065ea8] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow"
              >
                Become a Sponsor
              </Link>
            </div>
          ) : (
            <SponsorMarquee sponsors={marqueeSponsors} />
          )}
        </div>
      </section>

      {/* SPONSORSHIP FORM */}
      <section className="py-16 sm:py-20 bg-[#F8FBFF] dark:bg-slate-950" id="sponsorship-form">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0875D1]">Get Involved</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#08245C] dark:text-white tracking-tight mt-2">
              Submit a Sponsorship Proposal
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Tell us which program you would like to support and what your organization can contribute.
              Proposals are reviewed by the JANIC team before any approval.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <SponsorForm />
          </div>
        </div>
      </section>
    </div>
  );
}
