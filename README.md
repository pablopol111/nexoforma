# NexoForma

Proyecto base de **NexoForma** con arquitectura nueva sobre **Next.js + TypeScript + Supabase**, usando **App Router**, **middleware** y separación de clientes Supabase para navegador, servidor y middleware.

## Incluye

- Next.js + TypeScript
- Supabase
- Middleware para refresco de sesión
- Login por **usuario + contraseña**
- Registro de nutricionista con **token de acceso**
- Roles base: `admin`, `nutritionist`, `client`

## Estructura principal

```text
app/
  api/register/nutritionist/route.ts
  admin/page.tsx
  client/page.tsx
  login/page.tsx
  nutritionist/page.tsx
  page.tsx
  register/nutritionist/page.tsx
lib/
  auth.ts
  supabase/
    client.ts
    middleware.ts
    server.ts
supabase/
  schema.sql
  seed_test_token.sql
middleware.ts
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Variables necesarias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Preparación en Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en el editor SQL.
3. Ejecuta `supabase/seed_test_token.sql` para insertar un token de prueba.
4. Verifica que las claves del proyecto estén en `.env.local`.

## Instalación

```bash
npm install
npm run dev
```

## Flujo actual

### 1. Registro de nutricionista
Ruta: `/register/nutritionist`

Campos:
- Nombre completo
- Usuario
- Contraseña
- Token de acceso

El sistema:
- valida el token
- crea un usuario en Supabase Auth usando un correo técnico interno basado en el usuario
- crea el perfil en `profiles`
- marca el token como usado

### 2. Login
Ruta: `/login`

El usuario inicia sesión con:
- usuario
- contraseña

Internamente se transforma el usuario a un correo técnico interno, para no depender de un correo real.

### 3. Redirección por rol
Después del login:
- `admin` → `/admin`
- `nutritionist` → `/nutritionist`
- `client` → `/client`

## Nota importante sobre contraseñas

No se está usando MD5. La contraseña queda gestionada por **Supabase Auth**, que aplica un esquema seguro de almacenamiento y verificación. Esto es preferible a guardar contraseñas con MD5.

## Qué falta si quieres seguir evolucionándolo

- Alta de clientes desde panel admin
- Generación de tokens desde panel admin
- Gestión real de agendas, planes o seguimientos
- Diseño visual corporativo
- Tests y validaciones más profundas
- Confirmación por correo si más adelante decides usar email real


## Primer usuario administrador

Esta base no crea automáticamente un administrador. Para probar `/admin`, puedes crear un usuario desde Supabase Auth y después insertar su perfil manualmente en `profiles` con rol `admin`.

Ejemplo:

```sql
insert into public.profiles (id, username, full_name, role)
values ('UUID_DEL_USUARIO_AUTH', 'admin', 'Administrador', 'admin');
```
