import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ROLE_TO_PATH, type UserRole } from "@/lib/roles";

export interface RoleAwareUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt: string | null;
}

export async function getUserWithRole(): Promise<RoleAwareUser> {
  "use cache: private";
  cacheLife("seconds");

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,email,role,created_at,first_name,last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "unknown",
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role as UserRole,
    createdAt: profile.created_at,
  };
}

export async function requireRole(roles: UserRole[]): Promise<RoleAwareUser> {
  const user = await getUserWithRole();

  if (!roles.includes(user.role)) {
    redirect(ROLE_TO_PATH[user.role]);
  }

  return user;
}

export function redirectToRoleDashboard(role: UserRole) {
  redirect(ROLE_TO_PATH[role]);
}

