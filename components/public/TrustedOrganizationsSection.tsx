"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRight,
  Cpu,
  GraduationCap,
  HandHeart,
  Landmark,
  Microscope,
  Rocket,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import styles from "./TrustedOrganizationsSection.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: "SMEs & Startups", icon: Rocket },
  { label: "Women-Owned Businesses", icon: UserRoundCheck },
  { label: "Universities & Education", icon: GraduationCap },
  { label: "NGOs & Development Organizations", icon: HandHeart },
  { label: "Government Institutions", icon: Landmark },
  { label: "Technology Companies", icon: Cpu },
  { label: "Researchers & Professionals", icon: Microscope },
];

export function TrustedOrganizationsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Header: title lines rise out of their masks, description fades in beside it.
      gsap.timeline({ scrollTrigger: { trigger: "[data-org-header]", start: "top 82%", once: true } })
        .from("[data-org-eyebrow]", { autoAlpha: 0, y: 10, duration: 0.5, ease: "power2.out" })
        .from("[data-org-line]", { yPercent: 105, duration: 0.9, ease: "power4.out", stagger: 0.1 }, "-=0.25")
        .from("[data-org-intro]", { autoAlpha: 0, y: 12, duration: 0.7, ease: "power2.out" }, "-=0.6");

      // Panel unfolds top-down, then each cell's content settles in reading order.
      gsap.timeline({ scrollTrigger: { trigger: "[data-org-panel]", start: "top 85%", once: true } })
        .fromTo("[data-org-panel]",
          { clipPath: "inset(0% 0% 100% 0% round 20px)" },
          { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1, ease: "power3.inOut", clearProps: "clipPath" })
        .from("[data-org-cell] > *", {
          autoAlpha: 0,
          y: 16,
          duration: 0.6,
          ease: "power3.out",
          stagger: { each: 0.025 },
        }, 0.35);
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="trusted-orgs-heading">
      <div className={styles.container}>
        <header data-org-header className={styles.header}>
          <div>
            <p data-org-eyebrow className={styles.eyebrow}>Our Partners</p>
            <h2 id="trusted-orgs-heading" className={styles.title}>
              <span className={styles.lineMask}><span data-org-line className={styles.line}>Trusted by the organizations</span></span>
              <span className={styles.lineMask}><span data-org-line className={styles.line}>we <em>work with</em></span></span>
            </h2>
          </div>
          <p data-org-intro className={styles.intro}>
            We partner with a wide range of organizations across sectors, helping them grow,
            innovate, and reach their goals.
          </p>
        </header>

        <div data-org-panel className={styles.panel}>
          {CATEGORIES.map(({ label, icon: Icon }, index) => (
            <div key={label} data-org-cell className={styles.cell}>
              <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
              <Icon className={styles.icon} size={22} strokeWidth={1.7} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
            </div>
          ))}
          <Link href="/partnerships" data-org-cell className={`${styles.cell} ${styles.cta}`}>
            <span className={styles.index}>Join us</span>
            <ArrowUpRight className={styles.icon} size={22} strokeWidth={1.8} aria-hidden="true" />
            <span className={styles.label}>Become a partner</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
