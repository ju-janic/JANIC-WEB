/* eslint-disable */
const { PrismaClient, Role, ContentStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 1. Create Superadmin User
  const adminUsername = "jamiila";
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("jamiila@janic123", salt);

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "jamiila@janic.edu.so",
        username: adminUsername,
        passwordHash,
        name: "Dean Jamiila",
        role: Role.ADMIN,
        avatar: "/images/admin-avatar.png",
      },
    });
    console.log("Created superadmin user: jamiila (Dean of CS & IT) (Password: jamiila@janic123)");
  } else {
    await prisma.user.update({
      where: { username: adminUsername },
      data: { passwordHash, role: Role.ADMIN },
    });
    console.log("Updated superadmin credentials.");
  }

  // 2. Seed Student Innovation Projects from JANIC docx
  const projects = [
    {
      title: "SomaliBDV",
      slug: "somalibdv",
      category: "HealthTech",
      summary: "Somali Blood Donation Volunteers (SomaliBDV) is a digital platform designed to make blood donation coordination easier in Somalia, connecting donors with people who need blood.",
      problem: "Healthcare organizations face severe bottlenecks coordinating blood requests and identifying available donors during medical emergencies.",
      solution: "Connects blood donors with people in need, providing an organized way to register donors and submit and manage blood requests for hospitals and healthcare organizations.",
      technology: "Next.js, Node.js, Express, SMS Notification Gateway, MySQL, Tailwind CSS",
      innovation: "Organized donor-recipient coordination platform optimized for emergency hospital requests in Somalia.",
      outcomes: "Streamlined voluntary donor onboarding and emergency blood request management for regional clinics.",
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      heroImage: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
      teamMembers: "Ismail Ibrahim Abdirahim",
      order: 11,
      publishedAt: new Date("2026-01-15T00:00:00Z"),
    },
    {
      title: "XARIIR",
      slug: "xariir",
      category: "Mobile & Cloud",
      summary: "XARIIR - Real-time Messaging & Social Communication Platform. A full-stack messaging application providing secure, real-time communication with rich media support.",
      problem: "Users require secure, privacy-respecting messaging platforms optimized for varying mobile bandwidth and cross-device synchronization.",
      solution: "Combines robust authentication, rich media sharing (images, videos, files), and social features like status updates, groups, and community building.",
      technology: "React Native, Expo, Node.js, Express, WebSockets, REST APIs, MySQL",
      innovation: "Microservice-inspired architecture using Node.js/Express backend and React Native/Expo mobile clients with real-time WebSocket communication.",
      outcomes: "Seamless cross-platform communication with instant updates, status sharing, and media transfers.",
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      heroImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      teamMembers: "Muscab Ahmad Mohamud",
      order: 12,
      publishedAt: new Date("2026-01-15T00:00:00Z"),
    },
    {
      title: "Dalag App",
      slug: "dalag-app",
      category: "AgriTech",
      summary: "Dalag App is a mobile app that connects farmers directly to buyers (markets, restaurants, individual customers) without middlemen, featuring instant mobile money (EVC Plus) and market prices.",
      problem: "Farmers in Somalia are underpaid by middlemen and lack direct access to open consumer and commercial markets.",
      solution: "Farmers post crop listings with price and quantity, buyers browse and send purchase requests directly, payment is settled instantly through EVC Plus, and pickup/delivery is coordinated.",
      technology: "React Native, Node.js, Express, EVC Plus Mobile Money, MySQL",
      innovation: "Shows current average market prices for common crops so farmers receive fair compensation without intermediary exploitation.",
      outcomes: "Eliminated middleman commissions and established direct, instant mobile money transactions between farmers and buyers.",
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      heroImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
      teamMembers: "Abdiqaadir Mohamed Hassan",
      order: 13,
      publishedAt: new Date("2026-01-15T00:00:00Z"),
    },
  ];

  // Remove any obsolete projects from previous tests not in the 15 projects list
  const activeSlugs = projects.map((p) => p.slug);
  await prisma.project.deleteMany({
    where: {
      slug: { notIn: activeSlugs },
    },
  });

  for (const projectData of projects) {
    const existing = await prisma.project.findUnique({ where: { slug: projectData.slug } });
    if (!existing) {
      await prisma.project.create({ data: projectData });
    } else {
      await prisma.project.update({ where: { slug: projectData.slug }, data: projectData });
    }
  }
  console.log(`Seeded ${projects.length} innovation projects (10 Groups, 5 Individual).`);

  // 2b. Seed Project Members with Roles, Avatars & Social Links
  const projectMembersSeed = [
    // GROUP TEN: JANIC Web Team
    {
      name: "Abdilahi Abdiweli Adam",
      role: "Full-Stack Portal Architect",
      projectSlug: "janic-web-team",
      department: "Faculty of Computer Science & IT",
      bio: "Full-stack engineer building the next-generation digital portal, interactive research repos, and showcase features for JANIC.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      github: "https://github.com/abdilahiabdiweli",
      linkedin: "https://linkedin.com/in/abdilahi-abdiweli",
      twitter: "https://x.com/abdilahiabdiweli",
      instagram: "https://instagram.com/abdilahiabdiweli",
      facebook: "https://facebook.com/abdilahiabdiweli",
      website: "https://janic.edu.so",
      email: "abdilahi.abdiweli@janic.edu.so",
      phone: "+252 61 566 7788",
      tags: "Next.js 16, React 19, TypeScript, Prisma ORM",
      order: 1,
    },
    {
      name: "Muscab Ahmed Mohamud",
      role: "Frontend & Cloud Infrastructure Engineer",
      projectSlug: "janic-web-team",
      department: "Faculty of Computer Science & IT",
      bio: "Frontend specialist designing rich responsive user interfaces, fluid animations, and administrative CMS modules.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      github: "https://github.com/muscabahmed",
      linkedin: "https://linkedin.com/in/muscab-ahmed",
      twitter: "https://x.com/muscabahmed",
      instagram: "https://instagram.com/muscabahmed",
      facebook: "https://facebook.com/muscabahmed",
      website: "https://janic.edu.so",
      email: "muscab.ahmed@janic.edu.so",
      phone: "+252 61 577 8899",
      tags: "Tailwind CSS, Radix UI, UI/UX, Performance",
      order: 2,
    },
    // INDIVIDUAL: SomaliBDV
    {
      name: "Ismail Ibrahim Abdirahim",
      role: "Founder & Lead Developer",
      projectSlug: "somalibdv",
      department: "Faculty of Computer Science & IT",
      bio: "Social innovator building digital health coordination tools to connect volunteer blood donors with critical hospital requests in Somalia.",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
      github: "https://github.com/ismailibrahim",
      linkedin: "https://linkedin.com/in/ismail-ibrahim",
      twitter: "https://x.com/ismailibrahim",
      instagram: "https://instagram.com/ismailibrahim",
      facebook: "https://facebook.com/ismailibrahim",
      website: "https://somalibdv.example.com",
      email: "ismail.ibrahim@janic.edu.so",
      phone: "+252 61 588 9900",
      tags: "HealthTech, SMS Gateway, Blood Registry, Node.js",
      order: 1,
    },
    // INDIVIDUAL: XARIIR
    {
      name: "Muscab Ahmad Mohamud",
      role: "Lead Mobile Architect & Founder",
      projectSlug: "xariir",
      department: "Faculty of Computer Science & IT",
      bio: "Full-stack mobile engineer designing real-time socket communications, end-to-end media streaming, and modern messaging clients.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      github: "https://github.com/muscabahmad",
      linkedin: "https://linkedin.com/in/muscab-ahmad",
      twitter: "https://x.com/muscabahmad",
      instagram: "https://instagram.com/muscabahmad",
      facebook: "https://facebook.com/muscabahmad",
      email: "muscab.ahmad@janic.edu.so",
      phone: "+252 61 599 0011",
      tags: "React Native, Expo, WebSockets, Express",
      order: 1,
    },
    // INDIVIDUAL: Dalag App
    {
      name: "Abdiqaadir Mohamed Hassan",
      role: "AgriTech Innovator & Lead Developer",
      projectSlug: "dalag-app",
      department: "Faculty of Computer Science & IT",
      bio: "Agricultural technologist connecting rural Somali farmers directly to urban food markets with transparent pricing and instant EVC Plus payments.",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
      github: "https://github.com/abdiqaadirhassan",
      linkedin: "https://linkedin.com/in/abdiqaadir-hassan",
      twitter: "https://x.com/abdiqaadirhassan",
      instagram: "https://instagram.com/abdiqaadirhassan",
      facebook: "https://facebook.com/abdiqaadirhassan",
      email: "abdiqaadir.hassan@janic.edu.so",
      phone: "+252 61 600 1122",
      tags: "AgriTech, React Native, Mobile Money, EVC Plus",
      order: 1,
    },
  ];

  for (const item of projectMembersSeed) {
    const proj = await prisma.project.findUnique({ where: { slug: item.projectSlug } });
    if (proj) {
      const existing = await prisma.projectMember.findFirst({
        where: { name: item.name, projectId: proj.id },
      });

      const memberPayload = {
        name: item.name,
        role: item.role,
        department: item.department,
        bio: item.bio,
        avatar: item.avatar,
        github: item.github,
        linkedin: item.linkedin,
        twitter: item.twitter,
        instagram: item.instagram,
        facebook: item.facebook,
        website: item.website,
        email: item.email,
        phone: item.phone,
        tags: item.tags,
        order: item.order,
        projectId: proj.id,
        isActive: true,
      };

      if (!existing) {
        await prisma.projectMember.create({ data: memberPayload });
      } else {
        await prisma.projectMember.update({ where: { id: existing.id }, data: memberPayload });
      }
    }
  }
  console.log(`Seeded ${projectMembersSeed.length} project members with social links.`);

  // 3. Seed Training Programs
  const trainingPrograms = [
    {
      title: "Cybersecurity Defense & Network Infrastructure",
      slug: "cybersecurity-network-infrastructure",
      category: "Cybersecurity",
      summary: "Practical training in ethical hacking, vulnerability assessments, firewall configuration, and SOC fundamentals.",
      description: "Prepare for international security certifications with comprehensive practical labs covering network defense, penetration testing fundamentals, secure Linux server hardening, cryptographic protocols, and incident response.",
      level: "Intermediate",
      duration: "8 Weeks",
      schedule: "Saturdays, 9:00 AM – 3:00 PM",
      mode: "On-Campus",
      certification: "JANIC Network Security Practitioner",
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
      maxSeats: 25,
    },
    {
      title: "AI, Machine Learning & Intelligent Automation",
      slug: "ai-machine-learning-automation",
      category: "Emerging Technologies",
      summary: "Explore applied machine learning, computer vision, data analysis with Python, and intelligent agent workflows.",
      description: "Dive into data science and modern AI. Learn Python for numerical analysis, train machine learning classifiers with scikit-learn, build neural networks, and explore real-world computer vision applications.",
      level: "Intermediate",
      duration: "10 Weeks",
      schedule: "Wed & Sat, 4:00 PM – 7:00 PM",
      mode: "On-Campus",
      certification: "JANIC Applied AI Practitioner",
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
      maxSeats: 25,
    },
  ];

  for (const program of trainingPrograms) {
    const existing = await prisma.trainingProgram.findUnique({ where: { slug: program.slug } });
    if (!existing) {
      await prisma.trainingProgram.create({ data: program });
    } else {
      await prisma.trainingProgram.update({ where: { slug: program.slug }, data: program });
    }
  }
  console.log(`Seeded ${trainingPrograms.length} training programs.`);

  // 4. Seed Research Papers
  const researchPapers = [
    {
      title: "Optimized File Deduplication Architectures for Distributed Academic Information Systems",
      slug: "optimized-file-deduplication-academic-systems",
      category: "Student Research",
      abstract: "Presents an algorithmic framework integrating cryptographic chunk hashing with metadata clustering to minimize institutional cloud storage costs across university faculties.",
      content: "Achieved a 42% physical footprint reduction without degrading latency for simultaneous student download requests during exam cycles.",
      authors: "Ayan Warsame, Dr. Mohamed Qasim",
      journalOrConference: "JANIC Academic Working Papers Series, Vol. 3",
      publicationDate: new Date("2025-11-10"),
      pdfUrl: "https://janic.edu.so/research/papers/academic-deduplication.pdf",
      status: ContentStatus.PUBLISHED,
      isFeatured: false,
    },
  ];

  for (const paper of researchPapers) {
    const existing = await prisma.researchPaper.findUnique({ where: { slug: paper.slug } });
    if (!existing) {
      await prisma.researchPaper.create({ data: paper });
    } else {
      await prisma.researchPaper.update({ where: { slug: paper.slug }, data: paper });
    }
  }
  console.log(`Seeded ${researchPapers.length} research papers.`);

  // 5. Seed Events
  const events = [
    {
      title: "JANIC Annual Tech Showcase & Demo Day 2026",
      slug: "janic-annual-tech-showcase-2026",
      category: "Innovation Showcase",
      summary: "Experience the latest student-built hardware prototypes, AI applications, and startup innovations live on stage.",
      description: "Join university leaders, tech industry pioneers, angel investors, and government representatives as JANIC's student innovators pitch and demonstrate functional prototypes built over the past academic year.",
      eventDate: new Date("2026-11-20T09:00:00Z"),
      endDate: new Date("2026-11-20T17:00:00Z"),
      location: "Jazeera University Main Auditorium, Mogadishu",
      isVirtual: false,
      capacity: 350,
      registrationUrl: "https://janic.edu.so/events/demo-day-2026/register",
      status: ContentStatus.PUBLISHED,
      isFeatured: false,
      coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const event of events) {
    const existing = await prisma.event.findUnique({ where: { slug: event.slug } });
    if (!existing) {
      await prisma.event.create({ data: event });
    } else {
      await prisma.event.update({ where: { slug: event.slug }, data: event });
    }
  }
  console.log(`Seeded ${events.length} events.`);

  // 6. Seed Team Members (Leadership & Advisors)
  const teamMembers = [
    {
      name: "Jamila Hassan Mohamed",
      role: "CS & IT Dean",
      department: "Faculty of Computer Science & IT, Visionary founder of JANIC and Dean of the Faculty of Computer Science & IT, leading academic innovation, faculty mentorship.",
      bio: "Visionary founder of JANIC and Dean of the Faculty of Computer Science & IT, leading academic innovation, faculty mentorship, and youth technological empowerment.",
      avatar: "/images/Founder-img.jpeg",
      email: "jamiila@janic.edu.so",
      order: 0,
      isActive: true,
      isFounder: true,
    },
  ];

  // Remove mock team members from database
  await prisma.teamMember.deleteMany({
    where: {
      name: {
        in: [
          "Dr. Abdullahi Nur Barre",
        ],
      },
    },
  });

  for (const member of teamMembers) {
    const existing = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { name: member.name },
          { name: member.name.trim() },
          { email: member.email },
        ],
      },
    });
    if (!existing) {
      await prisma.teamMember.create({ data: member });
    } else {
      await prisma.teamMember.update({ where: { id: existing.id }, data: member });
    }
  }
  console.log(`Seeded ${teamMembers.length} team members.`);

  // 7. Site Settings
  const settings = [
    { key: "site_name", value: "Jazeera Nexus Innovation Center (JANIC)", group: "general" },
    { key: "site_tagline", value: "Innovating Technology. Empowering the Future.", group: "general" },
    { key: "portal_notice", value: "Official Innovation Hub of the Faculty of Computer Science & IT", group: "general" },
    { key: "institution_name", value: "Jazeera University", group: "general" },
    { key: "faculty_name", value: "Faculty of Computer Science & IT", group: "general" },
    { key: "contact_email", value: "info@janic.edu.so", group: "contact" },
    { key: "contact_phone", value: "+252 61 555 1234", group: "contact" },
    { key: "campus_address", value: "Jazeera University Main Campus, KM4, Mogadishu, Somalia", group: "contact" },
    { key: "founded_date", value: "October 25, 2021", group: "institutional" },
    { key: "linkedin_url", value: "https://linkedin.com/school/jazeera-university", group: "social" },
    { key: "github_url", value: "https://github.com/janic-innovation", group: "social" },
    { key: "twitter_url", value: "", group: "social" },
    { key: "facebook_url", value: "", group: "social" },
    { key: "hero_title", value: "Innovating Technology. Empowering the Future.", group: "hero" },
    { key: "hero_subtitle", value: "The leading institutional hub for technological transformation, advanced research, and digital excellence.", group: "hero" },
    { key: "hero_image", value: "/images/janic-hero-lab.jpg", group: "hero" },
    { key: "hero_badge_value", value: "18+", group: "hero" },
    { key: "hero_badge_label", value: "STUDENT INNOVATION PROJECTS", group: "hero" },
    { key: "footer_tagline", value: "Technology • Innovation • Research • Training", group: "footer" },
    { key: "accreditation_badge", value: "Accredited Academic Innovation Lab", group: "footer" },
    { key: "nav_links", value: "", group: "navigation" },
    { key: "maintenance_mode", value: "false", group: "system" },
    { key: "allow_registrations", value: "true", group: "system" },
    { key: "allow_submissions", value: "true", group: "system" },
    { key: "allow_contact_form", value: "true", group: "system" },
    { key: "featured_count", value: "3", group: "system" },
    {
      key: "role_permissions",
      value: JSON.stringify({
        ADMIN: ["manage_users", "manage_settings", "edit_content", "publish_content", "delete_content", "review_submissions", "manage_media", "manage_team"],
        EDITOR: ["edit_content", "publish_content", "review_submissions", "manage_media"],
        STAFF: ["review_submissions"],
      }),
      group: "permissions",
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }
  console.log("Seeded site settings.");

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
