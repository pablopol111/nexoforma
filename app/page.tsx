import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { ROLE_DASHBOARD } from "@/lib/constants";

export default async function HomePage() {
  const session = await getCurrentUserWithProfile();

  if (session) {
    redirect(ROLE_DASHBOARD[session.profile.role] ?? "/login");
  }

  return (
    <main className="authPage">
      <div className="authWrap">
        <div className="authTopbar">
          <div className="brandLockup">
            <div className="logoMark">NF</div>
            <div>
              <strong>NexoForma</strong>
              <span>donde empieza el cambio</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <section className="authCard hero">
          <div className="stack introText">
            <span className="eyebrow">NexoForma</span>
            <h1>Tu progreso, claro y cerca.</h1>
            <p>Una forma sencilla de registrar, seguir y avanzar cada día.</p>
          </div>
          <div className="authActionsRow">
            <Link className="primaryLink" href="/login">Iniciar sesión</Link>
            <Link className="secondaryLink" href="/register">Registrarse</Link>
          </div>
        </section>
      </div>
    </main>
  );
}