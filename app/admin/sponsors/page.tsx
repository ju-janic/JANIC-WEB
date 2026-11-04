import React from "react";
import { requireAuth } from "@/lib/permissions/roles";
import { SponsorService } from "@/services/sponsors/sponsor.service";
import { SponsorManager, type SponsorItem } from "@/components/admin/SponsorManager";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  let sponsors: SponsorItem[] = [];
  let loadError: string | null = null;

  try {
    await requireAuth(null, "partnerships:read");
    sponsors = await SponsorService.getAllAdmin({});
  } catch (err: unknown) {
    console.error("AdminSponsorsPage Error:", err);
    loadError = err instanceof Error ? err.message : String(err);
  }

  if (loadError) {
    return (
      <div className="p-8 text-center space-y-4 bg-card rounded-2xl border border-border shadow-sm max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-bold text-rose-600">Access or Data Error</h2>
        <p className="text-sm text-muted-foreground">Details: {loadError}</p>
        <p className="text-xs text-muted-foreground">
          If you are not logged in, please log in at <a href="/login" className="text-blue-600 underline">/login</a> with admin credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sponsors</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review sponsorship proposals, approve sponsors, and manage the approved sponsors shown on the
          public sponsors page.
        </p>
      </div>

      <SponsorManager initialSponsors={sponsors} />
    </div>
  );
}
