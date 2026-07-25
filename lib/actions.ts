"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getDemoClinician } from "@/lib/queries";
import { SESSION_COOKIE, isValidAccessCode, sessionTokenForCode } from "@/lib/auth";

export async function submitAccessCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/doctor");

  if (!isValidAccessCode(code)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionTokenForCode(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(next.startsWith("/") ? next : "/doctor");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function reviewAlert(alertId: string, action: "call_patient" | "bring_in" | "escalate_911" | "none") {
  const supabase = supabaseServer();
  const clinician = await getDemoClinician();

  const { error } = await supabase
    .from("alerts")
    .update({
      reviewed_by: clinician.id,
      reviewed_at: new Date().toISOString(),
      action_taken: action,
    })
    .eq("id", alertId);

  if (error) throw error;

  revalidatePath("/doctor", "layout");
}
