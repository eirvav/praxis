import { clerkClient } from "@clerk/nextjs/server";
import { setRole, deleteUser, refreshUserList } from "./actions";
import { SearchUsers } from "./SearchUsers";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ShieldAlert, 
  GraduationCap, 
  Trash2, 
  RefreshCw 
} from "lucide-react";
import { User } from "@clerk/nextjs/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Suspense } from "react";

// Type for search params that need to be awaited
interface SearchParams {
  search?: string;
}

export default async function Admin({
  searchParams: rawSearchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  // Properly await searchParams before accessing properties
  const searchParams = await Promise.resolve(rawSearchParams);
  const client = await clerkClient();
  
  // Now we can safely access search after awaiting searchParams
  const searchQuery = searchParams?.search;
  
  let users: User[] = [];
  try {
    users = searchQuery 
      ? (await client.users.getUserList({ query: searchQuery })).data 
      : (await client.users.getUserList()).data;

    // If a search query is provided, perform additional filtering
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      users = users.filter(user => {
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const email = user.emailAddresses.find(
          (email) => email.id === user.primaryEmailAddressId
        )?.emailAddress?.toLowerCase() || '';
        
        return firstName.includes(searchLower) || 
               lastName.includes(searchLower) || 
               fullName.includes(searchLower) || 
               email.includes(searchLower);
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    users = [];
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>
              Manage user roles and permissions across the platform
            </CardDescription>
          </div>
          <form action={refreshUserList}>
            <Button 
              type="submit" 
              variant="outline" 
              size="icon"
              title="Refresh user list"
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <SearchUsers />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            User Management
          </CardTitle>
          <CardDescription>
            {users.length} {users.length === 1 ? 'user' : 'users'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading users...</div>}>
            <Table>
              <TableCaption>A list of all users in the system.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userEmail = user.emailAddresses.find(
                    (email) => email.id === user.primaryEmailAddressId
                  )?.emailAddress;
                  
                  let userName = 'Unnamed User';
                  if (user.firstName && user.lastName) {
                    userName = `${user.firstName} ${user.lastName}`;
                  } else if (user.firstName) {
                    userName = user.firstName;
                  } else if (user.lastName) {
                    userName = user.lastName;
                  } else if (userEmail) {
                    userName = userEmail.split('@')[0];
                  }
                  
                  // Get role for badge styling
                  const role = user.publicMetadata.role as string | undefined;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {userName}
                      </TableCell>
                      <TableCell>{userEmail || 'No email'}</TableCell>
                      <TableCell>
                        {role ? (
                          <Badge 
                            variant="default"
                            className={`capitalize ${
                              role === "admin" 
                                ? "bg-purple-500 hover:bg-purple-600" 
                                : role === "teacher" 
                                  ? "bg-blue-500 hover:bg-blue-600" 
                                  : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {role}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No role</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <form action={setRole}>
                            <input type="hidden" value={user.id} name="id" />
                            <input type="hidden" value="admin" name="role" />
                            <Button 
                              type="submit" 
                              size="sm" 
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                              Admin
                            </Button>
                          </form>

                          <form action={setRole}>
                            <input type="hidden" value={user.id} name="id" />
                            <input type="hidden" value="teacher" name="role" />
                            <Button 
                              type="submit" 
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                              Teacher
                            </Button>
                          </form>
                          
                          <form action={setRole}>
                            <input type="hidden" value={user.id} name="id" />
                            <input type="hidden" value="student" name="role" />
                            <Button 
                              type="submit" 
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <GraduationCap className="h-3.5 w-3.5 text-green-500" />
                              Student
                            </Button>
                          </form>
                          
                          {/* Delete user with confirmation dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                type="button" 
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {userName}? This action cannot be undone 
                                  and will permanently remove the user from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={deleteUser}>
                                  <input type="hidden" value={user.id} name="id" />
                                  <AlertDialogAction asChild>
                                    <Button 
                                      type="submit" 
                                      variant="destructive"
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}