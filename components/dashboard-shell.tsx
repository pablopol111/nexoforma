import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Panel" },
    { href: "/login", label: "Acceso" },
  ],
  nutritionist: [
    { href: "/nutritionist", label: "Panel" },
    { href: "/register", label: "Registro" },
  ],
  client: [{ href: "/client", label: "Panel" }],
};

type DashboardShellProps = {
  role: UserRole;
  activeHref: string;
  pageTitle: string;
  pageDescription: string;
  profileName: string;
  profileSubtext: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  role,
  activeHref,
  pageTitle,
  pageDescription,
  profileName,
  profileSubtext,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="logoMark">NF</div>
          <div>
            <strong>NexoForma</strong>
            <span>{role === "admin" ? "Admin" : role === "nutritionist" ? "Nutrición" : "Cliente"}</span>
          </div>
        </div>
        <nav className="sidebarNav">
          {NAV_ITEMS[role].map((item) => (
            <Link key={item.href} href={item.href} className={`sidebarLink ${activeHref === item.href ? "active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebarFoot">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>
      <div className="appContent">
        <header className="topbar">
          <div>
            <h1 className="pageTitle">{pageTitle}</h1>
            <p className="pageSubtitle">{pageDescription}</p>
          </div>
          <div className="topbarMeta">
            {actions}
            <div className="userCard compact">
              <strong>{profileName}</strong>
              <span>{profileSubtext}</span>
            </div>
          </div>
        </header>
        <section className="pageBody">{children}</section>
      </div>
    </main>
  );
}