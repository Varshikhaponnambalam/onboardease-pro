import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, ShieldCheck, FileCheck2, Users, ArrowRight, Sparkles, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OnboardPro — Automated Employee Onboarding" },
      { name: "description", content: "Register, upload documents, get HR verified — a complete onboarding workflow that gets new hires productive on day one." },
      { property: "og:title", content: "OnboardPro — Automated Employee Onboarding" },
      { property: "og:description", content: "Register, upload documents, get HR verified, and prepare every new hire for day one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground shadow-soft">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">OnboardPro</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
            <a href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-foreground">Workflow</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ tab: "login" }}><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth" search={{ tab: "register" } as never}><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary shadow-soft">
                <Sparkles className="h-3 w-3" /> Welcome to the future of onboarding
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Onboarding, <span className="bg-gradient-brand bg-clip-text text-transparent">automated end-to-end.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Register new hires, collect their documents, track verification progress, and let HR approve — all in one elegant workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" search={{ tab: "register" } as never}>
                  <Button size="lg" className="gap-2">Get Started <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <a href="#features"><Button size="lg" variant="outline">Learn more</Button></a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Secure storage</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 5-minute setup</div>
              </div>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Your onboarding progress</div>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">On track</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Account registered", done: true },
                    { label: "Profile complete", done: true },
                    { label: "Resume uploaded", done: true },
                    { label: "Identity proof uploaded", done: true },
                    { label: "HR verification", done: false },
                    { label: "Onboarding complete", done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${s.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                      <div className={`flex-1 text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                      {s.done && <FileCheck2 className="h-4 w-4 text-success" />}
                    </div>
                  ))}
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-gradient-brand" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">67% complete · awaiting HR review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything new hires need</h2>
          <p className="mt-3 text-muted-foreground">A complete workflow from registration to day-one ready.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, title: "Self-serve registration", desc: "Employees create their own profile with personal and job details." },
            { icon: FileCheck2, title: "Document uploads", desc: "Drag-and-drop resume and identity proof with validation." },
            { icon: BarChart3, title: "Progress tracking", desc: "Visual progress bar at every step of the onboarding journey." },
            { icon: ShieldCheck, title: "HR verification", desc: "HR reviews and approves with optional remarks for rejection." },
            { icon: Briefcase, title: "Profile management", desc: "Employees can update personal information any time." },
            { icon: Sparkles, title: "Smart notifications", desc: "Stay informed with toast updates and dashboard alerts." },
          ].map((f, i) => (
            <div key={i} className="group rounded-xl border border-border bg-card p-6 transition hover:shadow-card hover:-translate-y-1">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A simple 6-step workflow</h2>
            <p className="mt-3 text-muted-foreground">Every new hire follows the same predictable, automated path.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {["Register", "Login", "Resume", "ID Proof", "HR Verify", "Complete"].map((step, i) => (
              <div key={i} className="relative rounded-xl border border-border bg-card p-5 text-center shadow-soft">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">{i + 1}</div>
                <div className="font-medium">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-gradient-brand p-10 text-center text-primary-foreground shadow-card sm:p-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to onboard your team?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">Create your account and start your onboarding journey in under two minutes.</p>
          <div className="mt-8">
            <Link to="/auth" search={{ tab: "register" } as never}>
              <Button size="lg" variant="secondary" className="gap-2">Get Started <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground"><Briefcase className="h-5 w-5" /></div>
              <span className="font-bold">OnboardPro</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Automated employee onboarding for modern teams.</p>
          </div>
          <div>
            <h4 className="font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>hello@onboardpro.app</li>
              <li>+1 (555) 010-0199</li>
              <li>Mon – Fri · 9am – 6pm</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Quick links</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#workflow" className="hover:text-foreground">Workflow</a></li>
              <li><Link to="/auth" search={{ tab: "login" }} className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} OnboardPro. All rights reserved.</div>
      </footer>
    </div>
  );
}
