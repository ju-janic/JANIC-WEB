import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SettingService } from "@/services/settings/setting.service";
import { requireAuth } from "@/lib/permissions/roles";
import { revalidatePath } from "next/cache";

const settingsUpdateSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      group: z.string().optional(),
    })
  ),
});

export async function GET() {
  try {
    const settings = await SettingService.getAll();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching settings";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(null, "settings:update");
    const body = await req.json();
    const parsed = settingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const updated = await SettingService.updateMany(parsed.data.settings);
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/about");
    return NextResponse.json({ success: true, items: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating settings";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
