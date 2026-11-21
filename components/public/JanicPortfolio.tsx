"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProjectMediaCover } from "./ProjectMediaCover";
import styles from "./JanicPortfolio.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ProjectCard {
  title: string;
  summary: string;
  category: string;
  heroImage: string;
  slug: string;
  videoUrl?: string | null;
}

interface JanicPortfolioProps {
  cards: ProjectCard[];
  spotlight?: unknown;
}

export function JanicPortfolio({ cards }: JanicPortfolioProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP((_, contextSafe) => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();

    mm.add(
      {
        cinema: "(min-width: 1024px) and (min-height: 700px)",
        reduce: "(prefers-reduced-motion: reduce)",
        hover: "(hover: hover) and (pointer: fine)",
      },
      context => {
        const { cinema, reduce, hover } = context.conditions as Record<string, boolean>;
        if (reduce) return;

        const cardEls = gsap.utils.toArray<HTMLElement>("[data-card]");
        const heading = section.querySelector<HTMLElement>("[data-heading]")!;
        const swoosh = section.querySelector<SVGPathElement>("[data-swoosh]");
        const swooshLength = swoosh?.getTotalLength() ?? 0;
        const IRIS_CLOSED = "inset(50% 50% 50% 50% round 15px)";
        const IRIS_OPEN = "inset(0% 0% 0% 0% round 15px)";

        // ── Ambient glows float slowly behind the content.
        gsap.utils.toArray<HTMLElement>("[data-orb]").forEach((orb, i) => {
          gsap.to(orb, { x: i ? -60 : 70, y: i ? -50 : 40, scale: 1.15, duration: 9 + i * 2, ease: "sine.inOut", repeat: -1, yoyo: true });
        });

        if (cinema) {
          // ── Cinematic intro: the section pins, the oversized title shrinks into place,
          //    and the cards unroll up from below one after another.
          const sectionTop = () => {
            const vh = window.innerHeight;
            return section.offsetHeight > vh ? vh - section.offsetHeight : (vh - section.offsetHeight) / 2;
          };
          // Distance that puts the heading's centre in the middle of the viewport.
          const headingToCentre = () =>
            window.innerHeight / 2 - (sectionTop() + heading.offsetTop + heading.offsetHeight / 2);

          const tl = gsap.timeline({
            defaults: { ease: "power3.inOut" },
            scrollTrigger: {
              trigger: section,
              start: () => (section.offsetHeight > window.innerHeight ? "bottom bottom" : "center center"),
              end: () => `+=${Math.max(window.innerHeight * (0.9 + cardEls.length * 0.6), 1600)}`,
              pin: true,
              pinSpacing: true, // parent is a flex column, where GSAP disables this by default
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          const grid = section.querySelector<HTMLElement>("[data-grid]")!;
          const ghosts = gsap.utils.toArray<HTMLElement>("[data-ghost]");
          const stage = section.querySelector<HTMLElement>("[data-stage]");
          const toCentreX = (card: HTMLElement) => grid.offsetWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
          const toCentreY = (card: HTMLElement) => grid.offsetHeight / 2 - (card.offsetTop + card.offsetHeight / 2);
          const TILT = [-7, 6, -5, 7, -6, 5];

          // Title starts huge and centred, then settles into its slot.
          tl
            .fromTo(heading, { y: headingToCentre, scale: 1.55 }, { y: 0, scale: 1, duration: 1 }, 0)
            .fromTo("[data-eyebrow]", { "--line-scale": 0, letterSpacing: "0.45em" }, { "--line-scale": 1, letterSpacing: "0em", duration: 0.8 }, 0)
            .fromTo(swoosh, { autoAlpha: 0, strokeDasharray: swooshLength, strokeDashoffset: swooshLength }, { autoAlpha: 1, strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 0.15)
            .from("[data-intro]", { autoAlpha: 0, y: 20, duration: 0.4, ease: "power2.out" }, 0.6);

          // Each project is presented centre stage on its own — number on the left, caption on the
          // right — then files into its grid slot before the next one arrives.
          const STEP = 1.2;
          cardEls.forEach((card, i) => {
            const t = 0.95 + i * STEP;
            const frame = card.querySelector("[data-media-frame]");
            const media = card.querySelector("[data-media]");
            const placed = cardEls.slice(0, i);
            const ghost = ghosts[i];

            tl.set(card, { zIndex: 10 }, t)
              // Rise into the spotlight, already showing its image and copy.
              .fromTo(card,
                { x: () => toCentreX(card), y: () => toCentreY(card) + 300, scale: 1.08, rotation: TILT[i % TILT.length], autoAlpha: 0 },
                { x: () => toCentreX(card), y: () => toCentreY(card) + 24, scale: 1.08, rotation: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" }, t)
              .fromTo(frame, { clipPath: IRIS_CLOSED }, { clipPath: IRIS_OPEN, duration: 0.4, ease: "power3.out" }, t + 0.08)
              .fromTo(media, { scale: 1.4, filter: "grayscale(1) brightness(0.8)" }, { scale: 1, filter: "grayscale(0) brightness(1)", duration: 0.55, ease: "power2.out" }, t + 0.08)
              .fromTo(card.querySelectorAll("[data-copy] > *"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.05 }, t + 0.2)
              .fromTo(card.querySelector("[data-category]"), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, t + 0.3)
              // Side captions slide in from both edges.
              .fromTo(ghost, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, t + 0.1)
              .fromTo(ghost.querySelector("[data-ghost-num]"), { x: -60 }, { x: 0, duration: 0.45, ease: "power3.out" }, t + 0.1)
              .fromTo(ghost.querySelector("[data-ghost-caption]"), { x: 60 }, { x: 0, duration: 0.45, ease: "power3.out" }, t + 0.1);
            if (placed.length) {
              tl.to(placed, { scale: 0.95, duration: 0.3, ease: "power1.out" }, t)
                .to(stage, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, t);
            }

            // File into the grid, with a light sweep as it lands.
            tl.to(card, { x: 0, y: 0, scale: 1, duration: 0.55, ease: "power3.inOut" }, t + 0.8)
              .to(ghost, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, t + 0.8)
              .set(card, { zIndex: 1 }, t + 1.35)
              .fromTo(card.querySelector("[data-shine]"), { xPercent: -120 }, { xPercent: 120, duration: 0.4, ease: "power2.inOut" }, t + 1.15);
            if (placed.length) {
              tl.to(placed, { scale: 1, duration: 0.35, ease: "power1.inOut" }, t + 0.85)
                .to(stage, { autoAlpha: 0, duration: 0.35, ease: "power1.inOut" }, t + 0.8);
            }
          });

          tl.from("[data-portfolio-button]", { autoAlpha: 0, y: 30, scale: 0.9, duration: 0.4, ease: "back.out(1.8)" }, 0.95 + cardEls.length * STEP)
            .to({}, { duration: 0.3 }); // brief hold before the page moves on

          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        } else {
          // ── Tablet / phone: no pinning; heading rises, each card unrolls and irises open on arrival.
          gsap.timeline({ scrollTrigger: { trigger: heading, start: "top 82%", once: true } })
            .fromTo("[data-eyebrow]", { "--line-scale": 0, autoAlpha: 0, letterSpacing: "0.4em" }, { "--line-scale": 1, autoAlpha: 1, letterSpacing: "0em", duration: 0.9, ease: "power3.out" })
            .from("[data-title-part]", { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.12 }, "-=0.55")
            .fromTo(swoosh, { strokeDasharray: swooshLength, strokeDashoffset: swooshLength }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, "-=0.35")
            .from("[data-intro]", { autoAlpha: 0, y: 14, duration: 0.7, ease: "power2.out" }, "-=0.6");

          cardEls.forEach((card, i) => {
            gsap.timeline({ delay: window.innerWidth >= 640 ? (i % 2) * 0.35 : 0, scrollTrigger: { trigger: card, start: "top 88%", once: true } })
              .from(card, { autoAlpha: 0, y: 80, rotationX: -50, transformPerspective: 1000, transformOrigin: "50% 0%", duration: 1, ease: "power3.out" })
              .fromTo(card.querySelector("[data-media-frame]"), { clipPath: IRIS_CLOSED }, { clipPath: IRIS_OPEN, duration: 0.9, ease: "power3.inOut" }, "-=0.7")
              .from(card.querySelector("[data-media]"), { scale: 1.4, filter: "grayscale(1)", duration: 1.1, ease: "power2.out" }, "<")
              .fromTo(card.querySelector("[data-shine]"), { xPercent: -120 }, { xPercent: 120, duration: 0.8, ease: "power2.inOut" }, "-=0.5")
              .from(card.querySelectorAll("[data-copy] > *"), { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.06, ease: "power2.out" }, "-=0.9")
              .from(card.querySelector("[data-category]"), { autoAlpha: 0, scale: 0.5, duration: 0.4, ease: "back.out(2.5)" }, "-=0.4");
          });

          gsap.from("[data-portfolio-button]", {
            autoAlpha: 0, y: 24, scale: 0.92, duration: 0.7, ease: "back.out(1.8)",
            scrollTrigger: { trigger: "[data-portfolio-button]", start: "top 95%", once: true },
          });
        }

        // ── Hover: subtle 3D tilt, moving glare, and a "View" bubble that follows the pointer.
        if (hover && contextSafe) {
          const cleanups = cardEls.map(card => {
            const bubble = card.querySelector<HTMLElement>("[data-bubble]")!;
            const tiltX = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
            const tiltY = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
            const bubbleX = gsap.quickTo(bubble, "x", { duration: 0.45, ease: "power3.out" });
            const bubbleY = gsap.quickTo(bubble, "y", { duration: 0.45, ease: "power3.out" });
            gsap.set(card, { transformPerspective: 1100 });
            gsap.set(bubble, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });

            const onEnter = contextSafe((event: PointerEvent) => {
              const rect = card.getBoundingClientRect();
              gsap.set(bubble, { x: event.clientX - rect.left, y: event.clientY - rect.top });
              gsap.to(bubble, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)", overwrite: "auto" });
            });
            const onMove = contextSafe((event: PointerEvent) => {
              const rect = card.getBoundingClientRect();
              const px = (event.clientX - rect.left) / rect.width;
              const py = (event.clientY - rect.top) / rect.height;
              tiltY((px - 0.5) * 6);
              tiltX((0.5 - py) * 5);
              bubbleX(event.clientX - rect.left);
              bubbleY(event.clientY - rect.top);
              card.style.setProperty("--glare-x", `${px * 100}%`);
              card.style.setProperty("--glare-y", `${py * 100}%`);
            });
            const onLeave = contextSafe(() => {
              tiltX(0);
              tiltY(0);
              gsap.to(bubble, { scale: 0, autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
            });

            card.addEventListener("pointerenter", onEnter);
            card.addEventListener("pointermove", onMove);
            card.addEventListener("pointerleave", onLeave);
            return () => {
              card.removeEventListener("pointerenter", onEnter);
              card.removeEventListener("pointermove", onMove);
              card.removeEventListener("pointerleave", onLeave);
            };
          });
          return () => cleanups.forEach(cleanup => cleanup());
        }
      },
    );
  }, { scope: sectionRef, dependencies: [cards.length] });

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="janic-portfolio-title">
      <span data-orb className={`${styles.orb} ${styles.orbA}`} aria-hidden="true" />
      <span data-orb className={`${styles.orb} ${styles.orbB}`} aria-hidden="true" />
      <div className={styles.container}>
        <header data-heading className={styles.heading}>
          <p data-eyebrow className={styles.eyebrow}>Projects Portfolio</p>
          <h2 id="janic-portfolio-title">
            <span className={styles.titleMask}><span data-title-part className={styles.titlePart}>Innovation</span></span>{" "}
            <span className={styles.titleMask}>
              <span data-title-part className={`${styles.titlePart} ${styles.accent}`}>
                in Action
                <svg className={styles.swoosh} viewBox="0 0 220 18" preserveAspectRatio="none" aria-hidden="true">
                  <path data-swoosh d="M3 13 C 50 4, 120 3, 217 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h2>
          <p data-intro className={styles.intro}>Explore real projects developed at JANIC. From AI and robotics to digital platforms,<br className={styles.desktopBreak} /> our work turns ideas into real-world impact.</p>
        </header>
        <div data-grid className={styles.grid}>
          <div data-stage className={styles.stage} aria-hidden="true" />
          <div className={styles.ghosts} aria-hidden="true">
            {cards.map((card, index) => (
              <div key={index} data-ghost className={styles.ghost}>
                <span data-ghost-num className={styles.ghostNum}>{String(index + 1).padStart(2, "0")}</span>
                <span data-ghost-caption className={styles.ghostCaption}>
                  <small>Project {String(index + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</small>
                  <strong>{card.category}</strong>
                </span>
              </div>
            ))}
          </div>
          {cards.map((card, index) => (
            <div key={`${card.slug}-${index}`} data-card className={styles.cardEntrance}>
              <Link href={`/projects/${card.slug}`} className={styles.card}>
                <div data-media-frame className={styles.mediaFrame}>
                  <div data-media className={styles.mediaInner}>
                    <ProjectMediaCover videoUrl={card.videoUrl} imageUrl={card.heroImage} alt={card.title} />
                  </div>
                  <span data-shine className={styles.shine} aria-hidden="true" />
                  <span data-category className={styles.category}>{card.category}</span>
                </div>
                <span data-bubble className={styles.bubble} aria-hidden="true">View <ArrowUpRight size={14} /></span>
                <div data-copy className={styles.cardCopy}>
                  <h3>{card.title}</h3>
                  <p className={styles.description}>{card.summary}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAction}>View Solution</span>
                    <span className={styles.cardArrow} aria-hidden="true"><ArrowRight size={18} /></span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div data-portfolio-button className={styles.portfolioButton}>
          <Link href="/projects" className={styles.button}>View Full Portfolio <ArrowRight size={19} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
