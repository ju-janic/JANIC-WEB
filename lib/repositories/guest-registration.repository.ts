import { Prisma } from "@prisma/client";
import type { GuestApprovalMode, GuestRegistration, GuestRegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GUEST_REGISTRATION_COUNTER_KEY } from "@/lib/guests/constants";
import { normalizeEmail, normalizePhone, type GuestRegistrationInput } from "@/lib/guests/validation";

const MAX_ATTEMPTS = 5;

export class DuplicateGuestRegistrationError extends Error {
  constructor(public readonly field: "email" | "phone" | "unknown") {
    super("A registration with these details already exists");
    this.name = "DuplicateGuestRegistrationError";
  }
}

export interface CreateGuestRegistrationArgs {
  eventConfigId: string;
  registrationPrefix: string;
  userId: string | null;
  data: GuestRegistrationInput;
  approvalModeAtSubmit: GuestApprovalMode;
  configVersionAtSubmit: number;
  appliedRulesVersion: number;
  ipAddress: string | null;
  userAgent: string | null;
}

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function duplicateFieldFromMeta(meta: unknown): "email" | "phone" | "unknown" {
  const target = String((meta as { target?: unknown } | undefined)?.target ?? "");
  if (target.toLowerCase().includes("email")) return "email";
  if (target.toLowerCase().includes("phone")) return "phone";
  return "unknown";
}

export class GuestRegistrationRepository {
  /**
   * Allocates the next human-readable registration reference.
   * Must be called inside the same transaction that inserts the registration.
   */
  private static async nextSequence(
    tx: Prisma.TransactionClient,
    eventConfigId: string,
    registrationPrefix: string
  ): Promise<number> {
    const counter = await tx.guestCounter.findUnique({
      where: {
        eventConfigId_key: {
          eventConfigId,
          key: GUEST_REGISTRATION_COUNTER_KEY,
        },
      },
    });

    if (counter) {
      const updated = await tx.guestCounter.update({
        where: { id: counter.id },
        data: { value: { increment: 1 } },
      });
      return updated.value;
    }

    // First registration for this event: continue after any pre-existing
    // references instead of restarting at 1.
    const latest = await tx.guestRegistration.findFirst({
      where: {
        eventConfigId,
        registrationRef: { startsWith: `${registrationPrefix}-` },
      },
      orderBy: { registrationRef: "desc" },
      select: { registrationRef: true },
    });

    const lastValue = latest
      ? Number.parseInt(latest.registrationRef.slice(registrationPrefix.length + 1), 10)
      : 0;

    const created = await tx.guestCounter.create({
      data: {
        eventConfigId,
        key: GUEST_REGISTRATION_COUNTER_KEY,
        value: Number.isFinite(lastValue) ? lastValue + 1 : 1,
      },
    });
    return created.value;
  }

  static async create(args: CreateGuestRegistrationArgs): Promise<GuestRegistration> {
    const { data } = args;
    const emailNormalized = normalizeEmail(data.email);
    const phoneNormalized = normalizePhone(data.phone);
    const accessibilityDetails = data.hasAccessibilityNeeds
      ? data.accessibilityDetails?.trim() || null
      : null;
    const additionalComments = data.additionalComments?.trim() || null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const clash = await tx.guestRegistration.findFirst({
            where: {
              eventConfigId: args.eventConfigId,
              OR: [{ emailNormalized }, { phoneNormalized }],
            },
            select: { emailNormalized: true, phoneNormalized: true },
          });

          if (clash) {
            throw new DuplicateGuestRegistrationError(
              clash.emailNormalized === emailNormalized ? "email" : "phone"
            );
          }

          const sequence = await this.nextSequence(
            tx,
            args.eventConfigId,
            args.registrationPrefix
          );
          const registrationRef = `${args.registrationPrefix}-${String(sequence).padStart(4, "0")}`;

          const registration = await tx.guestRegistration.create({
            data: {
              registrationRef,
              eventConfigId: args.eventConfigId,
              userId: args.userId,
              status: "PENDING",
              fullName: data.fullName.trim(),
              organization: data.organization.trim(),
              position: data.position.trim(),
              email: data.email.trim(),
              emailNormalized,
              phone: data.phone.trim(),
              phoneNormalized,
              stakeholderCategory: data.stakeholderCategory,
              attendanceIntent: data.attendanceIntent,
              companionCount: data.companionCount,
              areasOfInterest: data.areasOfInterest,
              hasAccessibilityNeeds: data.hasAccessibilityNeeds,
              accessibilityDetails,
              mediaConsent: data.mediaConsent,
              referralSource: data.referralSource,
              additionalComments,
              accuracyConfirmed: data.accuracyConfirmed,
              privacyConsent: data.privacyConsent,
              approvalModeAtSubmit: args.approvalModeAtSubmit,
              configVersionAtSubmit: args.configVersionAtSubmit,
              appliedRulesVersion: args.appliedRulesVersion,
              eligibilityVerdict: "NOT_EVALUATED",
              source: "web",
              ipAddress: args.ipAddress,
              userAgent: args.userAgent,
            },
          });

          await tx.guestActivityLog.create({
            data: {
              registrationId: registration.id,
              actorLabel: registration.fullName,
              action: "REGISTRATION_SUBMITTED",
              details: {
                registrationRef,
                status: "PENDING",
                approvalMode: args.approvalModeAtSubmit,
                configVersion: args.configVersionAtSubmit,
              },
              ipAddress: args.ipAddress,
            },
          });

          return registration;
        });
      } catch (error) {
        if (error instanceof DuplicateGuestRegistrationError) throw error;

        if (isKnownPrismaError(error)) {
          // Unique constraint: another request claimed the email, phone,
          // reference or counter row first.
          if (error.code === "P2002") {
            if (attempt === MAX_ATTEMPTS) {
              throw new DuplicateGuestRegistrationError(duplicateFieldFromMeta(error.meta));
            }
            continue;
          }

          // Deadlock / write conflict under concurrent submissions.
          if (error.code === "P2034" && attempt < MAX_ATTEMPTS) continue;
        }

        throw error;
      }
    }

    throw new DuplicateGuestRegistrationError("unknown");
  }

  static async countRecentByIp(ipAddress: string, since: Date): Promise<number> {
    return prisma.guestRegistration.count({
      where: { ipAddress, submittedAt: { gte: since } },
    });
  }

  static async findByReference(registrationRef: string) {
    return prisma.guestRegistration.findUnique({
      where: { registrationRef },
      include: { eventConfig: true },
    });
  }

  static async findById(id: string) {
    return prisma.guestRegistration.findUnique({
      where: { id },
      include: { eventConfig: true },
    });
  }

  /** Feeds the future "My Event Registration" profile section. */
  static async listForUser(userId: string) {
    return prisma.guestRegistration.findMany({
      where: { userId, deletedAt: null },
      orderBy: { submittedAt: "desc" },
      include: {
        eventConfig: {
          select: {
            eventName: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
          },
        },
      },
    });
  }

  /** Read-only admin listing. Phase 2 will add moderation actions on top. */
  static async listForAdmin(options?: {
    search?: string;
    status?: GuestRegistrationStatus;
    take?: number;
  }) {
    const where: Prisma.GuestRegistrationWhereInput = { deletedAt: null };

    if (options?.status) where.status = options.status;

    const search = options?.search?.trim();
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { organization: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { registrationRef: { contains: search } },
      ];
    }

    return prisma.guestRegistration.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: options?.take ?? 200,
      include: {
        eventConfig: {
          select: {
            eventName: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
          },
        },
      },
    });
  }

  static async findByIdForAdmin(id: string) {
    return prisma.guestRegistration.findUnique({
      where: { id },
      include: {
        eventConfig: {
          select: {
            eventName: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            timezone: true,
            contactEmail: true,
            contactPhone: true,
            approvalMode: true,
            automationEnabled: true,
            rulesVersion: true,
            version: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        emailLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        invitations: true,
        checkIns: true,
      },
    });
  }

  static async statsForAdmin() {
    const base = { deletedAt: null } as const;
    const [total, pending, approved, rejected, waitlisted] = await Promise.all([
      prisma.guestRegistration.count({ where: base }),
      prisma.guestRegistration.count({ where: { ...base, status: "PENDING" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "APPROVED" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "REJECTED" } }),
      prisma.guestRegistration.count({ where: { ...base, status: "WAITLISTED" } }),
    ]);
    return { total, pending, approved, rejected, waitlisted };
  }

  static async countForEvent(eventConfigId: string) {
    return prisma.guestRegistration.count({
      where: { eventConfigId, deletedAt: null },
    });
  }
}
