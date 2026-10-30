"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cpu, FlaskConical, MapPin, Users } from "lucide-react";
import { JanicCta } from "./JanicCta";
import styles from "./JanicCommunitySections.module.css";

interface ResearchItem { title: string; abstract: string; slug: string; }
interface EventItem { title: string; slug: string; date: string; location: string; coverImage?: string | null; }
interface CommunityProps { research: ResearchItem[]; events: EventItem[]; }
const researchFallbacks: ResearchItem[] = [
  { title: "Applied Technological Research", abstract: "Focusing on practical solutions for immediate industrial challenges in the local market.", slug: "applied-technology" },
  { title: "Student-Led Innovations", abstract: "Empowering the next generation of researchers to push academic boundaries into the real world.", slug: "student-innovations" },
  { title: "Digital Future Transformation", abstract: "Strategic research into AI, Blockchain, and the impact of the 4th Industrial Revolution.", slug: "digital-transformation" },
];
const eventFallbacks: EventItem[] = [
  { title: "JANIC Innovation Summit 2024", slug: "janic-innovation-summit-2024", date: "2024-10-18T09:00:00+03:00", location: "Main Campus Auditorium" },
  { title: "Cybersecurity Challenge 4.0", slug: "cybersecurity-challenge-4", date: "2024-11-04T09:00:00+03:00", location: "Tech Lab B-02" },
  { title: "AI Workshop for Developers", slug: "ai-workshop-for-developers", date: "2024-12-15T09:00:00+03:00", location: "Hybrid / Online" },
];
const eventImages = ["/images/event-summit.jpg", "/images/event-cyber.jpg", "/images/event-workshop.jpg"];
const researchIcons = [FlaskConical, Users, Cpu];

export function JanicCommunitySections({ research, events }: CommunityProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const elements = rootRef.current?.querySelectorAll<HTMLElement>("[data-community-reveal]");
    if (!elements || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(element => { element.setAttribute("data-ready", "true"); observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  const papers = research.length ? research.slice(0, 3) : researchFallbacks;
  const upcoming = events.length ? events.slice(0, 3) : eventFallbacks;

  return (
    <div ref={rootRef} className={styles.root}>
      <section className={styles.section} aria-labelledby="janic-research-title">
        <div className={styles.container}>
          <header data-community-reveal className={styles.sectionHeading}>
            <div className={styles.headingCopy}>
              <p className={styles.eyebrow}>Scientific Inquiry</p>
              <h2 id="janic-research-title">Research &amp; Insights</h2>
              <p className={styles.intro}>Exploring ideas, advancing knowledge, and shaping real-world solutions through collaborative research and innovation.</p>
            </div>
            <Link href="/research" className={`${styles.button} ${styles.outline}`}>View Publications <ArrowRight size={18} aria-hidden="true" /></Link>
          </header>
          <div className={styles.threeColumns}>
            {papers.map((paper, index) => {
              const Icon = researchIcons[index % researchIcons.length];
              return <div key={paper.slug} data-community-reveal className={styles.cardEntrance} style={{ transitionDelay: `${index * 120}ms` }}>
                <Link href={`/research/${paper.slug}`} className={styles.researchCard}>
                  <span className={styles.researchIcon}><Icon size={26} strokeWidth={1.7} aria-hidden="true" /></span>
                  <div className={styles.researchCopy}>
                    <h3>{paper.title}</h3>
                    <p>{paper.abstract}</p>
                    <span className={styles.textLink}>Explore <ArrowRight size={17} aria-hidden="true" /></span>
                  </div>
                </Link>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.events}`} aria-labelledby="janic-events-title">
        <div className={styles.container}>
          <header data-community-reveal className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>Community Hub</p><h2 id="janic-events-title">Upcoming Events</h2></div>
            <Link href="/events" className={styles.textLink}>See All Events <ArrowRight size={18} aria-hidden="true" /></Link>
          </header>
          <div className={styles.threeColumns}>
            {upcoming.map((event, index) => {
              const date = new Date(event.date);
              const day = new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "Africa/Mogadishu" }).format(date);
              const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "Africa/Mogadishu" }).format(date).toUpperCase();
              const cover = event.coverImage && (event.coverImage.startsWith("/") || event.coverImage.startsWith("http")) ? event.coverImage : eventImages[index % eventImages.length];
              return <div key={event.slug} data-community-reveal style={{ transitionDelay: `${index * 120}ms` }}>
                <Link href={`/events/${event.slug}`} className={styles.eventCard}>
                  <div className={styles.eventImage}>
                    <Image src={cover} alt={event.title} fill sizes="(max-width: 639px) 100vw, (max-width: 899px) 50vw, 33vw" className={styles.image} />
                    <time dateTime={event.date} className={styles.dateBadge}><strong>{day}</strong><span>{month}</span></time>
                  </div>
                  <h3>{event.title}</h3>
                  <p className={styles.location}><MapPin size={17} aria-hidden="true" /><span>{event.location}</span></p>
                  <span className={styles.textLink}>Read More <ArrowRight size={17} aria-hidden="true" /></span>
                </Link>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.partnership}`} aria-labelledby="janic-partnership-title">
        <div className={`${styles.container} ${styles.split}`}>
          <div data-community-reveal className={styles.partnershipCopy}>
            <p className={styles.eyebrow}>Partnership</p>
            <h2 id="janic-partnership-title">Let&apos;s Build the<br className={styles.desktopBreak} /> Future Together</h2>
            <p className={styles.intro}>We believe in the power of collaboration. Partner with JANIC to drive technological advancement and impact.</p>
            <div className={styles.actions}>
              <Link href="/partnerships" className={styles.button}>Partner With Us <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link href="/partnerships#partners" className={`${styles.button} ${styles.outline}`}>View Our Partners</Link>
            </div>
          </div>
          <div data-community-reveal className={styles.partnershipImage}>
            <Image src="/images/partnership-globe.jpg" alt="Blue globe connecting people and organizations across the world" fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.image} />
          </div>
        </div>
      </section>

      {/* <JanicCta /> */}
    </div>
  );
}
