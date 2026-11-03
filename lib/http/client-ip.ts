import type { NextRequest } from "next/server";

/** Best-effort client IP extraction for auditing guest moderation actions. */
export function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (
    req.headers.get("x-real-ip")?.trim().slice(0, 64) ||
    req.headers.get("cf-connecting-ip")?.trim().slice(0, 64) ||
    null
  );
}
