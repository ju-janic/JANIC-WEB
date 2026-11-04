"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./SponsorMarquee.module.css";

export interface SponsorMarqueeItem {
  id: string;
  organizationName: string;
  logoUrl: string | null;
  sponsorshipLevel: string | null;
}

type Tier = "gold" | "silver" | "other";

function tierOf(level: string | null): Tier {
  const value = (level ?? "").toLowerCase();
  if (value.includes("gold")) return "gold";
  if (value.includes("silver")) return "silver";
  return "other";
}

/** Tier-specific badge styling based on the sponsor level text. */
function tierBadge(tier: Tier, level: string | null): string {
  if (tier === "gold") {
    return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-500/20 dark:to-yellow-500/20 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30";
  }
  if (tier === "silver") {
    return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-500/20 dark:to-slate-400/20 dark:text-slate-300 border border-slate-300/60 dark:border-slate-500/30";
  }
  if ((level ?? "").toLowerCase().includes("in-kind")) {
    return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30";
  }
  return "bg-gradient-to-r from-sky-100 to-blue-100 text-[#0875D1] dark:from-sky-500/20 dark:to-blue-500/20 dark:text-sky-300 border border-sky-300/60 dark:border-sky-500/30";
}

/** Card ring/glow per tier so Gold & Silver stand out while scrolling. */
function tierCard(tier: Tier): string {
  if (tier === "gold") {
    return "border-amber-300/70 dark:border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.18)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.3)]";
  }
  if (tier === "silver") {
    return "border-slate-300/80 dark:border-slate-500/40 shadow-[0_4px_20px_rgba(100,116,139,0.16)] hover:shadow-[0_16px_40px_rgba(100,116,139,0.28)]";
  }
  return "border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(8,36,92,0.06)] hover:shadow-[0_16px_40px_rgba(8,36,92,0.16)]";
}

function SponsorCard({ sponsor }: { sponsor: SponsorMarqueeItem }) {
  const tier = tierOf(sponsor.sponsorshipLevel);

  return (
    <article
      className={cn(
        "group relative w-60 shrink-0 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1.5 transition-all duration-300",
        tierCard(tier)
      )}
    >
      {/* Top accent line */}
      <span
        className={cn(
          "absolute inset-x-8 top-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          tier === "gold" && "bg-gradient-to-r from-transparent via-amber-400 to-transparent",
          tier === "silver" && "bg-gradient-to-r from-transparent via-slate-400 to-transparent",
          tier === "other" && "bg-gradient-to-r from-transparent via-[#0875D1]/60 to-transparent"
        )}
      />

      {/* Logo tile */}
      <div className="relative h-24 w-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center overflow-hidden ring-1 ring-black/[0.04] group-hover:ring-[#0875D1]/30 transition-all duration-300">
        {sponsor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.logoUrl}
            alt={sponsor.organizationName}
            className="h-full w-full object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Building2 className="w-9 h-9 text-slate-300 dark:text-slate-600 group-hover:text-[#0875D1]/70 transition-colors duration-300" />
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-extrabold text-[#08245C] dark:text-white leading-snug break-words line-clamp-2 min-h-[2.5rem]">
        {sponsor.organizationName}
      </h3>

      {/* Sponsor level badge */}
      {sponsor.sponsorshipLevel && (
        <span
          className={cn(
            "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
            tierBadge(tier, sponsor.sponsorshipLevel)
          )}
        >
          {sponsor.sponsorshipLevel}
        </span>
      )}
    </article>
  );
}

/**
 * Infinite auto-scrolling showcase of ALL sponsors (logo, name, sponsor level)
 * in a single row. Hovering pauses the scroll.
 */
export function SponsorMarquee({ sponsors }: { sponsors: SponsorMarqueeItem[] }) {
  if (sponsors.length === 0) return null;

  // Repeat the list enough times that one copy is wider than the viewport,
  // so the -50% translation loops without a visible gap.
  const repeat = Math.max(2, Math.ceil(10 / Math.max(sponsors.length, 1)));
  const track = Array.from({ length: repeat }, () => sponsors).flat();

  return (
    <div className={styles.marquee}>
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <div className={styles.group} key={copy} aria-hidden={copy === 1}>
            {track.map((sponsor, index) => (
              <SponsorCard key={`${copy}-${sponsor.id}-${index}`} sponsor={sponsor} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
