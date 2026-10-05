import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Eye, CheckCircle2, XCircle, Trash2, FileText, IdCard, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({ meta: [
    { title: "HR onboarding review — OnboardPro" },
    { name: "description", content: "Review employee onboarding profiles, submitted documents, and approval status." },
    { property: "og:title", content: "HR onboarding review — OnboardPro" },
    { property: "og:description", content: "Review employee onboarding profiles and approval status." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: HrPage,
});

type Profile = {
  id: string; full_name: string; email: string; mobile: string | null;
  department: string | null; designation: string | null;
  status: "pending" | "approved" | "rejected"; hr_remarks: string | null;
  created_at: string;
};

function HrPage() {
  const { role, loading } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Profile | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["hr-employees"],
    enabled: role === "hr",
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter((e) => e.full_name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
  }, [employees, q]);

  if (loading) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (role !== "hr") {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h2 className="mt-3 text-lg font-semibold">HR access required</h2>
        <p className="mt-1 text-sm text-muted-foreground">This area is restricted to HR admins.</p>
      </div>
    );
  }

  async function approve(id: string, name: string) {
    const { error } = await supabase.from("profiles").update({ status: "approved", hr_remarks: null }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({ user_id: id, message: "HR approved your onboarding 🎉", kind: "success" });
    toast.success(`Approved ${name}`);
    qc.invalidateQueries({ queryKey: ["hr-employees"] });
  }

  async function confirmReject() {
    if (!rejectingId) return;
    const { error } = await supabase.from("profiles").update({ status: "rejected", hr_remarks: rejectRemarks || "Onboarding rejected." }).eq("id", rejectingId);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({ user_id: rejectingId, message: `HR rejected your onboarding: ${rejectRemarks || "see HR for details"}`, kind: "error" });
    toast.success("Employee rejected");
    setRejectingId(null); setRejectRemarks("");
    qc.invalidateQueries({ queryKey: ["hr-employees"] });
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("profiles").delete().eq("id", deleteId);
    if (error) return toast.error(error.message);
    toast.success("Employee record deleted");
    setDeleteId(null);
    qc.invalidateQueries({ queryKey: ["hr-employees"] });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">Review and verify employee onboarding submissions.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Pending" count={employees.filter((e) => e.status === "pending").length} tone="warning" />
          <Stat label="Approved" count={employees.filter((e) => e.status === "approved").length} tone="success" />
          <Stat label="Rejected" count={employees.filter((e) => e.status === "rejected").length} tone="destructive" />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{e.full_name || "(no name)"}</div>
                      <div className="text-xs text-muted-foreground">{e.email}</div>
                    </td>
                    <td className="px-4 py-3">{e.department || "—"}</td>
                    <td className="px-4 py-3">{e.designation || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(e)} title="View"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => approve(e.id, e.full_name)} title="Approve" disabled={e.status === "approved"}><CheckCircle2 className="h-4 w-4 text-success" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setRejectingId(e.id)} title="Reject" disabled={e.status === "rejected"}><XCircle className="h-4 w-4 text-destructive" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(e.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeDialog profile={viewing} onClose={() => setViewing(null)} />

      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject onboarding</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Add remarks for the employee (optional but recommended).</p>
            <Textarea rows={4} placeholder="Reason for rejection…" value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee record?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the profile and all uploaded documents. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmployeeDialog({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const [docs, setDocs] = useState<Array<{ doc_type: string; identity_kind: string | null; file_path: string; file_name: string }>>([]);
  useEffect(() => {
    if (!profile) return;
    supabase.from("documents").select("doc_type,identity_kind,file_path,file_name").eq("user_id", profile.id).then(({ data }) => setDocs(data ?? []));
  }, [profile]);

  async function open(path: string) {
    const { data } = await supabase.storage.from("employee-documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (!profile) return null;
  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{profile.full_name}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Email" value={profile.email} />
          <Field label="Mobile" value={profile.mobile || "—"} />
          <Field label="Department" value={profile.department || "—"} />
          <Field label="Designation" value={profile.designation || "—"} />
          <Field label="Status" value={profile.status} className="capitalize" />
          <Field label="Registered" value={new Date(profile.created_at).toLocaleDateString()} />
          {profile.hr_remarks && <div className="sm:col-span-2"><Field label="HR remarks" value={profile.hr_remarks} /></div>}
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold">Documents</h4>
          <div className="mt-2 space-y-2">
            {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
            {docs.map((d) => (
              <div key={d.file_path} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3">
                {d.doc_type === "resume" ? <FileText className="h-4 w-4 text-primary" /> : <IdCard className="h-4 w-4 text-primary" />}
                <div className="flex-1 text-sm">
                  <p className="font-medium capitalize">{d.doc_type.replace("_", " ")}{d.identity_kind ? ` · ${d.identity_kind}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{d.file_name}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => open(d.file_path)} className="gap-1"><Eye className="h-3.5 w-3.5" /> View</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-medium ${className ?? ""}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cls = status === "approved" ? "bg-success/10 text-success" : status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>{status}</span>;
}

function Stat({ label, count, tone }: { label: string; count: number; tone: "success" | "destructive" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-warning-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2 shadow-soft">
      <p className={`text-lg font-bold ${cls}`}>{count}</p>
      <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
