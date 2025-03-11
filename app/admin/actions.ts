"use server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Roles } from "@/types/globals";
import { revalidatePath } from "next/cache";

export async function setRole(formData: FormData) {
  const { sessionClaims } = await auth();

  // Check that the user trying to set the role is an admin
  if (sessionClaims?.metadata?.role !== "admin") {
    throw new Error("Not Authorized");
  }

  const client = await clerkClient();
  const id = formData.get("id") as string;
  const role = formData.get("role") as Roles;

  // Validate role to ensure it's one of the acceptable roles
  if (role !== "admin" && role !== "teacher" && role !== "student") {
    throw new Error("Invalid role specified");
  }

  try {
    await client.users.updateUser(id, {
      publicMetadata: { role },
    });
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to set role:", error);
    throw new Error("Failed to set role");
  }
}

export async function removeRole(formData: FormData) {
  const { sessionClaims } = await auth();

  if (sessionClaims?.metadata?.role !== "admin") {
    throw new Error("Not Authorized");
  }

  const client = await clerkClient();
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("User ID is required");
  }

  try {
    // Update user with null role in publicMetadata
    await client.users.updateUser(id, {
      publicMetadata: { role: null },
    });
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to remove role:", error);
    throw new Error("Failed to remove role");
  }
}

export async function deleteUser(formData: FormData): Promise<void> {
  const { sessionClaims } = await auth();

  // Only admin users can delete users
  if (sessionClaims?.metadata?.role !== "admin") {
    throw new Error("Not Authorized");
  }

  const client = await clerkClient();
  const userId = formData.get("id") as string;

  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Use the proper deleteUser method as per the Clerk documentation
    await client.users.deleteUser(userId);
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}

// Simple action to refresh the user list
export async function refreshUserList(): Promise<void> {
  const { sessionClaims } = await auth();

  // Only admin users can access this
  if (sessionClaims?.metadata?.role !== "admin") {
    throw new Error("Not Authorized");
  }

  // Force refresh of the user list by revalidating the admin path
  revalidatePath("/admin");
}