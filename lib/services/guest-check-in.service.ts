import type { GuestInvitationStatus, GuestRegistrationStatus } from "@prisma/client";
import {
  GuestCheckInRepository,
  type CheckInActor,
  type ScannedRegistration,
} from "@/lib/repositories/guest-check-in.repository";
import {
  ATTENDANCE_LABELS,
  COMPANION_LABELS,
  STAKEHOLDER_CATEGORY_LABELS,
} from "@/lib/guests/constants";
import { formatEventDate, formatEventTime, formatEventVenue } from "@/lib/guests/format";

/**
 * Verifies and records guest entry from a QR invitation.
 *
 * Verification is deliberately stricter than the public /verify page: a guest
 * may only enter when the registration is APPROVED and the invitation is
 * currently ISSUED (not revoked, not expired) and has not been used yet.
 */

export type CheckInState =
  | "VALID"
  | "CHECKED_IN"
  | "ALREADY_CHECKED_IN"
  | "REVOKED"
  | "NOT_APPROVED"
  | "EXPIRED"
  | "NOT_FOUND"
  | "DELETED";

export interface CheckInGuestView {
  registrationId: string;
  fullName: string;
  organization: string;
  position: string;
  guestId: string | null;
  registrationRef: string;
  registrationStatus: GuestRegistrationStatus;
  invitationStatus: GuestInvitationStatus | null;
  invitationNumber: string | null;
  issuedAt: string | null;
  category: string;
  attendance: string;
  companions: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkInId: string | null;
}

export interface CheckInEventView {
  name: string;
  dateLabel: string | null;
  timeLabel: string;
  venueLabel: string | null;
  timezone: string;
}

export interface CheckInScanResult {
  state: CheckInState;
  message: string;
  canCheckIn: boolean;
  guest: CheckInGuestView | null;
  event: CheckInEventView | null;
}

type Evaluation = { state: CheckInState; message: string };

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "This registration is still pending and has not been approved.",
  REJECTED: "This registration was rejected, so the invitation is not valid.",
  WAITLISTED: "This guest is on the waiting list and has not been approved.",
};

function evaluate(registration: ScannedRegistration, now = new Date()): Evaluation {
  if (registration.deletedAt) {
    return {
      state: "DELETED",
      message: "This registration was deleted and can no longer be used for entry.",
    };
  }

  const invitation = registration.invitations[0] ?? null;
  const checkIn = registration.checkIns[0] ?? null;

  if (invitation?.status === "REVOKED") {
    return {
      state: "REVOKED",
      message: "This invitation was revoked by the organizer and is not valid for entry.",
    };
  }

  if (checkIn) {
    return {
      state: "ALREADY_CHECKED_IN",
      message: "This guest has already been checked in. Do not admit them twice.",
    };
  }

  if (invitation?.expiresAt && invitation.expiresAt.getTime() <= now.getTime()) {
    return {
      state: "EXPIRED",
      message: "This invitation has expired and is not valid for entry.",
    };
  }

  if (registration.status !== "APPROVED") {
    return {
      state: "NOT_APPROVED",
      message:
        STATUS_MESSAGES[registration.status] ??
        "This registration has not been approved, so the invitation is not valid.",
    };
  }

  if (!invitation) {
    return {
      state: "NOT_APPROVED",
      message: "No invitation has been issued for this registration yet.",
    };
  }

  if (invitation.status !== "ISSUED") {
    return {
      state: "NOT_APPROVED",
      message: "The invitation exists but is not currently active.",
    };
  }

  if (!registration.guestId) {
    return {
      state: "NOT_APPROVED",
      message: "This guest does not have an allocated guest ID yet.",
    };
  }

  return {
    state: "VALID",
    message: "Invitation is valid. Confirm the guest's identity before checking them in.",
  };
}

function toResult(
  registration: ScannedRegistration,
  evaluation: Evaluation,
  checkInOverride?: { id: string; checkedInAt: Date } | null
): CheckInScanResult {
  const invitation = registration.invitations[0] ?? null;
  const checkIn = registration.checkIns[0] ?? null;
  const checkedInAt =
    checkInOverride?.checkedInAt ?? (checkIn ? checkIn.checkedInAt : null);

  return {
    state: evaluation.state,
    message: evaluation.message,
    canCheckIn: evaluation.state === "VALID",
    guest: {
      registrationId: registration.id,
      fullName: registration.fullName,
      organization: registration.organization,
      position: registration.position,
      guestId: registration.guestId,
      registrationRef: registration.registrationRef,
      registrationStatus: registration.status,
      invitationStatus: invitation?.status ?? null,
      invitationNumber: invitation?.invitationNumber ?? null,
      issuedAt: invitation?.issuedAt ? invitation.issuedAt.toISOString() : null,
      category:
        STAKEHOLDER_CATEGORY_LABELS[registration.stakeholderCategory] ??
        registration.stakeholderCategory,
      attendance:
        ATTENDANCE_LABELS[registration.attendanceIntent] ?? registration.attendanceIntent,
      companions:
        COMPANION_LABELS[registration.companionCount] ?? registration.companionCount,
      checkedIn: Boolean(checkIn) || Boolean(checkInOverride),
      checkedInAt: checkedInAt ? checkedInAt.toISOString() : null,
      checkInId: checkInOverride?.id ?? checkIn?.id ?? null,
    },
    event: {
      name: registration.eventConfig.eventName,
      dateLabel: formatEventDate(registration.eventConfig, { withWeekday: true }),
      timeLabel: formatEventTime(registration.eventConfig),
      venueLabel: formatEventVenue(registration.eventConfig),
      timezone: registration.eventConfig.timezone,
    },
  };
}

function notFound(): CheckInScanResult {
  return {
    state: "NOT_FOUND",
    message:
      "No JANIC invitation matches this code. Check the QR image or try the guest ID / registration reference.",
    canCheckIn: false,
    guest: null,
    event: null,
  };
}

export class GuestCheckInService {
  /** Read-only verification used before the operator confirms entry. */
  static async scan(raw: string): Promise<CheckInScanResult> {
    const registration = await GuestCheckInRepository.findByScan(raw);
    if (!registration) return notFound();
    return toResult(registration, evaluate(registration));
  }

  /** Records the check-in after a successful verification. */
  static async checkIn(args: {
    raw: string;
    actor: CheckInActor;
    notes?: string | null;
    ipAddress?: string | null;
  }): Promise<CheckInScanResult> {
    const registration = await GuestCheckInRepository.findByScan(args.raw);
    if (!registration) return notFound();

    const evaluation = evaluate(registration);
    if (evaluation.state !== "VALID") {
      return toResult(registration, evaluation);
    }

    const created = await GuestCheckInRepository.createCheckIn({
      registrationId: registration.id,
      actor: args.actor,
      method: "QR",
      notes: args.notes ?? null,
      ipAddress: args.ipAddress ?? null,
    });

    switch (created.status) {
      case "OK":
        return toResult(
          registration,
          {
            state: "CHECKED_IN",
            message: `${registration.fullName} is checked in.`,
          },
          created.checkIn
        );
      case "ALREADY_CHECKED_IN":
        return toResult(
          registration,
          {
            state: "ALREADY_CHECKED_IN",
            message: "This guest was checked in by another scan a moment ago.",
          },
          created.checkIn
        );
      case "NOT_FOUND":
        return notFound();
      case "DELETED":
        return toResult(registration, {
          state: "DELETED",
          message: "This registration was deleted and can no longer be used for entry.",
        });
    }
  }

  /** Reverses a mistaken check-in so the guest can be scanned again. */
  static async undo(args: {
    checkInId: string;
    actor: CheckInActor;
  }): Promise<
    | { ok: true; guestName: string; message: string }
    | { ok: false; code: "NOT_FOUND"; message: string; status: number }
  > {
    const result = await GuestCheckInRepository.undo(args.checkInId, args.actor);
    if (result.status === "NOT_FOUND") {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "This check-in no longer exists.",
        status: 404,
      };
    }

    return {
      ok: true,
      guestName: result.checkIn.registration.fullName,
      message: `Check-in for ${result.checkIn.registration.fullName} was undone.`,
    };
  }

  static recent(take = 25) {
    return GuestCheckInRepository.listRecent(take);
  }

  static stats() {
    return GuestCheckInRepository.stats();
  }
}
