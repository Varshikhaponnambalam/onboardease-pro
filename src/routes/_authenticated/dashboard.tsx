import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, FileUp, User as UserIcon, Briefcase, Clock, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [p, d] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("documents").select("*").eq("user_id", user!.id),
      ]);
      return { profile: p.data, docs: d.data ?? [] };
    },
  });

  if (isLoading || !data?.profile) {
    return <div className="p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const hasResume = data.docs.some((d) => d.doc_type === "resume");
  const hasId = data.docs.some((d) => d.doc_type === "identity_proof");
  const status = data.profile.status;

  const steps = [
    { label: "Account registered", done: true },
    { label: "Profile created", done: true },
    { label: "Resume uploaded", done: hasResume },
    { label: "Identity proof uploaded", done: hasId },
    { label: "HR verification", done: status === "approved" || status === "rejected", current: hasResume && hasId && status === "pending" },
    { label: "Onboarding complete", done: status === "approved" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {data.profile.full_name?.split(" ")[0] || "there"} 👋</h1>
        <p className="text-sm text-muted-foreground">Track your onboarding progress and complete the remaining steps.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserIcon} label="Status" value={status} tone={status === "approved" ? "success" : status === "rejected" ? "destructive" : "warning"} />
        <StatCard icon={Briefcase} label="Department" value={data.profile.department || "—"} />
        <StatCard icon={FileUp} label="Documents" value={`${data.docs.length} / 2`} />
        <StatCard icon={ShieldCheck} label="Designation" value={data.profile.designation || "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Onboarding progress</h2>
            <span className="text-sm font-medium text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
          <ol className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : s.current ? <Clock className="h-5 w-5 shrink-0 animate-pulse text-warning" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />}
                <span className={`text-sm ${s.done ? "text-foreground" : s.current ? "font-medium text-foreground" : "text-muted-foreground"}`}>Step {i + 1}: {s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Quick actions</h3>
            <div className="mt-4 space-y-2">
              <Link to="/documents"><Button className="w-full justify-start gap-2" variant={hasResume && hasId ? "outline" : "default"}><FileUp className="h-4 w-4" /> {hasResume && hasId ? "Manage documents" : "Upload documents"}</Button></Link>
              <Link to="/profile"><Button className="w-full justify-start gap-2" variant="outline"><UserIcon className="h-4 w-4" /> Edit profile</Button></Link>
            </div>
          </div>

          {status === "approved" && (
            <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" /> Approved</div>
              <p className="mt-2 text-foreground/80">HR has approved your onboarding. Welcome aboard!</p>
            </div>
          )}
          {status === "rejected" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold text-destructive"><XCircle className="h-5 w-5" /> Rejected</div>
              <p className="mt-2 text-foreground/80">{data.profile.hr_remarks || "Please contact HR for details."}</p>
            </div>
          )}
          {status === "pending" && hasResume && hasId && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold text-warning-foreground"><Clock className="h-5 w-5" /> Awaiting HR review</div>
              <p className="mt-2 text-foreground/80">Your documents have been submitted. HR will get back to you shortly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "success" | "destructive" | "warning" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning-foreground" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className={`mt-2 text-xl font-bold capitalize ${toneCls}`}>{value}</div>
    </div>
  );
}
