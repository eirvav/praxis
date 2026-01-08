'use server';

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const currentUser = await requireRole(["admin"]);

  if (currentUser.id === userId && role !== "admin") {
    throw new Error("You cannot change your own role.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("users").update({ role }).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

