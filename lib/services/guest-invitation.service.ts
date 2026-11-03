import type { GuestEventConfig, GuestInvitationStatus } from "@prisma/client";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { buildVerificationUrl, renderQrDataUrl } from "@/lib/guests/qr";
import { formatEventDate, formatEventTime, formatEventVenue } from "@/lib/guests/format";

/**
 * Builds the guest-facing and scanner-facing views of a digital invitation.
 *
 * The QR image is generated server-side from an opaque token; no personal data
 * is ever encoded in the QR payload.
 */

export interface InvitationEventView {
  name: string;
  dateLabel: string | null;
  timeLabel: string;
  venueLabel: string | null;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface InvitationView {
  registrationId: string;
  guestId: string | null;
  guestName: string;
  email: string;
  registrationRef: string;
  registrationStatus: string;
  invitationId: string | null;
  invitationNumber: string | null;
  invitationStatus: GuestInvitationStatus | null;
  issuedAt: string | null;
  revokedAt: string | null;
  verificationUrl: string | null;
  qrDataUrl: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  event: InvitationEventView;
}

export type VerificationOutcome =
  | { found: false }
  | {
      found: true;
      invitationStatus: GuestInvitationStatus;
      registrationStatus: string;
      guestName: string;
      guestId: string | null;
      registrationRef: string;
      checkedIn: boolean;
      checkedInAt: string | null;
      revokedAt: string | null;
      event: InvitationEventView;
    };

type EventViewSource = Pick<
  GuestEventConfig,
  | "eventName"
  | "eventDate"
  | "startTime"
  | "endTime"
  | "timezone"
  | "venue"
  | "location"
  | "contactEmail"
  | "contactPhone"
>;

function eventView(config: EventViewSource): InvitationEventView {
  return {
    name: config.eventName,
    dateLabel: formatEventDate(config, { withWeekday: true }),
    timeLabel: formatEventTime(config),
    venueLabel: formatEventVenue(config),
    timezone: config.timezone,
    contactEmail: config.contactEmail,
    contactPhone: config.contactPhone,
  };
}

export class GuestInvitationService {
  /** Assembles the invitation + live QR for a registration (admin & guest views). */
  static async build(registrationId: string): Promise<InvitationView | null> {
    const registration = await GuestRegistrationRepository.findByIdForAdmin(registrationId);
    if (!registration) return null;

    const invitation = registration.invitations[0] ?? null;
    const checkIn = registration.checkIns[0] ?? null;
    const isIssued = invitation?.status === "ISSUED";
    const verificationUrl = invitation ? buildVerificationUrl(invitation.qrToken) : null;

    return {
      registrationId: registration.id,
      guestId: registration.guestId,
      guestName: registration.fullName,
      email: registration.email,
      registrationRef: registration.registrationRef,
      registrationStatus: registration.status,
      invitationId: invitation?.id ?? null,
      invitationNumber: invitation?.invitationNumber ?? null,
      invitationStatus: invitation?.status ?? null,
      issuedAt: invitation?.issuedAt ? invitation.issuedAt.toISOString() : null,
      revokedAt: invitation?.revokedAt ? invitation.revokedAt.toISOString() : null,
      verificationUrl,
      qrDataUrl:
        isIssued && invitation
          ? await renderQrDataUrl(verificationUrl as string, 480)
          : null,
      checkedIn: Boolean(checkIn),
      checkedInAt: checkIn ? checkIn.checkedInAt.toISOString() : null,
      event: eventView(registration.eventConfig),
    };
  }

  /** Resolves a scanned QR token into a public-safe verification result. */
  static async verify(qrToken: string): Promise<VerificationOutcome> {
    const token = qrToken?.trim();
    if (!token) return { found: false };

    const invitation = await GuestRegistrationRepository.findByQrToken(token);
    if (!invitation || invitation.registration.deletedAt) return { found: false };

    const checkIn = invitation.registration.checkIns[0] ?? null;

    return {
      found: true,
      invitationStatus: invitation.status,
      registrationStatus: invitation.registration.status,
      guestName: invitation.registration.fullName,
      guestId: invitation.registration.guestId,
      registrationRef: invitation.registration.registrationRef,
      checkedIn: Boolean(checkIn),
      checkedInAt: checkIn ? checkIn.checkedInAt.toISOString() : null,
      revokedAt: invitation.revokedAt ? invitation.revokedAt.toISOString() : null,
      event: eventView(invitation.registration.eventConfig),
    };
  }
}
