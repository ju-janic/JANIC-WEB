import { Prisma } from "@prisma/client";
import type { Event, GuestEventConfig } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { SettingService } from "@/services/settings/setting.service";
import {
  GUEST_DEFAULT_END_TIME,
  GUEST_DEFAULT_START_TIME,
  GUEST_EVENT_TIMEZONE,
  type PublicGuestEvent,
} from "@/lib/guests/constants";

export type RegistrationClosedReason =
  | "INACTIVE"
  | "NOT_OPEN_YET"
  | "CLOSED"
  | "EVENT_STARTED"
  | null;

export interface GuestRegistrationContext {
  event: Event;
  config: GuestEventConfig;
  isOpen: boolean;
  closedReason: RegistrationClosedReason;
  closedMessage: string | null;
}

const CLOSED_MESSAGES: Record<Exclude<RegistrationClosedReason, null>, string> = {
  INACTIVE:
    "Guest registration for this event is not currently available. Please contact the JANIC team for assistance.",
  NOT_OPEN_YET: "Guest registration has not opened yet. Please check back shortly.",
  CLOSED: "Guest registration for this event has closed.",
  EVENT_STARTED: "Guest registration closed when the event began.",
};

function eventYear(event: Pick<Event, "eventDate">): number {
  return new Date(event.eventDate).getUTCFullYear();
}

function splitVenue(location: string | null | undefined): {
  venue: string | null;
  address: string | null;
} {
  const value = location?.trim();
  if (!value) return { venue: null, address: null };
  const [first, ...rest] = value.split(",");
  return {
    venue: first.trim() || null,
    address: rest.length > 0 ? rest.join(",").trim() || value : value,
  };
}

/**
 * Resolves the operational event configuration.
 *
 * The schema deliberately keeps event information out of application code.
 * When an event has no config row yet, one is bootstrapped once from the
 * existing Event record and the site contact settings; admins can then edit
 * every value from the dashboard (Phase 2).
 */
export class GuestEventConfigService {
  static async findByEventId(eventId: string): Promise<GuestEventConfig | null> {
    return prisma.guestEventConfig.findUnique({ where: { eventId } });
  }

  static async getPublishedEventBySlug(slug: string): Promise<Event | null> {
    return prisma.event.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
  }

  static async getOrCreateForEvent(event: Event): Promise<GuestEventConfig> {
    const existing = await this.findByEventId(event.id);
    if (existing) return existing;

    const [emailSetting, phoneSetting] = await Promise.all([
      SettingService.getByKey("contact_email"),
      SettingService.getByKey("contact_phone"),
    ]);

    const { venue, address } = splitVenue(event.location);
    const year = eventYear(event);

    try {
      return await prisma.guestEventConfig.create({
        data: {
          eventId: event.id,
          slug: event.slug,
          eventName: event.title,
          eventDate: event.eventDate,
          startTime: GUEST_DEFAULT_START_TIME,
          endTime: GUEST_DEFAULT_END_TIME,
          timezone: GUEST_EVENT_TIMEZONE,
          venue,
          location: address || event.location,
          contactEmail: emailSetting?.value?.trim() || null,
          contactPhone: phoneSetting?.value?.trim() || null,
          capacity: event.capacity,
          registrationPrefix: `JANIC-REG-${year}`,
          guestIdPrefix: `JANIC-${year}`,
          // Safe operational defaults until an administrator configures them.
          approvalMode: "MANUAL",
          automationEnabled: false,
          checkInAccess: "ADMIN_ONLY",
          waitingListEnabled: true,
          isActive: true,
        },
      });
    } catch (error) {
      // A simultaneous first visit can race the unique eventId. Reuse the winner.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await this.findByEventId(event.id);
        if (raced) return raced;
      }
      throw error;
    }
  }

  static async getRegistrationContext(slug: string): Promise<GuestRegistrationContext | null> {
    const event = await this.getPublishedEventBySlug(slug);
    if (!event) return null;

    const config = await this.getOrCreateForEvent(event);
    const closedReason = this.getClosedReason(config);
    return {
      event,
      config,
      isOpen: closedReason === null,
      closedReason,
      closedMessage: closedReason ? CLOSED_MESSAGES[closedReason] : null,
    };
  }

  /**
   * Closes the guest registration link for an event config. Used when the
   * event reaches capacity or when the events team decides to stop accepting
   * new registrations.
   */
  static async closeRegistration(args: {
    eventConfigId: string;
    actor: { id: string; label: string };
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<GuestEventConfig | null> {
    const config = await GuestRegistrationRepository.updateRegistrationState({
      eventConfigId: args.eventConfigId,
      isActive: false,
      actorId: args.actor.id,
      actorLabel: args.actor.label,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
    });
    if (config) {
      await GuestRegistrationRepository.logActivity({
        registrationId: null,
        actorId: args.actor.id,
        actorLabel: args.actor.label,
        action: "REGISTRATION_CLOSED",
        details: { eventConfigId: args.eventConfigId, eventName: config.eventName, capacity: config.capacity },
        ipAddress: args.ipAddress ?? null,
      });
    }
    return config;
  }

  /**
   * Re-opens a previously closed guest registration link.
   */
  static async reopenRegistration(args: {
    eventConfigId: string;
    actor: { id: string; label: string };
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<GuestEventConfig | null> {
    const config = await GuestRegistrationRepository.updateRegistrationState({
      eventConfigId: args.eventConfigId,
      isActive: true,
      registrationClosesAt: null,
      actorId: args.actor.id,
      actorLabel: args.actor.label,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
    });
    if (config) {
      await GuestRegistrationRepository.logActivity({
        registrationId: null,
        actorId: args.actor.id,
        actorLabel: args.actor.label,
        action: "REGISTRATION_REOPENED",
        details: { eventConfigId: args.eventConfigId, eventName: config.eventName, capacity: config.capacity },
        ipAddress: args.ipAddress ?? null,
      });
    }
    return config;
  }

  static getClosedReason(
    config: Pick<
      GuestEventConfig,
      "isActive" | "registrationOpensAt" | "registrationClosesAt" | "eventDate"
    >,
    now: Date = new Date()
  ): RegistrationClosedReason {
    if (!config.isActive) return "INACTIVE";
    if (config.registrationOpensAt && now < config.registrationOpensAt) return "NOT_OPEN_YET";
    if (config.registrationClosesAt && now > config.registrationClosesAt) return "CLOSED";
    if (config.eventDate) {
      // Registration stays open through the event day, then closes.
      const closesAt = new Date(config.eventDate);
      closesAt.setUTCHours(closesAt.getUTCHours() + 24);
      if (now > closesAt) return "EVENT_STARTED";
    }
    return null;
  }

  static toPublicEvent(config: GuestEventConfig): PublicGuestEvent {
    return {
      slug: config.slug,
      eventName: config.eventName,
      eventDate: config.eventDate ? config.eventDate.toISOString() : null,
      startTime: config.startTime,
      endTime: config.endTime,
      timezone: config.timezone,
      venue: config.venue,
      location: config.location,
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
      capacity: config.capacity,
      registrationClosesAt: config.registrationClosesAt
        ? config.registrationClosesAt.toISOString()
        : null,
    };
  }
}
