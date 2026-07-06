import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { SidebarToggleButton } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="vibrancy flex h-[52px] items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <SidebarToggleButton />
            <span className="data-mono text-sm text-text-secondary">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Jakarta",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-text-secondary">
              {session.user.name}{" "}
              <span className="data-mono text-xs text-text-tertiary">
                ({session.user.role})
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-primary hover:border-border-strong">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
