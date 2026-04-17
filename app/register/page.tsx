import Link from 'next/link';
import { RegisterForm } from '@/components/register-form';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RegisterPage() {
  return (
    <main className="authPage">
      <div className="authWrap narrow">
        <div className="authTopbar">
          <Link href="/" className="brandLockup cleanLink">
            <div className="logoMark">NF</div>
            <div><strong>NexoForma</strong><span>donde empieza el camino</span></div>
          </Link>
          <ThemeToggle />
        </div>
        <section className="authCard stack">
          <div className="stack introText compact">
            <h1>Registrarse</h1>
            <p>Tu token abrirá el acceso correcto y marcará el camino dentro de la plataforma.</p>
          </div>
          <RegisterForm />
          <Link href="/login" className="textLink">Iniciar sesión</Link>
        </section>
      </div>
    </main>
  );
}
