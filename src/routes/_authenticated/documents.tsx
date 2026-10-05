import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { FileText, IdCard, Upload, X, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [
    { title: "Onboarding documents — OnboardPro" },
    { name: "description", content: "Upload and manage the documents needed to complete your employee onboarding." },
    { property: "og:title", content: "Onboarding documents — OnboardPro" },
    { property: "og:description", content: "Upload and manage your employee onboarding documents." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DocsPage,
});

const MAX_SIZE = 5 * 1024 * 1024;
const RESUME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ID_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

type DocRow = {
  id: string; user_id: string; doc_type: "resume" | "identity_proof";
  identity_kind: string | null; file_path: string; file_name: string;
  file_size: number; mime_type: string; uploaded_at: string;
};

function DocsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase.from("documents").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data as DocRow[];
    },
  });

  const resume = docs.find((d) => d.doc_type === "resume");
  const identity = docs.find((d) => d.doc_type === "identity_proof");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload your documents</h1>
        <p className="text-sm text-muted-foreground">Upload your resume and one identity proof to complete onboarding. Max 5 MB per file.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <DocCard
            title="Resume"
            description="PDF or DOC/DOCX, max 5 MB."
            icon={FileText}
            docType="resume"
            allowedTypes={RESUME_TYPES}
            accept=".pdf,.doc,.docx"
            existing={resume}
            onChange={() => qc.invalidateQueries({ queryKey: ["documents", user?.id] })}
          />
          <DocCard
            title="Identity Proof"
            description="Aadhaar, PAN, Passport, or Driving License. PDF/JPG/PNG, max 5 MB."
            icon={IdCard}
            docType="identity_proof"
            allowedTypes={ID_TYPES}
            accept=".pdf,.jpg,.jpeg,.png"
            existing={identity}
            requireKind
            onChange={() => qc.invalidateQueries({ queryKey: ["documents", user?.id] })}
          />
        </div>
      )}
    </div>
  );
}

function DocCard(props: {
  title: string; description: string; icon: React.ComponentType<{ className?: string }>;
  docType: "resume" | "identity_proof"; allowedTypes: string[]; accept: string;
  existing?: DocRow; requireKind?: boolean; onChange: () => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [identityKind, setIdentityKind] = useState<string>(props.existing?.identity_kind ?? "");
  const Icon = props.icon;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files[0] || !user) return;
    const file = files[0];
    if (!props.allowedTypes.includes(file.type)) { toast.error("Unsupported file type"); return; }
    if (file.size > MAX_SIZE) { toast.error("File exceeds 5 MB"); return; }
    if (props.requireKind && !identityKind) { toast.error("Please select the ID type first"); return; }

    setBusy(true); setProgress(10);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${props.docType}/${Date.now()}.${ext}`;

    if (props.existing) {
      await supabase.storage.from("employee-documents").remove([props.existing.file_path]);
    }
    setProgress(40);
    const { error: upErr } = await supabase.storage.from("employee-documents").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setBusy(false); setProgress(0); toast.error(upErr.message); return; }
    setProgress(75);

    const row = {
      user_id: user.id, doc_type: props.docType,
      identity_kind: props.requireKind ? identityKind as "aadhaar"|"pan"|"passport"|"driving_license" : null,
      file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
    };
    const { error: dbErr } = await supabase.from("documents").upsert(row, { onConflict: "user_id,doc_type" });
    if (dbErr) { setBusy(false); setProgress(0); toast.error(dbErr.message); return; }

    await supabase.from("notifications").insert({
      user_id: user.id,
      message: `${props.docType === "resume" ? "Resume" : "Identity proof"} uploaded successfully.`,
      kind: "success",
    });
    setProgress(100);
    setTimeout(() => { setBusy(false); setProgress(0); }, 400);
    toast.success(`${props.title} uploaded`);
    props.onChange();
  }, [user, props, identityKind]);

  async function handleDelete() {
    if (!props.existing) return;
    await supabase.storage.from("employee-documents").remove([props.existing.file_path]);
    await supabase.from("documents").delete().eq("id", props.existing.id);
    toast.success(`${props.title} deleted`);
    props.onChange();
  }

  async function handlePreview() {
    if (!props.existing) return;
    const { data, error } = await supabase.storage.from("employee-documents").createSignedUrl(props.existing.file_path, 60);
    if (error || !data) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold">{props.title}</h3>
            <p className="text-xs text-muted-foreground">{props.description}</p>
          </div>
        </div>
        {props.existing && <CheckCircle2 className="h-5 w-5 text-success" />}
      </div>

      {props.requireKind && (
        <div className="mt-4 space-y-2">
          <Label>ID type</Label>
          <Select value={identityKind} onValueChange={setIdentityKind}>
            <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
              <SelectItem value="pan">PAN Card</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="driving_license">Driving License</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
      >
        <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drag & drop or click to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">{props.accept.split(",").join(" / ")} · up to 5 MB</p>
        <input ref={inputRef} type="file" accept={props.accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {busy && (
        <div className="mt-3">
          <Progress value={progress} className="h-1.5" />
          <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      {props.existing && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-3">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{props.existing.file_name}</p>
            <p className="text-xs text-muted-foreground">{(props.existing.file_size / 1024).toFixed(1)} KB · uploaded {new Date(props.existing.uploaded_at).toLocaleDateString()}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={handlePreview}><Eye className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={handleDelete}><X className="h-4 w-4 text-destructive" /></Button>
        </div>
      )}
    </div>
  );
}
