import type { GuestEventConfig } from "@prisma/client";
import { GuestEventConfigService } from "./guest-event-config.service";
import { GuestModerationService } from "./guest-moderation.service";
import {
  AlreadyRegisteredError,
  DuplicateGuestRegistrationError,
  GuestRegistrationRepository,
} from "@/lib/repositories/guest-registration.repository";
import { guestRegistrationSchema, toFieldErrors } from "@/lib/guests/validation";
import {
  createGuestConfirmationToken,
  verifyGuestConfirmationToken,
} from "@/lib/guests/confirmation-token";
import type { GuestRegistrationReceipt } from "@/lib/guests/constants";

/** Maximum registration attempts allowed from one IP inside the throttle window. */
const IP_WINDOW_MINUTES = 10;
const IP_MAX_SUBMISSIONS = 5;

export type GuestRegistrationErrorCode =
  | "INVALID_INPUT"
  | "DUPLICATE_EMAIL"
  | "DUPLICATE_PHONE"
  | "DUPLICATE_UNKNOWN"
  | "ALREADY_REGISTERED"
  | "AUTH_REQUIRED"
  | "REGISTRATION_CLOSED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "SERVER_ERROR";

export type GuestRegistrationResult =
  | {
      ok: true;
      registration: {
        id: string;
        reference: string;
        status: string;
        submittedAt: string;
        fullName: string;
        email: string;
      };
      receipt: GuestRegistrationReceipt;
      confirmationToken: string;
    }
  | {
      ok: false;
      code: GuestRegistrationErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
      status: number;
    };

export interface GuestRegistrationMeta {
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
}

function receiptFrom(
  config: GuestEventConfig,
  data: {
    registrationRef: string;
    status: string;
    submittedAt: Date;
    fullName: string;
    email: string;
  }
): GuestRegistrationReceipt {
  return {
    reference: data.registrationRef,
    status: data.status,
    submittedAt: data.submittedAt.toISOString(),
    fullName: data.fullName,
    email: data.email,
    eventName: config.eventName,
    eventDate: config.eventDate ? config.eventDate.toISOString() : null,
    startTime: config.startTime,
    endTime: config.endTime,
    timezone: config.timezone,
    venue: config.venue,
    location: config.location,
    contactEmail: config.contactEmail,
    contactPhone: config.contactPhone,
  };
}

export class GuestRegistrationService {
  /**
   * Validates and persists a public guest registration.
   *
   * All business rules that Phase 2 will make configurable (approval mode,
   * capacity, eligibility) are read from the config and snapshotted onto the
   * row. Phase 1 always creates PENDING registrations — nothing here approves
   * a guest automatically.
   */
  static async register(
    slug: string,
    payload: unknown,
    meta: GuestRegistrationMeta
  ): Promise<GuestRegistrationResult> {
    const context = await GuestEventConfigService.getRegistrationContext(slug);
    if (!context) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "This event could not be found.",
        status: 404,
      };
    }

    // Registration is only open to signed-in JANIC accounts.
    if (!meta.userId) {
      return {
        ok: false,
        code: "AUTH_REQUIRED",
        message:
          "Please sign in to your JANIC account before registering for this event.",
        status: 401,
      };
    }

    // Each account may register only once per event.
    const existing = await GuestRegistrationRepository.findByUserAndEventConfig(
      meta.userId,
      context.config.id
    );
    if (existing) {
      return {
        ok: false,
        code: "ALREADY_REGISTERED",
        message:
          "You have already registered for this event. Each account can register only once. Check your email or contact the JANIC events team if you need to update your details.",
        status: 409,
      };
    }

    const parsed = guestRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Please correct the highlighted fields and try again.",
        fieldErrors: toFieldErrors(parsed.error),
        status: 422,
      };
    }

    // Honeypot: silently reject bots without writing a record or revealing the trap.
    if (parsed.data.website) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "We could not process this submission. Please try again.",
        status: 400,
      };
    }

    if (!context.isOpen) {
      return {
        ok: false,
        code: "REGISTRATION_CLOSED",
        message:
          context.closedMessage ??
          "Guest registration for this event is not currently available.",
        status: 409,
      };
    }

    if (meta.ipAddress) {
      const since = new Date(Date.now() - IP_WINDOW_MINUTES * 60 * 1000);
      const recent = await GuestRegistrationRepository.countRecentByIp(meta.ipAddress, since);
      if (recent >= IP_MAX_SUBMISSIONS) {
        return {
          ok: false,
          code: "RATE_LIMITED",
          message: `Too many registration attempts. Please wait ${IP_WINDOW_MINUTES} minutes and try again, or contact the JANIC team.`,
          status: 429,
        };
      }
    }

    const { config } = context;

    try {
      const created = await GuestRegistrationRepository.create({
        eventConfigId: config.id,
        registrationPrefix: config.registrationPrefix ?? `JANIC-REG-${new Date().getUTCFullYear()}`,
        userId: meta.userId,
        data: parsed.data,
        approvalModeAtSubmit: config.approvalMode,
        configVersionAtSubmit: config.version,
        appliedRulesVersion: config.rulesVersion,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      // Outside the transaction: acknowledge the guest and, when the event is
      // in automatic mode, approve them right away. Failures here must never
      // break the registration itself.
      await GuestModerationService.afterRegistration(created.id).catch((error) => {
        console.error("[guest-registration] post-submit processing failed", error);
      });

      const confirmationToken = await createGuestConfirmationToken({
        registrationId: created.id,
        eventSlug: config.slug,
      });

      return {
        ok: true,
        registration: {
          id: created.id,
          reference: created.registrationRef,
          status: created.status,
          submittedAt: created.submittedAt.toISOString(),
          fullName: created.fullName,
          email: created.email,
        },
        receipt: receiptFrom(config, {
          registrationRef: created.registrationRef,
          status: created.status,
          submittedAt: created.submittedAt,
          fullName: created.fullName,
          email: created.email,
        }),
        confirmationToken,
      };
    } catch (error) {
      if (error instanceof AlreadyRegisteredError) {
        return {
          ok: false,
          code: "ALREADY_REGISTERED",
          message:
            "You have already registered for this event. Each account can register only once. Check your email or contact the JANIC events team if you need to update your details.",
          status: 409,
        };
      }

      if (error instanceof DuplicateGuestRegistrationError) {
        const emailClash = error.field === "email";
        const phoneClash = error.field === "phone";
        return {
          ok: false,
          code: emailClash ? "DUPLICATE_EMAIL" : phoneClash ? "DUPLICATE_PHONE" : "DUPLICATE_UNKNOWN",
          message: emailClash
            ? "A registration already exists for this email address. If you need to change your details, please contact the JANIC team."
            : phoneClash
              ? "A registration already exists for this phone number. If you need to change your details, please contact the JANIC team."
              : "A registration with these details already exists. Please contact the JANIC team if you need assistance.",
          fieldErrors: emailClash
            ? { email: "This email address is already registered." }
            : phoneClash
              ? { phone: "This phone number is already registered." }
              : undefined,
          status: 409,
        };
      }

      console.error("[guest-registration] create failed", error);
      return {
        ok: false,
        code: "SERVER_ERROR",
        message:
          "We could not save your registration right now. Please try again in a moment, or contact the JANIC team.",
        status: 500,
      };
    }
  }

  /**
   * Loads the safe public receipt for a signed confirmation token.
   * A missing/expired token or mismatched event slug returns null so the page
   * can present a neutral "link expired" state instead of leaking data.
   */
  static async getReceiptByToken(
    token: string | null | undefined,
    eventSlug: string
  ): Promise<{ receipt: GuestRegistrationReceipt; registrationId: string } | null> {
    const claims = await verifyGuestConfirmationToken(token);
    if (!claims || claims.eventSlug !== eventSlug) return null;

    const registration = await GuestRegistrationRepository.findById(claims.registrationId);
    if (!registration || registration.deletedAt) return null;
    if (registration.eventConfig.slug !== eventSlug) return null;

    return {
      registrationId: registration.id,
      receipt: receiptFrom(registration.eventConfig, {
        registrationRef: registration.registrationRef,
        status: registration.status,
        submittedAt: registration.submittedAt,
        fullName: registration.fullName,
        email: registration.email,
      }),
    };
  }

  /** Used by tests and the future profile section to explain the current state. */
  static describeStatus(status: string): string {
    if (status === "PENDING") {
      return "Your registration has been received and is awaiting review by the JANIC events team.";
    }
    if (status === "APPROVED") return "Your registration has been approved.";
    if (status === "REJECTED") return "Your registration was not approved.";
    if (status === "WAITLISTED") return "You have been placed on the waiting list.";
    return "Your registration has been received.";
  }
}
