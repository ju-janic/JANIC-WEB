import React from "react";
import Image from "next/image";
import { InvitationActions } from "@/components/guests/InvitationActions";
import type { InvitationView } from "@/lib/services/guest-invitation.service";
import { cn } from "@/lib/utils";

interface InvitationCardProps {
  invitation: InvitationView;
  tone?: "admin" | "public";
  className?: string;
}

const GOLD = "#C9A24B";
const NAVY = "#08245C";

function formatIssued(value: string | null, timeZone: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 py-1" style={{ color: GOLD }}>
      <span
        className="h-px w-10 sm:w-14"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${GOLD}b3)` }}
      />
      <span className="text-[10px] leading-none tracking-[0.3em]">&#10022;</span>
      <span
        className="h-px w-10 sm:w-14"
        style={{ backgroundImage: `linear-gradient(to left, transparent, ${GOLD}b3)` }}
      />
    </div>
  );
}

/**
 * Formal, print-ready digital invitation: JANIC crest, event identity, honoured
 * guest, Guest ID and the verification QR code on one classic card.
 *
 * The design uses fixed brand colours (navy + gold on warm paper) so it renders
 * identically in light and dark mode, and captures cleanly for download. The
 * action buttons live OUTSIDE the card so they never appear in the downloaded
 * image.
 */
export function InvitationCard({ invitation, tone = "public", className }: InvitationCardProps) {
  const { event } = invitation;
  const guestId = invitation.guestId || invitation.registrationRef;
  const issuedLabel = formatIssued(invitation.issuedAt, event.timezone);
  const cardId = `invitation-card-${invitation.registrationId}`;

  return (
    <div className="space-y-4">
      <article
        id={cardId}
        className={cn(
          "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[24px] bg-[#FFFDF9] p-2.5 shadow-[0_18px_50px_-24px_rgba(8,36,92,0.45)] print:max-w-none print:shadow-none",
          className
        )}
      >
        {/* Double gold frame */}
        <div className="rounded-[18px] border p-1.5" style={{ borderColor: `${GOLD}80` }}>
          <div
            className="rounded-[14px] border px-6 py-9 text-center sm:px-12 sm:py-11"
            style={{ borderColor: `${GOLD}4d` }}
          >
            {/* Crest / Logo */}
          <div className="flex flex-col items-center">
            <div className="relative h-[60px] w-[180px] sm:h-[70px] sm:w-[220px]">
              <Image
                src="/images/janic-new-with-jazeera-blue.png"
                alt="JANIC & University of Jazeera"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.34em] text-slate-400">
              Official Invitation
            </p>
          </div>

            <div className="mt-5">
              <Ornament />
            </div>

            {/* Invitation line */}
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
              You are cordially invited to
            </p>
            <h2
              className="mt-2 font-serif text-2xl font-bold leading-[1.15] tracking-tight sm:text-[30px]"
              style={{ color: NAVY }}
            >
              {event.name}
            </h2>

            <div className="mt-5">
              <Ornament />
            </div>

            {/* When & where */}
            <div className="mt-5 space-y-1.5">
              {event.dateLabel && (
                <p className="font-serif text-lg" style={{ color: NAVY }}>
                  {event.dateLabel}
                </p>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {event.timeLabel}
              </p>
              {event.venueLabel && (
                <p className="text-[12px] leading-relaxed text-slate-600">{event.venueLabel}</p>
              )}
            </div>

            {/* Honoured guest */}
            <div className="mt-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.34em] text-slate-400">
                Presented to
              </p>
              <p
                className="mt-1.5 font-serif text-[26px] italic leading-tight"
                style={{ color: NAVY }}
              >
                {invitation.guestName}
              </p>
              <p className="mt-1 break-all text-[11px] text-slate-500">{invitation.email}</p>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 font-mono text-[11px] font-bold"
                style={{ borderColor: `${GOLD}80`, backgroundColor: "#FBF4E4", color: NAVY }}
              >
                Guest ID · {guestId}
              </span>
            </div>

            {/* QR */}
            <div className="mt-7 flex flex-col items-center">
              <div
                className="rounded-2xl border bg-white p-3 shadow-[0_6px_18px_-10px_rgba(8,36,92,0.4)]"
                style={{ borderColor: `${GOLD}66` }}
              >
                {invitation.qrDataUrl ? (
                  <Image
                    src={invitation.qrDataUrl}
                    alt={`QR code for ${invitation.guestName}`}
                    width={172}
                    height={172}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-[172px] w-[172px] items-center justify-center text-slate-300">
                    <span className="text-xs">QR unavailable</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                Scan at the entrance to check in
              </p>
            </div>

            {/* Meta */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
              <span>
                Invitation No.{" "}
                <strong className="font-mono" style={{ color: NAVY }}>
                  {invitation.invitationNumber || guestId}
                </strong>
              </span>
              {issuedLabel && <span>Issued {issuedLabel}</span>}
              {(event.contactEmail || event.contactPhone) && (
                <span className="break-all">
                  {event.contactEmail}
                  {event.contactEmail && event.contactPhone ? " · " : ""}
                  {event.contactPhone}
                </span>
              )}
            </div>

            {invitation.verificationUrl && (
              <p className="mt-2 break-all text-[9px] text-slate-400">
                Verify: {invitation.verificationUrl}
              </p>
            )}
          </div>
        </div>
      </article>

      <div className="flex justify-center">
        <InvitationActions
          qrDataUrl={invitation.qrDataUrl}
          filename={guestId}
          tone={tone === "public" ? "public" : "admin"}
          targetId={cardId}
        />
      </div>
    </div>
  );
}
