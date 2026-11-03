import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventService } from "@/services/events/event.service";
import { GuestEventConfigService } from "@/lib/services/guest-event-config.service";
import { SectionHero } from "@/components/layout/SectionHero";
import { EventVideoPlayer } from "@/components/public/EventVideoPlayer";
import { EventGallery } from "@/components/public/EventGallery";
import { EventGuestsList } from "@/components/public/EventGuestsList";
import { EventAgendaTimeline } from "@/components/public/EventAgendaTimeline";
import {
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Building2,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await EventService.getEventBySlug(slug);
  if (!event) return { title: "Event Not Found | JANIC" };

  return {
    title: `${event.title} | JANIC`,
    description: event.summary,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await EventService.getEventBySlug(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const isPast = new Date(event.eventDate) < new Date();

  // Lazy bootstrap of the operational guest configuration so the event page can
  // expose the internal registration flow. Idempotent: the config is unique per
  // event and admins edit the same row in Phase 2.
  let guestConfig = null;
  if (!isPast) {
    guestConfig = await GuestEventConfigService.getOrCreateForEvent(event).catch((error) => {
      console.error("[events] could not load guest registration config", error);
      return null;
    });
  }
  const guestClosedReason = guestConfig
    ? GuestEventConfigService.getClosedReason(guestConfig)
    : null;
  const internalRegistrationOpen = Boolean(
    guestConfig && guestConfig.isActive && guestClosedReason === null
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-x-clip transition-colors">
      {/* 1. SECTION HERO */}
      <SectionHero
        image={event.coverImage}
        badge={`${event.category} • ${isPast ? "Hosted by JANIC" : "Upcoming Event"}`}
        title={event.title}
        description={event.summary}
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: event.title },
        ]}
      />

      {/* 2. MAIN CONTENT & SIDEBAR */}
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* MAIN COLUMN (8 cols) */}
            <div className="lg:col-span-8 space-y-10 sm:space-y-12">
              {/* Event Cover Image Banner */}
              {event.coverImage && (
                <div className="aspect-[16/9] relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-2 text-white">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md border border-white/20">
                      {isPast ? "Past Event Hosted by JANIC" : "Upcoming Showcase"}
                    </span>
                    <span className="text-xs text-slate-200 font-medium">
                      {formatDate(event.eventDate)}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. EVENT VIDEO SECTION (NEW) */}
              {(event as any).videoUrl && (
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <EventVideoPlayer
                    videoUrl={(event as any).videoUrl}
                    coverImage={event.coverImage}
                    title={event.title}
                  />
                </div>
              )}

              {/* 2. EVENT OVERVIEW & PURPOSE */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-[#08245C] dark:text-blue-400">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#08245C] dark:text-white">
                    Event Overview &amp; Background
                  </h3>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
                  {event.description}
                </div>
              </div>

              {/* 3. EVENT AGENDA & TIMELINE (NEW) */}
              {((event as any).agenda || (event as any).keyHighlights) && (
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <EventAgendaTimeline
                    agenda={(event as any).agenda}
                    keyHighlights={(event as any).keyHighlights}
                  />
                </div>
              )}

              {/* 4. EVENT GUESTS & SPEAKERS (NEW) */}
              {(event as any).guests && (
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <EventGuestsList guests={(event as any).guests} />
                </div>
              )}

              {/* 5. INTERACTIVE EVENT PHOTO GALLERY (NEW) */}
              {(event as any).gallery && (
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <EventGallery
                    gallery={(event as any).gallery}
                    eventTitle={event.title}
                  />
                </div>
              )}
            </div>

            {/* SIDEBAR COLUMN (4 cols) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Quick Details Card */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                    EVENT STATUS
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isPast ? "bg-emerald-500" : "bg-blue-600 animate-ping"
                      }`}
                    />
                    <h3 className="text-base sm:text-lg font-black text-[#08245C] dark:text-white">
                      {isPast ? "Hosted by JANIC (Concluded)" : "Upcoming Event"}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Date &amp; Time</strong>
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Venue Location</strong>
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {((event as any).attendeesCount || event.capacity) && (
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">
                          {isPast ? "Attendees Recorded" : "Capacity"}
                        </strong>
                        <span>
                          {isPast
                            ? `${(event as any).attendeesCount || event.capacity}+ Attendees Participated`
                            : `${event.capacity} Available Seats`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call to action in sidebar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!isPast && internalRegistrationOpen ? (
                    <Link
                      href={`/events/${event.slug}/register`}
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      Register for Event
                    </Link>
                  ) : !isPast && event.registrationUrl ? (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Register for Event
                    </a>
                  ) : isPast ? (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 text-center">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                        Official JANIC Event Record
                      </span>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        This event concluded successfully. Review the video and photo galleries above.
                      </p>
                    </div>
                  ) : guestConfig && guestClosedReason ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Registration Closed
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {guestClosedReason === "NOT_OPEN_YET"
                          ? "Online guest registration has not opened yet."
                          : "Online guest registration for this event has closed."}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Registration opens 2 weeks before the event
                    </div>
                  )}
                </div>
              </div>

              {/* Host Organization Info */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-[#08245C] dark:text-blue-400">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Host Organization
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jazeera Nexus Innovation Center (JANIC)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Faculty of Computer Science &amp; IT, Jazeera University, Mogadishu, Somalia.
                </p>
                <div className="pt-2">
                  <Link
                    href="/about"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Learn more about JANIC &rarr;
                  </Link>
                </div>
              </div>

              {/* Back to Events Button */}
              <Link
                href="/events"
                className="w-full py-3 px-4 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
