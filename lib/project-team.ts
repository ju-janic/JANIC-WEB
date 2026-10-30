import type { TeamMember } from "@prisma/client";

export interface ProjectTeamMember {
  name: string;
  role: string | null;
}

export interface EnrichedProjectTeamMember extends ProjectTeamMember {
  profile: TeamMember | undefined;
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/^(eng\.?|dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseProjectTeam(teamMembers?: string | null): ProjectTeamMember[] {
  if (!teamMembers) return [];

  return teamMembers
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.+?)\s*(?:\((.+?)\))?$/);
      return {
        name: match?.[1]?.trim() ?? entry,
        role: match?.[2]?.trim() ?? null,
      };
    });
}

export function enrichProjectTeam(
  teamMembers: ProjectTeamMember[],
  profiles: TeamMember[]
): EnrichedProjectTeamMember[] {
  return teamMembers.map((member) => {
    const canonical = normalizeName(member.name);

    const profile = profiles.find((candidate) => {
      const candidateName = normalizeName(candidate.name);
      return (
        candidateName === canonical ||
        candidateName.includes(canonical) ||
        canonical.includes(candidateName)
      );
    });

    return {
      ...member,
      role: member.role ?? profile?.role ?? null,
      profile,
    };
  });
}

// Maps project order/slug to the official JIT group designation
export function getGroupMeta(order: number, title: string): { label: string; type: "group" | "individual" } {
  const t = title.toLowerCase();
  if (order === 1 || t.includes("maal hub")) return { label: "GROUP ONE", type: "group" };
  if (order === 2 || t.includes("luxrest")) return { label: "GROUP TWO", type: "group" };
  if (order === 3 || t.includes("badbaado")) return { label: "GROUP THREE", type: "group" };
  if (order === 4 || t.includes("robot car")) return { label: "GROUP FOUR", type: "group" };
  if (order === 5 || t.includes("student file")) return { label: "GROUP FIVE", type: "group" };
  if (order === 6 || t.includes("video editing") || t.includes("documentary")) return { label: "GROUP SIX", type: "group" };
  if (order === 7 || t.includes("smart dust")) return { label: "GROUP SEVEN", type: "group" };
  if (order === 8 || t.includes("bluetooth") || t.includes("home automation")) return { label: "GROUP EIGHT", type: "group" };
  if (order === 9 || t.includes("child") || t.includes("activity tracking")) return { label: "GROUP NINE", type: "group" };
  if (order === 10 || t.includes("janic web")) return { label: "GROUP TEN", type: "group" };
  return { label: "INDIVIDUAL", type: "individual" };
}
