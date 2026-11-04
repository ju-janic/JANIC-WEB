import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getSettingsMap } from "@/lib/settings";

export async function PublicFooter() {
  const settings = await getSettingsMap();
  const tagline = settings["footer_tagline"] || "Innovating Technology. Empowering the Future.";
  const founded = settings["founded_date"] || "October 25, 2021";
  const address = settings["campus_address"] || "Faculty of Computer Science & IT, Jazeera University, Mogadishu, Somalia";
  const email = settings["contact_email"] || "janic@jazeerauniversity.edu.so";
  const phone = settings["contact_phone"] || "+25213195111";
  const siteName = settings["site_name"] || "Jazeera Nexus Innovation Center (JANIC)";
  const accreditation = settings["accreditation_badge"] || "Faculty of Computer Science & IT • Jazeera University";

  return (
    <footer className="bg-[#072757] text-slate-300 border-t border-[#0B3B82]/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00A3E0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Footer Content */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block group">
              <div className="relative w-48 h-12 transition-transform group-hover:scale-[1.02]">
                <Image
                  src="/images/janic-new-with-jazeera-white.png"
                  alt="JANIC Logo"
                  fill
                  className="object-contain object-left"
                  sizes="192px"
                />
              </div>
            </Link>
            <p className="text-sm text-slate-200 font-semibold">{tagline}</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Jazeera Nexus Innovation Center (JANIC) is an innovation and technology initiative under the Faculty of Computer Science & IT at Jazeera University, Mogadishu, Somalia.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{accreditation}</span>
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition">About JANIC</Link>
              </li>
              <li>
                <Link href="/what-we-do" className="text-slate-400 hover:text-white transition">What We Do</Link>
              </li>
              <li>
                <Link href="/hubs" className="text-slate-400 hover:text-white transition">Hubs & Programmes</Link>
              </li>
              <li>
                <Link href="/projects" className="text-slate-400 hover:text-white transition">Projects & Innovations</Link>
              </li>
              <li>
                <Link href="/project-members" className="text-slate-400 hover:text-white transition">Project Members & Teams</Link>
              </li>
              <li>
                <a href="https://juictgirls.org/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition inline-flex items-center gap-1">
                  Jazeera ICT Girls Hub ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/training" className="text-slate-400 hover:text-white transition">Training & Workshops</Link>
              </li>
              <li>
                <Link href="/research" className="text-slate-400 hover:text-white transition">Research & Publications</Link>
              </li>
              <li>
                <Link href="/events" className="text-slate-400 hover:text-white transition">Events & News</Link>
              </li>
              <li>
                <Link href="/resources/opportunities" className="text-slate-400 hover:text-white transition">Opportunities</Link>
              </li>
              <li>
                <Link href="/sponsors" className="text-slate-400 hover:text-white transition">Sponsors</Link>
              </li>
              <li>
                <Link href="/resources/downloads" className="text-slate-400 hover:text-white transition">Downloads & Forms</Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-400 hover:text-white transition">FAQs</Link>
              </li>
              <li>
                <Link href="/posts" className="text-slate-400 hover:text-white transition">Articles & Posts</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details & Engagement */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
              Contact & Engage
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#00A3E0] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00A3E0] shrink-0" />
                <span>{phone}</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
              <Link href="/submit-innovation" className="hover:text-sky-300 transition text-[#00A3E0] font-semibold block">
                Submit Your Idea →
              </Link>
              <Link href="/partnerships" className="text-slate-400 hover:text-white transition block">
                Partner with Us
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition block">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Optional Legal Links */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {siteName}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <Link href="/privacy" className="hover:text-slate-200 transition">Privacy Notice</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-200 transition">Website Terms</Link>
            <span>•</span>
            <Link href="/accessibility" className="hover:text-slate-200 transition">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
