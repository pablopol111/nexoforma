# NexoForma 1.2.0

Proyecto de **NexoForma** en **Next.js + TypeScript + Supabase**, preparado para trabajar sobre la arquitectura nueva y con una capa visual más cercana a un dashboard profesional.

## Qué cambia en esta versión

- interfaz inspirada en dashboard profesional con **sidebar**, bloques de resumen y mejor jerarquía visual
- **modo oscuro** y **modo claro** con conmutador persistente
- login con selección visible de perfil: **nutricionista**, **cliente** y acceso admin opcional
- panel **cliente** más cuidado, con gráfica reescalable y lectura mucho más clara del progreso
- panel **nutricionista** con cartera de clientes, estado de invitaciones y alta de cliente más visible
- panel **admin** con visión general de tokens y nutricionistas registrados
- base técnica mantenida sobre **Supabase Auth**, con login visible por `username + password` y resolución interna `username -> email`

## Qué incluye

- login visible con **usuario + contraseña**
- resolución interna **username -> email**
- registro de **nutricionista** con token
- registro de **cliente** con token
- panel **admin** para generar tokens de nutricionista
- panel **nutricionista** para generar tokens de cliente
- panel **cliente** con gráfica reescalable y lectura de progreso
- `middleware.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `supabase/schema.sql`
- `supabase/seed_admin.sql`
- `supabase/seed_test_nutritionist_token.sql`

## Variables de entorno

Crea `.env.local` a partir de `.env.example`.

```bash
cp .env.example .env.local
```

Rellena estas variables con las tuyas de Supabase:

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

### 1. Ejecutar el esquema

Abre **Supabase > SQL Editor** y ejecuta por completo:

- `supabase/schema.sql`

Con esto quedan listas las tablas:

- `profiles`
- `nutritionists`
- `clients`
- `client_profiles`
- `entries`
- `access_tokens`

Detalles importantes del esquema:

- `profiles` incluye `username`, `email`, `full_name` y `role`
- `access_tokens.status` usa `available`, `used`, `revoked`
- `access_tokens.token_type` usa `nutritionist_invite` y `client_invite`

### 2. Crear el usuario admin en Auth

Ve a:

- **Authentication > Users > Add user**

Crea un usuario con email y contraseña, por ejemplo:

- email: `admin@nexoforma.local`
- contraseña: la que quieras

### 3. Ejecutar `seed_admin.sql`

Abre `supabase/seed_admin.sql`, ajusta email, username y nombre si quieres, y ejecútalo en **SQL Editor**.

Con eso se inserta o actualiza la fila del admin en `profiles` con:

- `role = 'admin'`

### 4. Crear un token de prueba para nutricionista

Ejecuta:

- `supabase/seed_test_nutritionist_token.sql`

Esto deja creado el token:

- `NEXO-NUTRI-TEST-001`

## Flujo de prueba completo

### A. Entrar como admin

1. abre `/login`
2. pulsa **Mostrar acceso admin**
3. selecciona **Acceso admin**
4. entra con:
   - username configurado en `seed_admin.sql`
   - contraseña del usuario creado en Auth

### B. Generar token de nutricionista

En `/admin`:

- genera un token nuevo
- o usa `NEXO-NUTRI-TEST-001`

### C. Registrar nutricionista

En `/register/nutritionist` rellena:

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
- el token pasa a `used`

### D. Entrar como nutricionista

En `/login` selecciona **Soy nutricionista** y usa:

- username del nutricionista
- contraseña del nutricionista

### E. Generar token de cliente

Desde `/nutritionist` genera un token de cliente.

Qué hace el sistema:

- crea un registro en `access_tokens`
- usa `token_type = 'client_invite'`
- asocia `created_by_user_id` y `assigned_to_nutritionist` al nutricionista actual

### F. Registrar cliente

En `/register/client` rellena:

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
- el token pasa a `used`

### G. Entrar como cliente

En `/login` selecciona **Soy cliente** y usa:

- username del cliente
- contraseña del cliente

Después entrarás en `/client`, donde ya verás:

- tarjetas de resumen
- gráfica con escala dinámica o desde cero
- histórico de entradas
- panel de estado del seguimiento

## Qué subir a GitHub

Sube **todo el contenido del proyecto** excepto:

- `.env.local`
- `.next`
- `node_modules`

Si ya tienes el repo creado, sustituye los archivos del proyecto pero **sin borrar `.git`**.

## Notas

- el sistema usa **Supabase Auth**; no utiliza MD5
- la preferencia de tema oscuro o claro es independiente y no afecta a la lógica de negocio
- esta versión no reutiliza la aplicación antigua basada en `localStorage`
