export type UserRole = "admin" | "teacher" | "student";

export const ROLE_TO_PATH: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

