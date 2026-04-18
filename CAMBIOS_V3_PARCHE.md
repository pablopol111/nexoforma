# NexoForma v3 - parche de cierre

## Qué se ha corregido en esta versión

### Arranque y estructura
- Eliminada la ruta duplicada `app/nutritionist/clients/[id]` que chocaba con `app/nutritionist/clients/[clientId]`.
- Añadido `.nvmrc` con Node 20.
- Añadido `engines.node >= 20` en `package.json`.

### Utilidades
- Añadida `formatShortDate` en `lib/utils.ts`.
- Añadida `daysSinceDate` en `lib/utils.ts`.
- Añadida `isProfileCompleteForMeasurements` en `lib/utils.ts`.

### Dashboard cliente
- Integrado el calendario semanal real con detalle por día.
- Integrado el bloque corporal `Cuerpo` con referencia, actual y previsto.
- Sustituido el bloque provisional de siluetas.
- Reducido el tamaño visual de la gráfica de progreso.
- Añadido resumen inteligente más completo.
- Añadido aviso visible si pasan 3 días o más sin registrar.
- Añadida lógica visual de estado en tarjetas clave.
- Añadida comparativa radar de medidas contra una fecha anterior.
- Ampliado el histórico de medidas para incluir bíceps normal y bíceps en tensión.

## Antes de arrancar
1. Usa Node 20.
2. Crea `.env.local` a partir de `.env.example`.
3. Ejecuta `npm install`.
4. Arranca con `npm run dev`.

## Variables necesarias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_TOKEN`
