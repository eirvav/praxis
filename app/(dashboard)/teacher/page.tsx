import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserWithRole } from "@/lib/auth";

const UPCOMING_LESSONS = [
  { title: "Algebra II", date: "Mon, 09:00", status: "Needs slides" },
  { title: "Physics Lab", date: "Tue, 11:30", status: "Confirm materials" },
  { title: "History Seminar", date: "Wed, 14:00", status: "Send reading list" },
];

const STUDENT_FLAGS = [
  { name: "Casey Diaz", note: "Falling behind on homework" },
  { name: "Imani Lee", note: "Absent last class" },
];

export default async function TeacherPage() {
  const user = await getUserWithRole();
  const greetingName = user.firstName ?? user.email;

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {greetingName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Here is a quick overview of your teaching schedule.</p>
          <p>
            Use the admin dashboard to approve new teachers or promote students when ready.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {UPCOMING_LESSONS.map((lesson) => (
              <div key={lesson.title} className="rounded-lg border p-3">
                <p className="font-medium">{lesson.title}</p>
                <p className="text-sm text-muted-foreground">{lesson.date}</p>
                <p className="text-sm text-primary">{lesson.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Students to check on</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {STUDENT_FLAGS.map((student) => (
              <div key={student.name} className="rounded-lg border p-3">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

