import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHero } from "@/components/layout/SectionHero";
import { GuestRegistrationService } from "@/lib/services/guest-registration.service";
import { PrintConfirmationButton } from "@/components/guests/PrintConfirmationButton";
import { REGISTRATION_STATUS_LABELS } from "@/lib/guests/constants";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Registration Confirmation — ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function GuestRegistrationConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  const result = await GuestRegistrationService.getReceiptByToken(token, slug).catch((error) => {
    console.error("[guest-registration] could not load confirmation", error);
    return null;
  });

  if (!result) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
        <SectionHero
          badge="Registration Confirmation"
          title="Confirmation link unavailable"
          description="This confirmation link is invalid or has expired."
          breadcrumbs={[
            { label: "Events", href: "/events" },
            { label: "Registration" },
          ]}
        />
        <div className="py-16">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-black text-[#08245C] dark:text-white">
                We could not verify this confirmation
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Confirmation links expire after 7 days. If you have already registered, your
                reference number is in the confirmation email or you can contact the JANIC events
                team for help.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href={`/events/${slug}`}
                  className="px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold transition"
                >
                  Back to Event
                </Link>
                <Link
                  href={`/events/${slug}/register`}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Register Again
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { receipt } = result;
  const eventDateLabel = receipt.eventDate
    ? new Date(receipt.eventDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: receipt.timezone,
      })
    : null;
  const submittedLabel = new Date(receipt.submittedAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: receipt.timezone,
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
      <SectionHero
        badge="Registration Received"
        title="Thank you for registering"
        description={`Your place request for ${receipt.eventName} has been recorded.`}
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: receipt.eventName, href: `/events/${slug}` },
          { label: "Confirmation" },
        ]}
      />

      <div className="py-12 sm:py-16 print:py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Status banner */}
          <div className="rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200">
                  Registration submitted successfully
                </h2>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {GuestRegistrationService.describeStatus(receipt.status)}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">
                  Submitted {submittedLabel} ({receipt.timezone})
                </p>
              </div>
            </div>
          </div>

          {/* Reference card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-[#0875D1]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
                  Registration Reference
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                {REGISTRATION_STATUS_LABELS[receipt.status] ?? receipt.status}
              </span>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Keep this reference safe
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-black tracking-wide text-[#08245C] dark:text-white break-all">
                  {receipt.reference}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Detail label="Guest name" value={receipt.fullName} />
                <Detail label="Email address" value={receipt.email} />
                <Detail
                  label="Event"
                  value={receipt.eventName}
                  icon={<CalendarDays className="w-4 h-4 text-[#0875D1] mt-0.5 shrink-0" />}
                />
                <Detail
                  label="Date"
                  value={eventDateLabel ?? "To be confirmed"}
                />
                <Detail
                  label="Time"
                  value={`${receipt.startTime} – ${receipt.endTime} (${receipt.timezone})`}
                  icon={<Clock className="w-4 h-4 text-[#0875D1] mt-0.5 shrink-0" />}
                />
                {(receipt.venue || receipt.location) && (
                  <Detail
                    label="Venue"
                    value={[receipt.venue, receipt.location].filter(Boolean).join(", ")}
                    icon={<MapPin className="w-4 h-4 text-[#0875D1] mt-0.5 shrink-0" />}
                  />
                )}
              </dl>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
              What happens next?
            </h3>
            <ol className="space-y-3">
              {[
                "The JANIC events team reviews your registration.",
                "You will be contacted by email or phone with the outcome.",
                "If approved, you will receive further event and entry instructions.",
              ].map((text, index) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0875D1] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {text}
                  </span>
                </li>
              ))}
            </ol>

            {(receipt.contactEmail || receipt.contactPhone) && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Questions about your registration?
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {receipt.contactEmail && (
                    <a
                      href={`mailto:${receipt.contactEmail}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#0875D1] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {receipt.contactEmail}
                    </a>
                  )}
                  {receipt.contactPhone && (
                    <a
                      href={`tel:${receipt.contactPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#0875D1] hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {receipt.contactPhone}
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Please quote your reference number in any correspondence.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
            <Link
              href={`/events/${slug}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold transition"
            >
              Back to Event
            </Link>
            <Link
              href={`/events/${slug}/register`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Register Another Guest
            </Link>
            <PrintConfirmationButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-800 dark:text-slate-100">
        {icon}
        <span className="break-words">{value}</span>
      </dd>
    </div>
  );
}
