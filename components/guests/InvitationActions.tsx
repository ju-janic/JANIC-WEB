"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitationActionsProps {
  qrDataUrl: string | null;
  filename: string;
  tone?: "admin" | "public";
  /** DOM id of the invitation card to capture for the full-invitation download. */
  targetId?: string;
}

/** Print + download controls for a digital invitation (guest & admin views). */
export function InvitationActions({
  qrDataUrl,
  filename,
  tone = "admin",
  targetId,
}: InvitationActionsProps) {
  const [busy, setBusy] = useState(false);

  const base =
    tone === "public"
      ? "border-[#C9A24B]/60 bg-white text-[#08245C] hover:bg-[#FBF4E4]"
      : "border-border bg-card text-foreground hover:bg-muted";

  const downloadInvitation = async () => {
    if (!targetId) return;
    const node = document.getElementById(targetId);
    if (!node) {
      toast.error("The invitation could not be captured. Please try again.");
      return;
    }

    setBusy(true);
    toast.loading("Preparing your invitation…", { id: "invitation-download" });
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#FFFDF9",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `JANIC-Invitation-${filename}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invitation downloaded.", { id: "invitation-download" });
    } catch (error) {
      console.error("[invitation] download failed", error);
      toast.error("Could not download the invitation. Try printing to PDF instead.", {
        id: "invitation-download",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition",
          base
        )}
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>

      {targetId && (
        <button
          type="button"
          onClick={downloadInvitation}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#C9A24B] to-[#B8892B] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Invitation
        </button>
      )}
    </div>
  );
}
