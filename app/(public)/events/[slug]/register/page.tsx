import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHero } from "@/components/layout/SectionHero";
import { GuestRegistrationForm } from "@/components/forms/GuestRegistrationForm";
import { GuestEventConfigService } from "@/lib/services/guest-event-config.service";
import { CalendarDays, Clock, Mail, MapPin, Phone, ShieldCheck, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const context = await GuestEventConfigService.getRegistrationContext(slug).catch(() => null);
  if (!context) return { title: "Event Registration Not Found" };
  return {
    title: `Register — ${context.config.eventName}`,
    description: `Register your attendance for ${context.config.eventName}.`,
  };
}

export default async function GuestRegistrationPage({ params }: PageProps) {
  const { slug } = await params;
  const context = await GuestEventConfigService.getRegistrationContext(slug).catch((error) => {
    console.error("[guest-registration] could not load event context", error);
    return null;
  });

  if (!context) notFound();

  const { config, isOpen, closedMessage } = context;

  const eventDateLabel = config.eventDate
    ? new Date(config.eventDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: config.timezone,
      })
    : null;

  const closingDateLabel = config.registrationClosesAt
    ? new Date(config.registrationClosesAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: config.timezone,
      })
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-x-clip transition-colors">
      <SectionHero
        badge="Guest Registration"
        title={config.eventName}
        description={`Complete the form below to request your place at ${config.eventName}.`}
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: config.eventName, href: `/events/${config.slug}` },
          { label: "Register" },
        ]}
        image={undefined}
      />

      <div className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* FORM COLUMN */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-8">
              {isOpen ? (
                <GuestRegistrationForm
                  event={GuestEventConfigService.toPublicEvent(config)}
                />
              ) : (
                <div className="text-center py-10 space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Ticket className="w-7 h-7 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#08245C] dark:text-white">
                      Registration is unavailable
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                      {closedMessage ??
                        "Guest registration for this event is not currently available."}
                    </p>
                    {closingDateLabel && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Registration closed on {closingDateLabel}.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={`/events/${config.slug}`}
                      className="px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold transition"
                    >
                      Back to Event
                    </Link>
                    {config.contactEmail && (
                      <a
                        href={`mailto:${config.contactEmail}`}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        Contact JANIC
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
                  Event Details
                </h2>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  {eventDateLabel && (
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">Date</strong>
                        {eventDateLabel}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Time</strong>
                      {config.startTime} – {config.endTime} ({config.timezone})
                    </div>
                  </div>

                  {(config.venue || config.location) && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">Venue</strong>
                        {config.venue}
                        {config.location && config.location !== config.venue && (
                          <>
                            <br />
                            {config.location}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {config.contactEmail && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <strong className="block text-slate-900 dark:text-white">Email</strong>
                        <a
                          href={`mailto:${config.contactEmail}`}
                          className="text-[#0875D1] hover:underline break-all"
                        >
                          {config.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {config.contactPhone && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">Phone</strong>
                        <a
                          href={`tel:${config.contactPhone.replace(/\s+/g, "")}`}
                          className="text-[#0875D1] hover:underline"
                        >
                          {config.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {closingDateLabel && isOpen && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-200">
                      Registration closes:
                    </strong>{" "}
                    {closingDateLabel}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-blue-100 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-900/60 p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[#08245C] dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-[#0875D1]" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    How it works
                  </span>
                </div>
                <ol className="space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 list-decimal list-inside">
                  <li>Submit your registration with accurate contact details.</li>
                  <li>You receive a pending confirmation and reference number.</li>
                  <li>The JANIC events team reviews every registration.</li>
                  <li>You are contacted once a decision has been made.</li>
                </ol>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Registration is free and does not require a JANIC account.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
