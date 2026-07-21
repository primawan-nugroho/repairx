import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAllMastersForAdmin, getAllRepairPlannerMastersForAdmin } from "@/lib/masters";
import { AddUserButton } from "./add-user-dialog";
import { UsersTable } from "./users-table";
import { EngineTypesPanel, UicTeamsPanel, WorkCentersPanel } from "./master-data-panels";
import { NameListPanel } from "./name-list-panel";
import { createRpcPerson, updateRpcPerson, deleteRpcPerson, createEngineOwner, updateEngineOwner, deleteEngineOwner } from "./repair-planner-master-actions";

export default async function MastersPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">Masters</h1>
        <p className="text-sm text-text-secondary max-w-prose">
          Engine types, work centers (MWC), and UIC teams that drive the dropdowns and
          auto-derivation rules across the app. Deactivating a value keeps historical
          orders/entries displaying correctly — it just stops showing up for new ones.
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

      {isAdmin ? (
        <MasterDataView />
      ) : (
        <p className="text-sm text-text-secondary">
          Only admins can manage engine types, UIC teams, and work centers.
        </p>
      )}
    </div>
  );
}

async function UsersView({ currentUserId }: { currentUserId: number }) {
  const rows = await db.select().from(users).orderBy(asc(users.username));
  return <UsersTable users={rows} currentUserId={currentUserId} />;
}

async function MasterDataView() {
  const { engineTypes, uicTeams, workCenters } = await getAllMastersForAdmin();
  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Engine types</h2>
        <EngineTypesPanel rows={engineTypes} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">UIC teams</h2>
        <UicTeamsPanel rows={uicTeams} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Work centers (MWC)</h2>
        <WorkCentersPanel rows={workCenters} uicTeams={uicTeams} />
      </div>

      <RepairPlannerMastersView />
    </>
  );
}

async function RepairPlannerMastersView() {
  const { rpcPeople, engineOwners } = await getAllRepairPlannerMastersForAdmin();
  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">RPC (repair production control)</h2>
        <p className="-mt-2 text-xs text-text-tertiary">Assignable to the Repair Planner&rsquo;s RPC-1 and RPC-2 fields.</p>
        <NameListPanel
          rows={rpcPeople}
          addPlaceholder="New RPC name, e.g. DENNY"
          onCreate={createRpcPerson}
          onUpdate={updateRpcPerson}
          onDelete={deleteRpcPerson}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Engine owners (EO)</h2>
        <NameListPanel
          rows={engineOwners}
          addPlaceholder="New EO name, e.g. ADITYA"
          onCreate={createEngineOwner}
          onUpdate={updateEngineOwner}
          onDelete={deleteEngineOwner}
        />
      </div>
    </>
  );
}
