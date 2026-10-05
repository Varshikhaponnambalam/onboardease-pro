import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEPARTMENTS = ["Engineering", "Product", "Design", "Sales", "Marketing", "Human Resources", "Finance", "Operations"];
const DESIGNATIONS = ["Intern", "Associate", "Engineer", "Senior Engineer", "Lead", "Manager", "Director", "VP"];

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) === "register" ? "register" : "login" }),
  head: () => ({ meta: [
    { title: "Sign in or register — OnboardPro" },
    { name: "description", content: "Sign in to OnboardPro or create an employee account to manage your onboarding." },
    { property: "og:title", content: "Sign in or register — OnboardPro" },
    { property: "og:description", content: "Access your employee onboarding account or create a new one." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().email(),
  mobile: z.string().trim().min(7).max(20),
  dob: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().trim().min(5).max(300),
  department: z.string().min(1),
  designation: z.string().min(1),
  password: z.string().min(6, "Min 6 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function AuthPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "hr" ? "/hr" : "/dashboard" });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-brand p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur"><Briefcase className="h-5 w-5" /></div>
          <span className="text-xl font-bold">OnboardPro</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Welcome to your<br />onboarding journey.</h2>
          <p className="mt-4 max-w-md text-primary-foreground/85">Register, upload documents, and track your verification — all in one place.</p>
        </div>
        <div className="text-sm text-primary-foreground/70">© {new Date().getFullYear()} OnboardPro</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground"><Briefcase className="h-5 w-5" /></div>
            <span className="text-xl font-bold">OnboardPro</span>
          </div>
          <Tabs value={tab} onValueChange={(v) => navigate({ to: "/auth", search: { tab: v as "login" | "register" } })}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="register"><RegisterForm onDone={() => navigate({ to: "/auth", search: { tab: "login" } })} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      let result;
      try {
        result = await supabase.auth.signInWithPassword(form);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await supabase.auth.signInWithPassword(form);
      }
      if (result.error) toast.error(result.error.message);
      else toast.success("Signed in");
    } catch {
      toast.error("Unable to connect right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <h3 className="text-lg font-semibold">Welcome back</h3>
        <p className="text-sm text-muted-foreground">Sign in to continue your onboarding.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" autoComplete="email" />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</Button>
      <p className="text-center text-xs text-muted-foreground">HR admin? Use <span className="font-mono">hr@onboardpro.app</span> / <span className="font-mono">Hr@12345</span></p>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "", dob: "", gender: "" as "male" | "female" | "other" | "",
    address: "", department: "", designation: "", password: "", confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name, mobile: form.mobile, dob: form.dob,
          gender: form.gender, address: form.address,
          department: form.department, designation: form.designation,
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Please sign in.");
    onDone();
  }

  const field = (k: keyof typeof form) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <h3 className="text-lg font-semibold">Create your account</h3>
        <p className="text-sm text-muted-foreground">Tell us about yourself to begin onboarding.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" />
          {field("full_name")}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" />
          {field("email")}
        </div>
        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+1 555 010 0199" />
          {field("mobile")}
        </div>
        <div className="space-y-2">
          <Label>Date of birth</Label>
          <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          {field("dob")}
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => set("gender", v as "male" | "female" | "other")}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {field("gender")}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Address</Label>
          <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} />
          {field("address")}
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={form.department} onValueChange={(v) => set("department", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          {field("department")}
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <Select value={form.designation} onValueChange={(v) => set("designation", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          {field("designation")}
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
          {field("password")}
        </div>
        <div className="space-y-2">
          <Label>Confirm password</Label>
          <Input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
          {field("confirm")}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account</Button>
    </form>
  );
}
