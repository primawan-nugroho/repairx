import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { generateAvatarSvg } from "@/lib/avatar";
import { Sidebar } from "@/components/sidebar";
import { SidebarToggleButton } from "@/components/sidebar-toggle";
import { ToastProvider } from "@/components/toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const avatarSvg = generateAvatarSvg(session.user.username);

  return (
    <ToastProvider>
      {/* h-screen + overflow-hidden here, not min-h-screen: the sidebar (and its
          footer — theme toggle, account menu) must stay pinned to the viewport
          regardless of how tall a given page's content is. Only <main> below
          scrolls internally; the sidebar and mobile strip don't move with it. */}
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar
          name={session.user.name ?? ""}
          role={session.user.role}
          username={session.user.username}
          avatarSvg={avatarSvg}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Desktop has no top header (theme toggle + user live in the sidebar
              footer instead) — this strip only exists to keep the mobile drawer
              reachable, since the sidebar itself is off-canvas below md. */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5 md:hidden">
            <SidebarToggleButton />
            <span className="text-[15px] font-semibold text-text-primary">RepairX</span>
          </div>

          <main className="flex-1 overflow-y-auto p-3 md:p-4">
            <div className="min-h-full rounded-xl border border-border p-5 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
