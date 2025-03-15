import { clerkClient } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { setRole, deleteUser, refreshUserList } from "./actions";
import { SearchUsers } from "./_components/SearchUsers";
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
  Users,
  Trash2
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
import { RefreshButton } from "./_components/RefreshButton";
import { UserRoleCell } from "./_components/UserRoleCell";
import { DeleteUserButton } from "./_components/DeleteUserButton";

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
      {/* User Avatar in top right */}
      <div className="flex justify-end mb-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>
              Manage user roles and permissions across the platform
            </CardDescription>
          </div>
          <RefreshButton />
        </CardHeader>
        <CardContent>
          <SearchUsers />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <Badge variant="outline" className="font-normal">
              {users.length} {users.length === 1 ? 'user' : 'users'} found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading users...</div>}>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Delete</TableHead>
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
                    
                    // Extract the role from user's public metadata
                    const userRole = user.publicMetadata.role as string | undefined;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {userName}
                        </TableCell>
                        <TableCell>{userEmail || 'No email'}</TableCell>
                        <TableCell>
                          <UserRoleCell userId={user.id} userRole={userRole} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteUserButton userId={user.id} userName={userName} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableCaption>
                  {users.length === 0 ? 'No users found. Try a different search query.' : 'All users with their assigned roles in the system.'}
                </TableCaption>
              </Table>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}