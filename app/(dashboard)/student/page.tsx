import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserWithRole } from "@/lib/auth";

const ASSIGNMENTS = [
  { course: "Algebra II", due: "Mon", status: "In progress" },
  { course: "Physics Lab", due: "Wed", status: "Not started" },
  { course: "History", due: "Fri", status: "Submitted" },
];

const RESOURCES = [
  { title: "Ask your teacher", description: "Schedule office hours or send a message." },
  { title: "Praxis Library", description: "Browse study guides curated by teachers." },
  { title: "Progress report", description: "See your grades and attendance in one place." },
];

export default async function StudentPage() {
  const user = await getUserWithRole();
  const greetingName = user.firstName ?? user.email;

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Hello, {greetingName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Welcome to your Praxis dashboard. Here are today&apos;s priorities.</p>
          <p>
            If you become a teacher, you will automatically gain access to the teacher workspace.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ASSIGNMENTS.map((assignment) => (
              <div key={assignment.course} className="rounded-lg border p-3">
                <p className="font-medium">{assignment.course}</p>
                <p className="text-sm text-muted-foreground">Due {assignment.due}</p>
                <p className="text-sm text-primary">{assignment.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {RESOURCES.map((resource) => (
              <div key={resource.title} className="rounded-lg border p-3">
                <p className="font-medium">{resource.title}</p>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}