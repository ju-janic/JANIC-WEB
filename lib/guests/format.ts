import type { GuestEventConfig } from "@prisma/client";

/**
 * Shared event label formatting so the admin, guest and verification views
 * always present dates, times and venues identically.
 */

type EventDateFields = Pick<GuestEventConfig, "eventDate" | "timezone">;
type EventTimeFields = Pick<GuestEventConfig, "startTime" | "endTime">;
type EventVenueFields = Pick<GuestEventConfig, "venue" | "location">;

export function formatEventDate(
  config: EventDateFields,
  options?: { withWeekday?: boolean }
): string | null {
  if (!config.eventDate) return null;
  return new Intl.DateTimeFormat("en-GB", {
    ...(options?.withWeekday ? { weekday: "long" as const } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: config.timezone || "Africa/Mogadishu",
  }).format(config.eventDate);
}

export function formatEventTime(config: EventTimeFields): string {
  return `${config.startTime} – ${config.endTime}`;
}

export function formatEventVenue(config: EventVenueFields): string | null {
  const parts = [config.venue, config.location].filter(
    (value): value is string => Boolean(value && value.trim())
  );
  return parts.length ? parts.join(", ") : null;
}
