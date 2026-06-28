import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Briefcase, LayoutDashboard, FileUp, User, Users, LogOut, Menu, X, Bell } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => { setOpenMobile(false); }, [pathname]);

  const items = role === "hr"
    ? [
        { to: "/hr", icon: Users, label: "Employees" },
        { to: "/dashboard", icon: LayoutDashboard, label: "My Dashboard" },
        { to: "/profile", icon: User, label: "Profile" },
      ]
    : [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/documents", icon: FileUp, label: "Documents" },
        { to: "/profile", icon: User, label: "Profile" },
      ];

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name,email,status").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: notifs } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", search: { tab: "login" }, replace: true });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground"><Briefcase className="h-5 w-5" /></div>
        <span className="font-bold text-sidebar-foreground">OnboardPro</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <Link key={it.to} to={it.to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{profile?.full_name || user?.email}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{role === "hr" ? "HR Admin" : "Employee"}</p>
        </div>
        <Button onClick={handleSignOut} variant="ghost" className="mt-2 w-full justify-start gap-2 text-sidebar-foreground"><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>
    </aside>
  );

  const unread = notifs?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">{Sidebar}</div>
      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpenMobile(false)} />
          <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpenMobile((v) => !v)}>
              {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="text-sm text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{profile?.full_name?.split(" ")[0] || "there"}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell count={unread} items={notifs ?? []} />
            {profile?.status && (
              <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-flex ${profile.status === "approved" ? "bg-success/10 text-success" : profile.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning-foreground"}`}>
                {profile.status}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 animate-in fade-in duration-300">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell({ count, items }: { count: number; items: Array<{ id: string; message: string; created_at: string; read: boolean }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} className="relative">
        <Bell className="h-5 w-5" />
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{count}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-popover p-2 shadow-card">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Notifications</div>
          {items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No notifications yet.</div>}
          {items.map((n) => (
            <div key={n.id} className="rounded-md px-2 py-2 text-sm hover:bg-accent">
              <p>{n.message}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
