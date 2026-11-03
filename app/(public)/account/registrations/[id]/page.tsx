import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SectionHero } from "@/components/layout/SectionHero";
import { getCurrentUser } from "@/lib/auth/jwt";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { GuestInvitationService } from "@/lib/services/guest-invitation.service";
import { InvitationCard } from "@/components/guests/InvitationCard";
import { REGISTRATION_STATUS_LABELS } from "@/lib/guests/constants";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  Phone,
  QrCode,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "My Registration",
  robots: { index: false, follow: false },
};

export default async function MyRegistrationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect(`/login?from=${encodeURIComponent("/account/registrations")}`);

  const { id } = await params;
  const registration = await GuestRegistrationRepository.findById(id);
  if (!registration || registration.deletedAt || registration.userId !== user.id) notFound();

  const invitation = await GuestInvitationService.build(id).catch(() => null);
  const issued = invitation?.invitationStatus === "ISSUED" && invitation.qrDataUrl;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
      <SectionHero
        badge="My Event Registration"
        title={registration.eventConfig.eventName}
        description="Your registration status and digital invitation."
        breadcrumbs={[
          { label: "My Event Registration", href: "/account/registrations" },
          { label: "Details" },
        ]}
      />

      <div className="py-12 sm:py-16 print:py-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Invitation */}
          <div className="lg:col-span-2 space-y-5">
            {issued && invitation ? (
              <InvitationCard invitation={invitation} tone="public" />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2">
                  {registration.status === "REJECTED" ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <QrCode className="w-5 h-5 text-[#0875D1]" />
                  )}
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
                    Invitation
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {registration.status === "REJECTED"
                    ? "Your registration was not approved, so no invitation is available."
                    : registration.status === "APPROVED"
                      ? "Your invitation is being prepared. Please check back shortly."
                      : "Your invitation will appear here once the JANIC events team approves your registration."}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
                Registration
              </h2>
              <dl className="space-y-2 text-xs">
                <Row label="Reference" value={registration.registrationRef} mono />
                <Row label="Status" value={REGISTRATION_STATUS_LABELS[registration.status] ?? registration.status} />
                {registration.guestId && (
                  <Row label="Guest ID" value={registration.guestId} mono />
                )}
                <Row label="Full name" value={registration.fullName} />
                <Row label="Organization" value={registration.organization} />
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#08245C] dark:text-white">
                Event Details
              </h2>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                {invitation?.event.dateLabel && (
                  <span className="flex items-start gap-2.5">
                    <CalendarDays className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    {invitation.event.dateLabel}
                  </span>
                )}
                <span className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                  {invitation?.event.timeLabel}
                </span>
                {invitation?.event.venueLabel && (
                  <span className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    {invitation.event.venueLabel}
                  </span>
                )}
                {invitation?.event.contactEmail && (
                  <span className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    <a
                      href={`mailto:${invitation.event.contactEmail}`}
                      className="text-[#0875D1] hover:underline break-all"
                    >
                      {invitation.event.contactEmail}
                    </a>
                  </span>
                )}
                {invitation?.event.contactPhone && (
                  <span className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    <a
                      href={`tel:${invitation.event.contactPhone.replace(/\s+/g, "")}`}
                      className="text-[#0875D1] hover:underline"
                    >
                      {invitation.event.contactPhone}
                    </a>
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/account/registrations"
              className="block text-center text-xs font-semibold text-[#0875D1] hover:underline"
            >
              ← Back to my registrations
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`text-right font-medium text-slate-900 dark:text-white ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
