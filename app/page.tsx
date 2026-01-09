import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getUserWithRole } from "@/lib/auth";
import { ROLE_TO_PATH } from "@/lib/roles";

export default function Home() {
	return (
		<Suspense fallback={<RedirectFallback />}>
			<RoleRedirect />
		</Suspense>
	);
}

async function RoleRedirect() {
	const user = await getUserWithRole();

	redirect(ROLE_TO_PATH[user.role]);

	return null;
}

function RedirectFallback() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
			Checking your account...
		</div>
	);
}
