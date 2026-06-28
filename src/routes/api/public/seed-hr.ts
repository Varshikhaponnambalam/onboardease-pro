import { createFileRoute } from "@tanstack/react-router";

// Idempotent HR seed. Creates hr@onboardpro.app / Hr@12345 with role 'hr' if no HR exists.
// Safe to call repeatedly; once an HR exists it returns { ok: true, existed: true }.
export const Route = createFileRoute("/api/public/seed-hr")({
  server: {
    handlers: {
      POST: async () => seed(),
      GET: async () => seed(),
    },
  },
});

async function seed() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error: cErr } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "hr");
  if (cErr) return json({ error: cErr.message }, 500);
  if ((count ?? 0) > 0) return json({ ok: true, existed: true });

  const email = "hr@onboardpro.app";
  const password = "Hr@12345";

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: "HR Admin", department: "Human Resources", designation: "Manager" },
  });
  if (createErr || !created?.user) return json({ error: createErr?.message ?? "create failed" }, 500);

  // Promote to HR
  await supabaseAdmin.from("user_roles").upsert({ user_id: created.user.id, role: "hr" });
  await supabaseAdmin.from("profiles").update({ status: "approved", full_name: "HR Admin", department: "Human Resources", designation: "Manager" }).eq("id", created.user.id);

  return json({ ok: true, created: true, email });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
