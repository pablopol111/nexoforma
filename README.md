# NexoForma

Proyecto Next.js + TypeScript + Supabase alineado con la arquitectura nueva de NexoForma.

## Variables de entorno

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Puesta en marcha

```bash
npm install
npm run dev
```

## Base de datos

1. Ejecuta `supabase/schema.sql`
2. Crea en Authentication:
   - `admin@nexoforma.local`
   - `nutri.demo@nexoforma.local`
   - `cliente.demo@nexoforma.local`
3. Ejecuta `supabase/seed_admin.sql`
4. Ejecuta `supabase/seed_demo.sql`

## Usuarios demo

- Admin: `admin@nexoforma.local` y la contraseña que le pongas
- Nutricionista: usuario `nutricionista` y contraseña `nutri10`
- Cliente: usuario `clientecliente` y contraseña `cliente11`

## Estado de esta entrega

Esta versión deja el proyecto alineado con la base de datos final, el registro único por token, el login por usuario y la demo sembrada. La parte de siluetas corporales queda preparada con placeholder visual para evolucionar hacia una representación más realista en la siguiente iteración.
