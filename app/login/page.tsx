import Link from 'next/link';
import { LoginForm } from '@/components/login-form';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ blocked?: string }> }) {
  const params = await searchParams;
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
            <h1>Iniciar sesión</h1>
            <p>NexoForma, donde empieza el camino. Sigue tu evolución con claridad y constancia.</p>
          </div>
          {params.blocked ? <p className="error">Tu acceso está temporalmente bloqueado.</p> : null}
          <LoginForm />
          <Link href="/register" className="textLink">Registrarse</Link>
        </section>
      </div>
    </main>
  );
}
