import { getUserWithRole } from "@/lib/auth";

export default async function StudentPage() {
  const user = await getUserWithRole();
  const greetingName = user.firstName ?? user.email;

  return (
    <section>
      <p>Hello {greetingName}, you are student</p>
    </section>
  );
}