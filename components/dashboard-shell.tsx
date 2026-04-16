import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  section: string;
  icon: string;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", section: "Visión general", icon: "DA" },
    { href: "/register/nutritionist", label: "Alta nutricionista", section: "Accesos", icon: "NU" },
    { href: "/", label: "Inicio", section: "Accesos", icon: "IN" },
  ],
  nutritionist: [
    { href: "/nutritionist", label: "Dashboard", section: "Visión general", icon: "DA" },
    { href: "/register/client", label: "Alta cliente", section: "Accesos", icon: "AL" },
    { href: "/", label: "Inicio", section: "Accesos", icon: "IN" },
  ],
  client: [
    { href: "/client", label: "Dashboard", section: "Mi progreso", icon: "DA" },
    { href: "/", label: "Inicio", section: "Accesos", icon: "IN" },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administración",
  nutritionist: "Nutricionista",
  client: "Cliente",
};

function groupNavItems(items: NavItem[]) {
  return items.reduce<Record<string, NavItem[]>>((acc, item) => {
    acc[item.section] ??= [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

type DashboardShellProps = {
  role: UserRole;
  activeHref: string;
  workspaceLabel: string;
  pageTitle: string;
  pageDescription: string;
  profileName: string;
  profileSubtext: string;
  topBadges?: ReactNode;
  heroMetrics?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  role,
  activeHref,
  workspaceLabel,
  pageTitle,
  pageDescription,
  profileName,
  profileSubtext,
  topBadges,
  heroMetrics,
  children,
}: DashboardShellProps) {
  const grouped = groupNavItems(NAV_ITEMS[role]);

  return (
    <main>
      <div className="dashboardLayout">
        <aside className="sidebar">
          <div className="sidebarStack">
            <div className="sidebarHeader">
              <div className="logoMark">NF</div>
              <div>
                <div className="sidebarTitle">NexoForma</div>
                <div className="sidebarSubtitle">{ROLE_LABEL[role]}</div>
              </div>
            </div>

            {Object.entries(grouped).map(([section, items]) => (
              <div className="sidebarSection" key={section}>
                <p className="sidebarLabel">{section}</p>
                <nav className="sidebarNav">
                  {items.map((item) => (
                    <Link
                      key={`${section}-${item.label}`}
                      className={`sidebarLink ${item.href === activeHref ? "active" : ""}`}
                      href={item.href}
                    >
                      <span className="sidebarIcon">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            ))}

            <div className="sidebarFooter">
              <div className="infoSurface">
                <p className="sidebarLabel" style={{ padding: 0, marginBottom: 8 }}>
                  Preferencias
                </p>
                <div className="stack" style={{ gap: 10 }}>
                  <ThemeToggle />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="mainSurface">
          <header className="headerSurface">
            <div className="headerLead">
              <div className="workspaceChip">{workspaceLabel}</div>
              <div>
                <h1 className="pageTitle">{pageTitle}</h1>
                <p className="subtitle">{pageDescription}</p>
              </div>
            </div>
            <div className="headerTools">
              {topBadges}
              <div className="infoSurface" style={{ minWidth: 220 }}>
                <div className="stack" style={{ gap: 4 }}>
                  <strong>{profileName}</strong>
                  <span className="metaText">{profileSubtext}</span>
                </div>
              </div>
            </div>
          </header>

          {heroMetrics ? <section className="dashboardHero stack">{heroMetrics}</section> : null}

          <div className="pageWrap">
            <div className="dashboardSection">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
