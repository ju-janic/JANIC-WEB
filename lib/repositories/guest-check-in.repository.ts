import { Prisma } from "@prisma/client";
import type { GuestCheckIn } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GUEST_EVENT_TIMEZONE } from "@/lib/guests/constants";

/**
 * Data access for QR guest check-in.
 *
 * The QR payload is never trusted as data: it is only used to resolve an
 * invitation (or a registration reference / guest ID typed by staff) back to
 * the registration record, which is then validated against the live approval,
 * invitation and check-in state.
 */

export type ScanKind = "qrToken" | "registrationRef" | "guestId";

export interface ParsedScan {
  kind: ScanKind;
  value: string;
}

export interface CheckInActor {
  id: string | null;
  label: string | null;
}

const REGISTRATION_INCLUDE = {
  eventConfig: true,
  invitations: { orderBy: { createdAt: "desc" } },
  checkIns: { orderBy: { checkedInAt: "desc" } },
} satisfies Prisma.GuestRegistrationInclude;

export type ScannedRegistration = Prisma.GuestRegistrationGetPayload<{
  include: typeof REGISTRATION_INCLUDE;
}>;

export type CreateCheckInResult =
  | { status: "OK"; checkIn: GuestCheckIn }
  | { status: "ALREADY_CHECKED_IN"; checkIn: GuestCheckIn | null }
  | { status: "NOT_FOUND" }
  | { status: "DELETED" };

/**
 * Recognises the four payloads staff can provide:
 * - the full /verify/<token> URL stored in the QR code
 * - the opaque QR token itself
 * - a human-readable registration reference (JANIC-REG-…)
 * - an allocated guest ID (JANIC-2026-…)
 */
export function parseGuestScanInput(raw: string): ParsedScan | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const verifyMatch = trimmed.match(/\/verify\/([A-Za-z0-9_-]{8,128})/);
  if (verifyMatch) {
    return { kind: "qrToken", value: verifyMatch[1] };
  }

  if (/^JANIC-REG-/i.test(trimmed)) {
    return { kind: "registrationRef", value: trimmed.toUpperCase() };
  }

  if (/^JANIC-\d{4}-\d{3,}$/i.test(trimmed)) {
    return { kind: "guestId", value: trimmed.toUpperCase() };
  }

  // Base64url tokens are long and contain no spaces. Anything else is still
  // attempted as a token so a newly generated format keeps working.
  if (!/\s/.test(trimmed)) {
    return { kind: "qrToken", value: trimmed };
  }

  return null;
}

function startOfDayInTimeZone(now: Date, timeZone: string): Date {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? "00";

  const offsetLabel =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const offset = offsetLabel.replace("GMT", "") || "+00:00";

  return new Date(`${pick("year")}-${pick("month")}-${pick("day")}T00:00:00${offset}`);
}

export class GuestCheckInRepository {
  /** Resolves whatever staff scanned/typed into a full registration record. */
  static async findByScan(raw: string): Promise<ScannedRegistration | null> {
    const parsed = parseGuestScanInput(raw);
    if (!parsed) return null;

    if (parsed.kind === "qrToken") {
      const invitation = await prisma.guestInvitation.findUnique({
        where: { qrToken: parsed.value },
        include: {
          registration: { include: REGISTRATION_INCLUDE },
        },
      });
      return invitation?.registration ?? null;
    }

    return prisma.guestRegistration.findFirst({
      where:
        parsed.kind === "registrationRef"
          ? { registrationRef: parsed.value }
          : { guestId: parsed.value },
      include: REGISTRATION_INCLUDE,
    });
  }

  static async createCheckIn(args: {
    registrationId: string;
    actor: CheckInActor;
    method?: string;
    notes?: string | null;
    ipAddress?: string | null;
  }): Promise<CreateCheckInResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const registration = await tx.guestRegistration.findUnique({
          where: { id: args.registrationId },
          select: {
            id: true,
            deletedAt: true,
            fullName: true,
            status: true,
            guestId: true,
            registrationRef: true,
          },
        });

        if (!registration) return { status: "NOT_FOUND" as const };
        if (registration.deletedAt) return { status: "DELETED" as const };

        const existing = await tx.guestCheckIn.findUnique({
          where: { registrationId: args.registrationId },
        });
        if (existing) {
          return { status: "ALREADY_CHECKED_IN" as const, checkIn: existing };
        }

        const method = args.method?.trim().slice(0, 16) || "QR";
        const checkIn = await tx.guestCheckIn.create({
          data: {
            registrationId: args.registrationId,
            checkedInById: args.actor.id,
            method,
            notes: args.notes?.trim() || null,
          },
        });

        await tx.guestActivityLog.create({
          data: {
            registrationId: args.registrationId,
            actorId: args.actor.id,
            actorLabel: args.actor.label,
            action: "CHECKED_IN",
            details: {
              method,
              guestId: registration.guestId,
              registrationRef: registration.registrationRef,
              checkedInAt: checkIn.checkedInAt.toISOString(),
            },
            ipAddress: args.ipAddress ?? null,
          },
        });

        return { status: "OK" as const, checkIn };
      });
    } catch (error) {
      // The unique index on registrationId is the final guard against two
      // scanners checking the same guest at the same moment.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.guestCheckIn.findUnique({
          where: { registrationId: args.registrationId },
        });
        return { status: "ALREADY_CHECKED_IN" as const, checkIn: existing };
      }
      throw error;
    }
  }

  static async undo(checkInId: string, actor: CheckInActor) {
    return prisma.$transaction(async (tx) => {
      const checkIn = await tx.guestCheckIn.findUnique({
        where: { id: checkInId },
        include: {
          registration: {
            select: {
              id: true,
              fullName: true,
              guestId: true,
              registrationRef: true,
            },
          },
        },
      });

      if (!checkIn) return { status: "NOT_FOUND" as const };

      await tx.guestCheckIn.delete({ where: { id: checkInId } });

      await tx.guestActivityLog.create({
        data: {
          registrationId: checkIn.registrationId,
          actorId: actor.id,
          actorLabel: actor.label,
          action: "CHECK_IN_UNDONE",
          details: {
            checkInId,
            guestId: checkIn.registration.guestId,
            registrationRef: checkIn.registration.registrationRef,
            checkedInAt: checkIn.checkedInAt.toISOString(),
          },
        },
      });

      return { status: "OK" as const, checkIn };
    });
  }

  /** Most recent successful check-ins, newest first. */
  static async listRecent(take = 25) {
    const rows = await prisma.guestCheckIn.findMany({
      take,
      orderBy: { checkedInAt: "desc" },
      include: {
        registration: {
          select: {
            id: true,
            fullName: true,
            guestId: true,
            registrationRef: true,
            organization: true,
            status: true,
          },
        },
      },
    });

    const actorIds = Array.from(
      new Set(rows.map((row) => row.checkedInById).filter((id): id is string => Boolean(id)))
    );
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, username: true },
        })
      : [];
    const actorById = new Map(actors.map((actor) => [actor.id, actor]));

    return rows.map((row) => {
      const actor = row.checkedInById ? actorById.get(row.checkedInById) ?? null : null;
      return {
        id: row.id,
        registrationId: row.registrationId,
        checkedInAt: row.checkedInAt.toISOString(),
        method: row.method,
        notes: row.notes,
        checkedInBy: actor ? actor.name || actor.username || null : null,
        guest: row.registration,
      };
    });
  }

  static async stats(timeZone = GUEST_EVENT_TIMEZONE) {
    const startOfToday = startOfDayInTimeZone(new Date(), timeZone);

    const [checkedInTotal, checkedInToday, approved, pending] = await Promise.all([
      prisma.guestCheckIn.count(),
      prisma.guestCheckIn.count({ where: { checkedInAt: { gte: startOfToday } } }),
      prisma.guestRegistration.count({
        where: { status: "APPROVED", deletedAt: null },
      }),
      prisma.guestRegistration.count({
        where: { status: "PENDING", deletedAt: null },
      }),
    ]);

    return { checkedInTotal, checkedInToday, approved, pending };
  }
}
