import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/members", label: "Mitglieder" },
  { href: "/admin/bookings", label: "Buchungen" },
  { href: "/admin/courts", label: "Plätze" },
  { href: "/admin/vorschlaege", label: "Vorschläge" },
  { href: "/admin/audit", label: "Protokoll" }
];

export function AdminNav() {
  return (
    <nav className="admin-nav card" aria-label="Admin Navigation">
      {adminLinks.map((link) => (
        <Link key={link.href} className="admin-nav-link" href={link.href}>{link.label}</Link>
      ))}
    </nav>
  );
}
