# NexoForma 1.3

NexoForma usa Next.js, TypeScript y Supabase.

## Variables

Crea `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_BOOTSTRAP_TOKEN=
```

## Instalación

```bash
npm install
npm run dev
```

## Supabase

1. Ejecuta `supabase/schema.sql`
2. Crea un usuario en Authentication con email `admin@nexoforma.local`
3. Ejecuta `supabase/seed_admin.sql`
4. Ejecuta `supabase/seed_test_nutritionist_token.sql`

## Flujo

### Admin

- Entra con usuario `admin`
- Genera tokens de nutricionista

### Registro nutricionista

- Abre `/register`
- Usa un token `nutritionist_invite`
- Añade clínica
- Inicia sesión

### Registro cliente

- El nutricionista genera un token de cliente
- El cliente abre `/register`
- Usa el token `client_invite`
- Inicia sesión

### Cliente

- Edita perfil
- Guarda altura, peso de referencia y peso objetivo
- Registra fecha, peso y pasos
- Consulta la evolución

### Nutricionista

- Ve su cartera de clientes
- Abre cada perfil
- Consulta progreso e histórico

## Estructura

- `/login`
- `/register`
- `/admin`
- `/nutritionist`
- `/nutritionist/clients/[clientId]`
- `/client`
