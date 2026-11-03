import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHero } from "@/components/layout/SectionHero";
import { getCurrentUser } from "@/lib/auth/jwt";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { GuestStatusBadge } from "@/components/admin/GuestStatusBadge";
import { REGISTRATION_STATUS_LABELS } from "@/lib/guests/constants";
import { ArrowRight, CalendarDays, Clock, MapPin, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Event Registration",
  robots: { index: false, follow: false },
};

function formatDate(date: Date | null, timeZone: string): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

export default async function MyEventRegistrationsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect(`/login?from=${encodeURIComponent("/account/registrations")}`);

  const registrations = await GuestRegistrationRepository.listForUser(user.id).catch((error) => {
    console.error("[account] could not load registrations", error);
    return [];
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
      <SectionHero
        badge="My JANIC"
        title="My Event Registration"
        description="Track your registration status and access your digital invitation and QR code."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Event Registration" }]}
      />

      <div className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {registrations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-10 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Ticket className="w-7 h-7 text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-[#08245C] dark:text-white">
                No registrations yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                When you register for a JANIC event, your registration and digital invitation will
                appear here.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold transition"
              >
                Browse Events
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            registrations.map((registration) => {
              const config = registration.eventConfig;
              const eventDate = formatDate(config.eventDate, config.timezone);
              const venue = [config.venue, config.location].filter(Boolean).join(", ");
              return (
                <div
                  key={registration.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-lg font-black text-[#08245C] dark:text-white">
                        {config.eventName}
                      </h2>
                      <p className="font-mono text-[11px] font-bold text-[#0875D1]">
                        {registration.registrationRef}
                      </p>
                    </div>
                    <GuestStatusBadge status={registration.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                    {eventDate && (
                      <span className="flex items-start gap-2">
                        <CalendarDays className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                        {eventDate}
                      </span>
                    )}
                    <span className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                      {config.startTime} – {config.endTime} ({config.timezone})
                    </span>
                    {venue && (
                      <span className="flex items-start gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                        {venue}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {REGISTRATION_STATUS_LABELS[registration.status] ??
                      registration.status}
                    {registration.guestId ? ` · Guest ID ${registration.guestId}` : ""}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Link
                      href={`/account/registrations/${registration.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#08245C] hover:bg-[#0a2f75] text-white text-xs font-bold transition"
                    >
                      View registration & invitation
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/events/${config.slug ?? ""}`}
                      className="text-xs font-semibold text-[#0875D1] hover:underline"
                    >
                      Event page
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
