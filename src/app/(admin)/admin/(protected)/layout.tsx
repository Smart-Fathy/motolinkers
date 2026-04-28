import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "../Sidebar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defence in depth — middleware already redirects, but if it's ever
  // bypassed we still catch it here.
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="adm">
      <Sidebar email={user.email ?? null} />
      <main className="adm__main">{children}</main>
    </div>
  );
}
