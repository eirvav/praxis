import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/lib/supabase/server";
import { columns, type AdminUserRow } from "./columns";

async function getUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,created_at,first_name,last_name")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AdminUserRow[];
}

export default async function AdminPage() {
  const users = await getUsers();

  return (
    <section className="space-y-6">

      <DataTable
        columns={columns}
        data={users}
        searchKey="email"
        placeholder="Search by email..."
      />
    </section>
  );
}

