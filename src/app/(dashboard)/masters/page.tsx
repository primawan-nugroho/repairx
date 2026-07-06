import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AddUserButton } from "./add-user-dialog";
import { UsersTable } from "./users-table";

export default async function MastersPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">Masters</h1>
        <p className="text-sm text-text-secondary max-w-prose">
          Engine types, work centers (MWC), and UIC teams land here in a later phase.
          For now these are maintained as free text on orders and shift entries.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Users</h2>
          {isAdmin && <AddUserButton />}
        </div>

        {isAdmin ? (
          <UsersView currentUserId={Number(session!.user.id)} />
        ) : (
          <p className="text-sm text-text-secondary">
            Only admins can view and manage user accounts.
          </p>
        )}
      </div>
    </div>
  );
}

async function UsersView({ currentUserId }: { currentUserId: number }) {
  const rows = await db.select().from(users).orderBy(asc(users.username));
  return <UsersTable users={rows} currentUserId={currentUserId} />;
}
