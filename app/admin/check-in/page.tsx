import React from "react";
import { GuestCheckInWorkspace } from "@/components/guests/GuestCheckInWorkspace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guest Check-in",
  robots: { index: false, follow: false },
};

export default async function AdminGuestCheckInPage() {
  return <GuestCheckInWorkspace />;
}
