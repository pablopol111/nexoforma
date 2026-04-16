import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  return (
    <main className="authPage">
      <div className="authWrap narrow">
        <div className="authTopbar">
          <Link href="/" className="brandLockup cleanLink">
            <div className="logoMark">NF</div>
            <div>
              <strong>NexoForma</strong>
              <span>donde empieza el cambio</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
        <section className="authCard stack">
          <div className="stack introText compact">
            <h1>Crear cuenta</h1>
            <p>Tu token marcará el camino.</p>
          </div>
          <RegisterForm />
          <Link href="/login" className="textLink">Ya tengo cuenta</Link>
        </section>
      </div>
    </main>
  );
}