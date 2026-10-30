"use client";

import React, { useEffect, useRef, useState } from "react";

const CATEGORIES = [
  "SMEs & Startups",
  "Women-Owned Businesses",
  "Universities & Education",
  "NGOs & Development Organizations",
  "Government Institutions",
  "Technology Companies",
  "Researchers & Professionals",
] as const;

const ROW_ONE = CATEGORIES.slice(0, 4);
const ROW_TWO = CATEGORIES.slice(4);

function useInView(rootMargin = "0px 0px -60px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

interface CardProps {
  label: string;
  delay: number;
  inView: boolean;
  reduced: boolean;
}

function OrganizationCategoryCard({ label, delay, inView, reduced }: CardProps) {
  const visible = inView || reduced;

  return (
    <div
      className="group flex items-center justify-center text-center px-4 py-5 rounded-xl
        bg-white border border-[#E5E7EB] cursor-default
        hover:border-[#0EA5E9] hover:bg-[#F0F9FF] hover:shadow-sm
        hover:-translate-y-[3px]"
      style={
        reduced
          ? {}
          : {
            transitionProperty: "opacity, transform, border-color, background-color, box-shadow",
            transitionDuration: "600ms, 600ms, 250ms, 250ms, 250ms",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1), cubic-bezier(0.16,1,0.3,1), ease, ease, ease",
            transitionDelay: `${delay}ms, ${delay}ms, 0ms, 0ms, 0ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
          }
      }
    >
      <span className="text-sm font-semibold text-[#0B1F6B] group-hover:text-[#0EA5E9] transition-colors duration-200 leading-snug">
        {label}
      </span>
    </div>
  );
}

export function TrustedOrganizationsSection() {
  const { ref, inView } = useInView();
  const reduced = usePrefersReducedMotion();
  const visible = inView || reduced;

  const headingDelay = 0;
  const descDelay = reduced ? 0 : 120;
  const row1Base = 220;
  const row2Base = row1Base + ROW_ONE.length * 90;

  const fadeStyle = (delay: number): React.CSSProperties =>
    reduced
      ? {}
      : {
        transition: `opacity 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      };

  return (
    <section
      className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
      aria-labelledby="trusted-orgs-heading"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2
            id="trusted-orgs-heading"
            style={fadeStyle(headingDelay)}
            className="text-3xl sm:text-4xl lg:text-[2.625rem] font-black text-[#0B1F6B] dark:text-white tracking-tight leading-tight mb-4"
          >
            Trusted by the Organizations We Work With
          </h2>
          <p
            style={fadeStyle(descDelay)}
            className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 leading-relaxed"
          >
            We Partner With A Wide Range Of Organizations Across Sectors, Helping Them Grow,
            Innovate, And Reach Their Goals.
          </p>
        </div>

        {/* Row 1 — 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {ROW_ONE.map((label, i) => (
            <OrganizationCategoryCard
              key={label}
              label={label}
              delay={row1Base + i * 90}
              inView={inView}
              reduced={reduced}
            />
          ))}
        </div>

        {/* Row 2 — 3 cards, centered */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-[calc(75%+0.75rem)] mx-auto">
          {ROW_TWO.map((label, i) => (
            <OrganizationCategoryCard
              key={label}
              label={label}
              delay={row2Base + i * 90}
              inView={inView}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
