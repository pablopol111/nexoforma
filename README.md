# NexoForma 1.0.1

Proyecto limpio de **NexoForma** construido con **Next.js + TypeScript + Supabase**, sin reutilizar la aplicación vieja basada en `localStorage`.

## Cambios incluidos en esta versión

- recuperación de una línea visual más elegante y consistente
- login que pregunta si el acceso es de **nutricionista** o **cliente**
- acceso de administración como opción secundaria dentro del login
- validación del rol seleccionado antes de redirigir
- corrección del `middleware` para evitar el error con `claims`
- panel de cliente con **gráfica reescalable** por rango de valores
- selector de métrica y selector de escala en la gráfica

## Qué incluye

- login visible con **usuario + contraseña**
- resolución interna **username -> email**
- registro de **nutricionista** con token
- registro de **cliente** con token
- panel **admin** para generar tokens de nutricionista
- panel **nutricionista** para generar tokens de cliente
- panel **cliente** con gráfico de progreso
- `middleware.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `supabase/schema.sql`
- `supabase/seed_admin.sql`
- `supabase/seed_test_nutritionist_token.sql`

## Stack

- Next.js
- TypeScript
- Supabase Auth
- Supabase Postgres

## Variables de entorno

Crea tu `.env.local` a partir de `.env.example`.

```bash
cp .env.example .env.local
```

Rellena estas variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_BOOTSTRAP_TOKEN=
```

No subas `.env.local` a GitHub.

## Instalación local

```bash
npm install
npm run dev
```

## Preparación de Supabase

### 1) Ejecutar el esquema

Abre **Supabase > SQL Editor** y ejecuta por completo:

- `supabase/schema.sql`

Esto crea:

- `profiles`
- `nutritionists`
- `clients`
- `client_profiles`
- `entries`
- `access_tokens`

Puntos importantes del esquema:

- `profiles` contiene `username`, `email`, `full_name` y `role`
- `access_tokens.status` usa: `available`, `used`, `revoked`
- `access_tokens.token_type` usa: `nutritionist_invite`, `client_invite`

### 2) Crear el usuario admin en Auth

Ve a:

- **Authentication > Users > Add user**

Crea un usuario con email y contraseña, por ejemplo:

- email: `admin@nexoforma.local`
- contraseña: la que quieras

Todavía no será admin hasta ejecutar el siguiente script.

### 3) Ejecutar `seed_admin.sql`

Abre `supabase/seed_admin.sql` y cambia estos valores si quieres:

- email
- username
- full_name

Después ejecuta el archivo en **Supabase > SQL Editor**.

Con eso se insertará o actualizará la fila en `profiles` con:

- `role = 'admin'`

### 4) Crear un token de prueba para nutricionista

Ejecuta:

- `supabase/seed_test_nutritionist_token.sql`

Esto crea o reinicia el token:

- `NEXO-NUTRI-TEST-001`

## Flujo completo de prueba

### A. Login como admin

Entra en:

- `/login`

Pulsa **Acceso admin** y usa el `username` configurado en `seed_admin.sql` junto con la contraseña del usuario creado en **Authentication > Users**.

### B. Generar token de nutricionista

En el panel `/admin`:

- genera un token nuevo
- o usa `NEXO-NUTRI-TEST-001`

### C. Registrar nutricionista

Entra en:

- `/register/nutritionist`

Rellena:

- usuario
- nombre completo
- clínica
- email interno
- contraseña
- token

Qué debe pasar:

- se crea usuario en `auth.users`
- se crea perfil en `profiles`
- se crea fila en `nutritionists`
- el token queda en `used`

### D. Login como nutricionista

Entra en:

- `/login`

Selecciona **Soy nutricionista** y usa:

- username del nutricionista
- contraseña del nutricionista

En `/nutritionist` podrás generar tokens de cliente.

### E. Generar token de cliente

Desde `/nutritionist` genera un token de cliente.

Qué hace el sistema:

- crea `access_tokens.token_type = 'client_invite'`
- deja asociado `created_by_user_id` al nutricionista actual

### F. Registrar cliente

Entra en:

- `/register/client`

Rellena:

- usuario
- nombre completo
- email interno
- contraseña
- token de cliente

Qué debe pasar:

- se crea usuario en `auth.users`
- se crea perfil en `profiles`
- se crea fila en `clients`
- se crea fila en `client_profiles`
- el token queda en `used`

### G. Login como cliente

Entra en:

- `/login`

Selecciona **Soy cliente** y usa:

- username del cliente
- contraseña del cliente

Deberías entrar en `/client`.

### H. Probar la gráfica reescalable

Para ver bien la gráfica del cliente, inserta varias entradas en `entries` con pesos diferentes. La gráfica permite:

- cambiar entre **Peso** y **% grasa**
- usar **Escala dinámica** para ampliar visualmente cambios pequeños
- usar **Escala desde cero** para comparar contra una referencia más clásica

## Estructura principal

```text
app/
  api/
    admin/tokens/nutritionist/route.ts
    login/route.ts
    logout/route.ts
    nutritionist/tokens/client/route.ts
    register/client/route.ts
    register/nutritionist/route.ts
  admin/page.tsx
  client/page.tsx
  login/page.tsx
  nutritionist/page.tsx
  page.tsx
  register/client/page.tsx
  register/nutritionist/page.tsx
components/
  admin-token-form.tsx
  login-form.tsx
  logout-button.tsx
  nutritionist-token-form.tsx
  progress-chart.tsx
  register-client-form.tsx
  register-nutritionist-form.tsx
lib/
  supabase/
    admin.ts
    client.ts
    middleware.ts
    server.ts
  auth.ts
  constants.ts
  env.ts
  tokens.ts
  types.ts
  utils.ts
supabase/
  schema.sql
  seed_admin.sql
  seed_test_nutritionist_token.sql
middleware.ts
```

## Notas técnicas

- El usuario nunca mete el email para iniciar sesión. Solo **username + password**.
- El sistema resuelve el username contra `profiles.email` y autentica con Supabase Auth.
- No se usa MD5.
- Las contraseñas las gestiona Supabase Auth.
- Las operaciones sensibles del backend usan `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- La opción visible elegida en login no sustituye la validación del rol real en base de datos.

## Qué no subir

No subas a GitHub:

- `.env.local`
- `.next`
- `node_modules`

## Recomendación al actualizar desde una versión anterior

- sustituye el contenido del proyecto por esta versión
- conserva la carpeta `.git`
- revisa tu `.env.local`
- rota cualquier secreto que haya podido subirse por error al repositorio
