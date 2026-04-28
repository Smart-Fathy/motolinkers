import "./admin.css";

// This thin outer layout exists so the admin CSS is loaded for both
// /admin/login (no chrome) and the protected pages (with sidebar). The
// auth check + sidebar live in (protected)/layout.tsx so the login
// page can sit outside that group.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
