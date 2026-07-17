import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { generateAvatarSvg } from "@/lib/avatar";
import { Sidebar } from "@/components/sidebar";
import { SidebarToggleButton } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarMenu } from "@/components/avatar-menu";
import { formatDate } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const avatarSvg = generateAvatarSvg(session.user.username);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="vibrancy flex h-[52px] items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <SidebarToggleButton />
            <span className="data-mono text-sm text-text-secondary">{formatDate(new Date())}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AvatarMenu avatarSvg={avatarSvg} name={session.user.name ?? ""} role={session.user.role} />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
