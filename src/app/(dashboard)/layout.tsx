import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
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
      <aside className="vibrancy hidden w-[220px] shrink-0 border-r border-border md:flex md:flex-col">
        <div className="px-6 py-5">
          <span className="text-[17px] font-semibold text-text-primary">RepairX</span>
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="vibrancy flex h-[52px] items-center justify-between border-b border-border px-6">
          <span className="data-mono text-sm text-text-secondary">
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })}
          </span>
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
