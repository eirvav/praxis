import { redirect } from "next/navigation";

import { getUserWithRole } from "@/lib/auth";
import { ROLE_TO_PATH } from "@/lib/roles";

export default async function ProtectedPage() {
  const user = await getUserWithRole();

  redirect(ROLE_TO_PATH[user.role]);
}
