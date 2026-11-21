"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Lightbulb, Layers, Cpu, CheckCircle2, Award, Rocket } from "lucide-react";
import styles from "./InnovationPipelineNodes.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const pipelineSteps = [
  { number: "01", name: "Identify Idea", tagline: "Identify community and industry problems or create new ideas.", deliverable: "Problem Brief", icon: Lightbulb, position: 250 },
  { number: "02", name: "Design", tagline: "Develop concept, system architecture, blueprints, and UI specs.", deliverable: "Design Spec", icon: Layers, position: 205 },
  { number: "03", name: "Prototype", tagline: "Engineer functional software applications or hardware prototypes.", deliverable: "Working Prototype", icon: Cpu, position: 270 },
  { number: "04", name: "Validate", tagline: "Rigorous laboratory testing, field validation, and trial feedback.", deliverable: "Testing Results", icon: CheckCircle2, position: 215 },
  { number: "05", name: "Showcase", tagline: "Demonstrate verified solutions live at university Demo Days.", deliverable: "Live Showcase", icon: Award, position: 275 },
  { number: "06", name: "Advance", tagline: "Incubate, launch pilot projects, secure mentorship, and scale.", deliverable: "Project Advance", icon: Rocket, position: 195 },
];

const ROAD_PATH = "M -40 180 C 10 230 45 250 100 250 C 200 280 220 205 300 205 C 390 205 410 270 500 270 C 590 270 610 215 700 215 C 790 215 810 275 900 275 C 990 275 1010 195 1100 195 C 1160 150 1220 160 1250 180";
const VIEW_W = 1200;
const VIEW_H = 480;

/** Samples the road path so we can look up its y for any x (the path is monotonic in x). */
function buildRoadLookup(path: SVGPathElement) {
  const total = path.getTotalLength();
  const samples: { x: number; y: number }[] = [];
  for (let i = 0; i <= 400; i++) {
    const { x, y } = path.getPointAtLength((i / 400) * total);
    samples.push({ x, y });
  }
  return (x: number) => {
    const next = samples.findIndex(point => point.x >= x);
    if (next <= 0) return samples[Math.max(next, 0)].y;
    const a = samples[next - 1];
    const b = samples[next];
    return a.y + ((x - a.x) / (b.x - a.x || 1)) * (b.y - a.y);
  };
}

export function InnovationPipelineNodes() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 1024px)",
        mobile: "(max-width: 1023px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      context => {
        const { desktop, reduce } = context.conditions as { desktop: boolean; mobile: boolean; reduce: boolean };
        if (reduce) return;

        // Heading: eyebrow drops in, title words rise one by one, intro fades up.
        gsap.timeline({ scrollTrigger: { trigger: "[data-heading]", start: "top 82%", once: true } })
          .from("[data-eyebrow]", { autoAlpha: 0, y: -14, scale: 0.9, duration: 0.6, ease: "back.out(2)" })
          .from("[data-word]", { autoAlpha: 0, yPercent: 110, rotate: 4, duration: 0.8, ease: "power4.out", stagger: 0.1 }, "-=0.3")
          .from("[data-intro]", { autoAlpha: 0, y: 16, filter: "blur(6px)", duration: 0.8, ease: "power2.out" }, "-=0.45");

        if (desktop) {
          const timeline = section.querySelector<HTMLElement>("[data-timeline]")!;
          const curve = section.querySelector<SVGSVGElement>("[data-curve]")!;
          const runner = section.querySelector<HTMLElement>("[data-runner]")!;
          const roadY = buildRoadLookup(curve.querySelector<SVGPathElement>("[data-road]")!);
          const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
          const icons = steps.map(step => step.querySelector<HTMLElement>("[data-icon]")!);
          const hudIndex = section.querySelector<HTMLElement>("[data-hud-index]")!;
          const hudName = section.querySelector<HTMLElement>("[data-hud-name]")!;
          const hudBar = section.querySelector<HTMLElement>("[data-hud-bar]")!;
          let lastActive = -1;

          const road = { x: 0 };
          const drawRoad = () => {
            const width = timeline.offsetWidth;
            // Light up every node the runner has passed and update the stage readout.
            const active = steps.filter((_, i) => road.x >= ((i + 0.5) / steps.length) * VIEW_W - 4).length;
            if (active !== lastActive) {
              lastActive = active;
              icons.forEach((icon, i) => icon.toggleAttribute("data-active", i < active));
              const current = Math.max(active, 1) - 1;
              hudIndex.textContent = pipelineSteps[current].number;
              hudName.textContent = pipelineSteps[current].name;
            }
            hudBar.style.transform = `scaleX(${road.x / VIEW_W})`;
            curve.style.clipPath = `inset(-40px ${(1 - road.x / VIEW_W) * 100}% -40px 0)`;
            gsap.set(runner, {
              x: (road.x / VIEW_W) * width,
              y: (roadY(road.x) / VIEW_H) * curve.getBoundingClientRect().height,
              autoAlpha: road.x > 2 && road.x < VIEW_W - 2 ? 1 : 0,
            });
          };

          // Pin the section and drive everything from scroll until the last step is revealed.
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: section,
              // Keep the whole timeline on screen even when the section is taller than the viewport.
              start: () => (section.offsetHeight > window.innerHeight ? "bottom bottom" : "center center"),
              end: () => `+=${Math.max(window.innerHeight * 1.6, 1200)}`,
              pin: true,
              // The home page wraps sections in a flex column, where GSAP disables pin spacing by default.
              // Force it on so the following sections wait below until this animation finishes.
              pinSpacing: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: drawRoad,
            },
          });

          tl.to(road, { x: VIEW_W, duration: 1, ease: "none", onUpdate: drawRoad }, 0);

          steps.forEach((step, index) => {
            const at = (index + 0.5) / steps.length - 0.03;
            const icon = step.querySelector("[data-icon]");
            const ring = step.querySelector("[data-ring]");
            const content = step.querySelector("[data-content]");
            tl.from(icon, { autoAlpha: 0, scale: 0.4, duration: 0.06, ease: "back.out(2.2)" }, at)
              .fromTo(ring, { scale: 0.8, autoAlpha: 0.7 }, { scale: 1.9, autoAlpha: 0, duration: 0.1, ease: "power1.out" }, at + 0.02)
              .from(content, { autoAlpha: 0, y: index % 2 ? -28 : 28, filter: "blur(4px)", duration: 0.09 }, at + 0.03);
          });

          tl.from("[data-hud]", { autoAlpha: 0, y: 10, duration: 0.05 }, 0);

          // Short hold so the finished state stays pinned for a moment before releasing.
          tl.to({}, { duration: 0.12 });

          drawRoad();
          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        } else {
          // Vertical line fills with scroll; each step pops in as it arrives.
          gsap.fromTo(
            "[data-steps]",
            { "--line-progress": 0 },
            {
              "--line-progress": 1,
              ease: "none",
              scrollTrigger: { trigger: "[data-steps]", start: "top 70%", end: "bottom 70%", scrub: 0.6 },
            },
          );

          gsap.utils.toArray<HTMLElement>("[data-step]").forEach(step => {
            gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: step, start: "top 82%", once: true } })
              .from(step.querySelector("[data-icon]"), { autoAlpha: 0, scale: 0.5, duration: 0.6, ease: "back.out(2)" })
              .call(() => step.querySelector("[data-icon]")?.setAttribute("data-active", ""), [], "-=0.3")
              .fromTo(step.querySelector("[data-ring]"), { scale: 0.8, autoAlpha: 0.7 }, { scale: 1.9, autoAlpha: 0, duration: 0.8 }, "<")
              .from(step.querySelector("[data-content]"), { autoAlpha: 0, x: 24, filter: "blur(4px)", duration: 0.6 }, "<");
          });
        }
      },
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="innovation-lifecycle-title">
      <div className={styles.container}>
        <div data-heading className={styles.heading}>
          <p data-eyebrow className={styles.eyebrow}>Innovation Lifecycle</p>
          <h2 id="innovation-lifecycle-title">
            {["Ideas.", "Prototypes.", "Possibilities."].map((word, index) => (
              <span key={word} className={styles.wordMask}>
                <span data-word className={`${styles.word} ${index === 2 ? styles.accent : ""}`}>{word}</span>
              </span>
            ))}
          </h2>
          <p data-intro className={styles.intro}>The JANIC Innovation Hub is where radical ideas meet rigorous engineering.<br className={styles.desktopBreak} /> We provide a sandbox for student-led innovation and industrial prototyping.</p>
        </div>
        <div data-timeline className={styles.timeline}>
          <svg data-curve className={styles.curve} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={ROAD_PATH} fill="none" stroke="#eaf6ff" strokeOpacity={0.2} strokeWidth="65" />
            <path data-road d={ROAD_PATH} fill="none" stroke="#2795ff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span data-runner className={styles.runner} aria-hidden="true" />
          <div data-hud className={styles.hud} aria-hidden="true">
            <span className={styles.hudLabel}>Stage <strong data-hud-index>01</strong> / 06</span>
            <span className={styles.hudTrack}><span data-hud-bar className={styles.hudBar} /></span>
            <span data-hud-name className={styles.hudName}>{pipelineSteps[0].name}</span>
          </div>
          <ol data-steps className={styles.steps}>
            {pipelineSteps.map(({ number, name, tagline, deliverable, icon: Icon, position }, index) => (
              <li key={number} data-step className={`${styles.step} ${index % 2 ? styles.above : styles.below}`} style={{ "--node-y": `${position}px` } as React.CSSProperties}>
                <div className={styles.stepBody}>
                  <span data-icon className={styles.icon}>
                    <span data-ring className={styles.ring} aria-hidden="true" />
                    <Icon size={34} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div data-content className={styles.content}>
                    <span className={styles.number} aria-hidden="true">{number}</span>
                    <h3>{name}</h3>
                    <p>{tagline}</p>
                    <span className={styles.deliverable}>{deliverable}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
