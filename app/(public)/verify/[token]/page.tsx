import React from "react";
import Link from "next/link";
import { SectionHero } from "@/components/layout/SectionHero";
import { GuestInvitationService } from "@/lib/services/guest-invitation.service";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  ShieldX,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verify Invitation",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyInvitationPage({ params }: PageProps) {
  const { token } = await params;
  const result = await GuestInvitationService.verify(token).catch((error) => {
    console.error("[verify] could not resolve token", error);
    return { found: false as const };
  });

  if (!result.found) {
    return (
      <VerifyShell
        tone="danger"
        icon={<ShieldX className="h-7 w-7" />}
        title="Invalid or unknown invitation"
        message="This QR code could not be matched to a JANIC invitation. It may be mistyped, or the invitation may have been removed."
      />
    );
  }

  const isRevoked = result.invitationStatus === "REVOKED";
  const isApproved = result.registrationStatus === "APPROVED";
  const valid = !isRevoked && isApproved;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
      <SectionHero
        badge="Invitation Verification"
        title={result.event.name}
        description="Scanned invitation details for entry verification."
        breadcrumbs={[{ label: "Verify" }]}
      />

      <div className="py-12 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div
              className={`px-6 py-5 text-white ${
                valid ? "bg-emerald-600" : "bg-rose-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  {valid ? <BadgeCheck className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                    {isRevoked ? "Invitation revoked" : valid ? "Valid invitation" : "Not approved"}
                  </p>
                  <h2 className="text-xl font-black">{result.guestName}</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Guest ID
                  </p>
                  <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                    {result.guestId || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reference
                  </p>
                  <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                    {result.registrationRef}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {result.event.dateLabel && (
                  <span className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    {result.event.dateLabel}
                  </span>
                )}
                <span className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                  {result.event.timeLabel}
                </span>
                {result.event.venueLabel && (
                  <span className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#0875D1] shrink-0 mt-0.5" />
                    {result.event.venueLabel}
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0875D1]" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {result.checkedIn ? "Already checked in" : "Not yet checked in"}
                  </p>
                </div>
                {result.checkedIn && result.checkedInAt && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Checked in on{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: result.event.timezone,
                    }).format(new Date(result.checkedInAt))}
                  </p>
                )}
              </div>

              {!valid && (
                <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                  {isRevoked
                    ? "This invitation was revoked and is no longer valid for entry."
                    : "This registration has not been approved, so the invitation is not valid for entry."}
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-500 dark:text-slate-400">
            Verification is read-only and shows no personal contact details.{" "}
            <Link href="/" className="text-[#0875D1] hover:underline">
              Return to JANIC
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function VerifyShell({
  tone,
  icon,
  title,
  message,
}: {
  tone: "danger" | "info";
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100">
      <SectionHero badge="Invitation Verification" title={title} description={message} breadcrumbs={[{ label: "Verify" }]} />
      <div className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 text-center space-y-4">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
                tone === "danger"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                  : "bg-blue-50 text-[#0875D1] dark:bg-blue-950/40 dark:text-sky-400"
              }`}
            >
              {icon}
            </div>
            <h2 className="text-xl font-black text-[#08245C] dark:text-white">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold transition"
            >
              Return to JANIC
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
