"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, FileText, Layers, Rocket } from "lucide-react";
import styles from "./JanicHero.module.css";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: typeof CalendarDays;
  href?: string;
}

const stats: StatItem[] = [
  { value: 2021, suffix: "", label: "Founded", icon: CalendarDays },
  { value: 18, suffix: "+", label: "Projects", icon: FileText },
  { value: 6, suffix: "", label: "Functions", icon: Layers },
  { value: 12, suffix: "", label: "Hubs", icon: Building2 },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      element.textContent = `${value}${suffix}`;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (preference.matches) return finish();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1000, 1);
        element.textContent = `${Math.round(value * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(element);
    preference.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", finish);
    };
  }, [value, suffix]);
  return <span aria-label={`${value}${suffix}`}><span ref={ref} aria-hidden="true">{value}{suffix}</span></span>;
}

interface JanicHeroProps {
  title: string;
  subtitle: string;
  image: string;
  badgeValue: string;
  badgeLabel: string;
}

export function JanicHero({ title, subtitle, image, badgeValue, badgeLabel }: JanicHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const elements = sectionRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!elements) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const defaultTitle = title.trim() === "Innovating Technology. Empowering the Future.";
  return (
    <section ref={sectionRef} className={styles.hero} aria-labelledby="janic-hero-title">
      <div className={styles.background} aria-hidden="true">
        <Image src={image} alt="" fill sizes="100vw" preload className={styles.image} />
      </div>
      <div className={styles.wash} aria-hidden="true" />
      <div className={styles.dots} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <div data-reveal className={styles.eyebrow}>Welcome to JANIC</div>
            <h1 id="janic-hero-title" data-reveal className={styles.title}>
              {defaultTitle ? <>Innovating<br />Technology.<br /><span>Empowering</span><br />the Future.</> : title}
            </h1>
            <p data-reveal className={styles.description}>{subtitle}</p>
            <div data-reveal className={styles.buttons}>
              <Link href="/projects" className={styles.primary}>Explore Our Projects <ArrowRight size={20} aria-hidden="true" /></Link>
              {/* <Link href="/join" className={styles.secondary}>Join JANIC</Link>
              <Link href="/partnerships" className={styles.secondary}>Partner with Us</Link> */}
            </div>
          </div>
          <div className={styles.visual}>
            <div data-reveal className={styles.badgeEntrance}>
              <div className={`${styles.glass} ${styles.badge}`}>
                <span className={styles.rocket}><Rocket size={29} strokeWidth={1.6} aria-hidden="true" /></span>
                <div><strong>{badgeValue}</strong><p>{badgeLabel.toLowerCase() === "student innovation projects" ? "Student Innovation Projects" : badgeLabel}</p></div>
              </div>
            </div>
            <div data-reveal className={styles.hubEntrance}>
              <article className={`${styles.glass} ${styles.hub}`}>
                <div className={styles.eyebrow}>Innovation Hub</div>
                <h2>Innovation Project <span>→</span> Prototypes <span>→</span> Solutions</h2>
                <p>Bridging the gap between academic theory and real-world industrial impact through cutting-edge technology development.</p>
                <Link href="/innovation-hub">Explore the Hub <ArrowRight size={21} aria-hidden="true" /></Link>
              </article>
            </div>
          </div>
        </div>
        <div data-reveal className={styles.statsEntrance}>
          <dl className={styles.stats}>
            {stats.map(({ value, suffix, label, icon: Icon, href }) => {
              const inner = (
                <>
                  <span className={styles.statIcon}><Icon size={29} strokeWidth={1.8} aria-hidden="true" /></span>
                  <div>
                    <dt className={styles.statLabel}>
                      <span>{label}</span>
                      {href && <ArrowUpRight size={12} strokeWidth={2.4} className={styles.statArrow} aria-hidden="true" />}
                    </dt>
                    <dd><CountUp value={value} suffix={suffix} /></dd>
                  </div>
                </>
              );

              return (
                <div className={styles.stat} key={label}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.statLink}
                      title={`Visit ${label} (${href})`}
                      aria-label={`${value}${suffix} ${label} - opens in a new tab`}
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
