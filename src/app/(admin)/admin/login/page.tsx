import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in — MotoLinkers Admin",
};

// Always render per-request so we can check the session and redirect
// already-signed-in users.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <div className="adm-login">
      <LoginForm />
    </div>
  );
}
