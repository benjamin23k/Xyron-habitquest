# Configurar Supabase para XYRON

## 1. Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Elegí nombre, contraseña de base de datos y región. Esperá a que termine de aprovisionarse (~2 min).

## 2. Correr el schema

1. En el proyecto, andá a **SQL Editor** → **New query**.
2. Pegá el contenido completo de `supabase/schema.sql` (de este repo) y ejecutalo.
3. Verificá en **Table Editor** que aparezcan: `profiles`, `stats`, `missions`, `user_missions`, `coin_transactions`, y que `missions` tenga 6 filas ya cargadas (las misiones diarias del sistema).

Si necesitás volver a correrlo desde cero, borrá las tablas (`drop table ... cascade`) y las funciones (`drop function ...`) antes de re-ejecutar — el script no está pensado para correr dos veces sobre los mismos datos.

## 2.1. Migraciones posteriores

Cualquier cambio al schema después de la instalación inicial vive en `supabase/migrations/`, numerado (`0002_...`, `0003_...`). Corré cada uno **una sola vez**, en orden, pegándolo en el SQL Editor — a diferencia de `schema.sql`, están escritos para aplicarse sobre una base que ya tiene datos reales (usan `ALTER TABLE`, nunca `DROP`).

Ahora mismo hay que correr:

- **`supabase/migrations/0002_dynamic_attributes.sql`** — convierte `stats` en atributos dinámicos (agrega `description`, `icon`, `is_default`, `in_radar`; marca los 6 atributos base existentes; actualiza permisos para poder crear/editar/borrar atributos propios sin poder tocar `value` ni `is_default`). No borra ningún atributo ni progreso existente.
- **`supabase/migrations/0003_phosphor_icon_keys.sql`** — reescribe el `icon` de los 6 atributos base (emoji → nombre de componente de Phosphor, ej. `'💪' → 'Barbell'`) y actualiza el trigger de alta para que las cuentas nuevas siembren esas mismas claves. Los atributos personalizados creados antes de esta migración conservan su emoji viejo — el frontend lo sigue renderizando vía fallback, sin necesidad de tocarlos.
- **`supabase/migrations/0004_progression_foundation.sql`** — Fase 1 del sistema de progresión RPG: agrega `xp_transactions` (ledger auditable de XP, mismo patrón que `coin_transactions`), `achievements`/`user_achievements` (mueve los logros de `localStorage` a Supabase, con desbloqueo server-validado vía la función `sync_progression()`), `titles`/`user_titles` + la columna `profiles.active_title_id`, y dos tablas vacías (`skills`/`user_skills`) que quedan listas para el Skill Tree de una fase futura. También reemplaza `complete_mission()` por una versión que además inserta en `xp_transactions` (mismo comportamiento de siempre, un insert más). No borra achievements ni progreso existente: al iniciar sesión, el cliente llama `sync_progression()` una vez y cualquier logro que el usuario ya venía cumpliendo (según su progreso real en la base) se desbloquea solo, sin depender de lo que hubiera guardado antes en `localStorage`.

## 3. Variables de entorno

1. En el dashboard de Supabase: **Project Settings → API**.
2. Copiá **Project URL** y **anon public key** (¡nunca la `service_role`!).
3. En la carpeta `app/`, creá `.env.local` (ya está en `.gitignore`) a partir de `.env.example`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

4. Reiniciá `npm run dev`.

## 4. Confirmación de email (opcional para probar más rápido)

Por defecto Supabase exige confirmar el email antes de dar sesión. Para probar rápido en desarrollo:
**Authentication → Providers → Email → "Confirm email"** → desactivalo temporalmente. Volvé a activarlo antes de producción.

## 5. Login con Google

1. En [Google Cloud Console](https://console.cloud.google.com/) → creá (o elegí) un proyecto → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Tipo de aplicación: **Web application**.
3. En **Authorized redirect URIs** agregá exactamente la URL de callback que te muestra Supabase (paso siguiente) — tiene la forma:
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`
4. Guardá y copiá el **Client ID** y **Client Secret**.
5. En Supabase: **Authentication → Providers → Google** → activalo → pegá Client ID y Client Secret → **Save**.

## 6. Login con Facebook

1. En [Facebook for Developers](https://developers.facebook.com/) → **Mis apps → Crear app** → tipo "Consumidor" o "Ninguno" (alcanza con lo básico) → agregá el producto **Facebook Login**.
2. En **Facebook Login → Configuración**, en **Valid OAuth Redirect URIs** agregá la misma URL de callback de Supabase:
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`
3. En **Configuración básica** de la app, copiá **App ID** y **App Secret**.
4. En Supabase: **Authentication → Providers → Facebook** → activalo → pegá App ID y App Secret → **Save**.
5. Mientras la app de Facebook esté en modo desarrollo, solo van a poder loguearse los usuarios que agregues como "Testers/Developers" en el panel de Facebook — para producción hay que pasar la app por revisión de Facebook.

## 7. URLs de redirect de la app

En Supabase: **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:5173` en desarrollo (cambialo a tu dominio real al desplegar).
- **Redirect URLs**: agregá `http://localhost:5173/reset-password` (y el equivalente en tu dominio de producción) para que el link de "olvidé mi contraseña" funcione.

## 8. Checklist de prueba manual

Con el proyecto corriendo (`npm run dev`) y las env vars puestas:

- [ ] **Crear cuenta** (`/signup`) con email/contraseña → revisar que se cree la fila en `profiles` y las 6 filas en `stats` (Table Editor).
- [ ] **Cerrar sesión** y **volver a entrar** (`/login`) con las mismas credenciales.
- [ ] **Recargar la página estando logueado** → debe mantener la sesión sin pedir login de nuevo.
- [ ] **Olvidé mi contraseña** (`/forgot-password`) → revisar el email → el link debe llevar a `/reset-password` y permitir poner una nueva.
- [ ] **Google** y **Facebook**: botón de login → debe redirigir, volver autenticado, y crear el perfil igual que con email.
- [ ] **Completar una misión diaria** → confirmar en Table Editor: nueva fila en `user_missions`, `profiles.xp`/`coins` subieron, `stats.value` de la stat correspondiente subió, y hay una fila nueva en `coin_transactions`.
- [ ] **Intentar completar la misma misión diaria dos veces el mismo día** → la segunda vez debe fallar (el botón ya se deshabilita solo, pero también podés probarlo llamando el RPC dos veces seguidas desde el SQL Editor con `select complete_mission('<id>');`).
- [ ] **Crear una misión personalizada**, completarla, y confirmar que también respeta las recompensas fijas (no lo que mandaste en el formulario).
- [ ] **Verificar el candado anti-trampa**: desde el SQL Editor, logueado como ese usuario (`select auth.uid();` para confirmar), probar `update profiles set coins = 999999 where id = auth.uid();` — debería fallar con un error de permisos porque `coins` no está en el `GRANT UPDATE` del rol `authenticated`.

### Atributos dinámicos (después de correr `0002_dynamic_attributes.sql`)

- [ ] **Crear un atributo personalizado** (ej. "Filosofía", 🧠, máximo 10) desde "+ Nuevo atributo" → debe aparecer como tarjeta `CUSTOM` con valor `0/10`.
- [ ] **Crear una misión personalizada** asociada a ese atributo nuevo (el selector de "Atributo asociado" debe mostrarlo automáticamente, sin tocar código) y completarla → el atributo debe subir y aparecer "+N esta semana" en su tarjeta.
- [ ] **Editar** el atributo personalizado (cambiar nombre/ícono/descripción/máximo) → se refleja al instante.
- [ ] **Intentar bajar el máximo por debajo del progreso actual** → debe mostrar el error "El valor máximo no puede ser menor a tu progreso actual...", sin romper nada.
- [ ] **Eliminar** el atributo personalizado → pide confirmación, y al confirmar desaparece (y las misiones que lo referenciaban simplemente dejan de otorgar ese punto, sin error).
- [ ] **Confirmar que un atributo BASE (ej. Fuerza) no tiene botón de Eliminar**, y que llamar `delete from stats where name = 'Fuerza'` directo desde la API con el token del usuario devuelve error de RLS (la policy exige `is_default = false`).
- [ ] **Candado de `value`/`is_default`**: con el token del usuario, probar `PATCH /rest/v1/stats?id=eq.<id>` con `{"value": 999}` o `{"is_default": true}` → debe fallar con permiso denegado (esas columnas no están en el `GRANT UPDATE`).
- [ ] **Selector del radar**: tildar/destildar atributos hasta llegar a 8 → los checkboxes restantes deben deshabilitarse; el radar debe mostrar solo los tildados.

### Iconos Phosphor (después de correr `0003_phosphor_icon_keys.sql`)

- [ ] **Atributos base** (Fuerza, Inteligencia, Disciplina, Creatividad, Enfoque, Carisma) muestran su ícono Phosphor correspondiente en la tarjeta de atributo y en el resumen de Perfil.
- [ ] **Un atributo personalizado creado antes de esta migración** (con emoji viejo en `icon`) sigue mostrando su emoji sin romperse — confirma el fallback de `IconGlyph`.
- [ ] **Crear un atributo nuevo** desde el selector de íconos rediseñado (ahora con íconos Phosphor en vez de emoji) → se guarda la clave (ej. `"Brain"`) y se renderiza igual en la tarjeta.
- [ ] **Logros**: los 7 logros muestran su ícono Phosphor cuando están desbloqueados, y el ícono de candado (`Lock`) cuando están bloqueados.

### Progresión — Fase 1 (después de correr `0004_progression_foundation.sql`)

- [ ] **Al iniciar sesión**, si la cuenta ya calificaba para algún logro (p. ej. ya tenía nivel 5 o una racha de 3+ días de antes de esta migración), aparece un toast "Logro desbloqueado" apenas carga el dashboard — confirma que `sync_progression()` corre en el mount y no depende de lo que hubiera en `localStorage`.
- [ ] **Completar una misión** sigue funcionando exactamente igual que antes (XP/monedas/stat suben, toast de misión y de level-up si corresponde) y además, si esa misión hace que se cumpla un logro nuevo, aparece su toast justo después.
- [ ] **Recargar la página** después de desbloquear un logro → sigue apareciendo como desbloqueado en `/achievements` y en "Logros recientes" del perfil (a diferencia de antes, ya no depende de `localStorage`).
- [ ] **Logros ocultos** ("Leyenda de las misiones", "Inquebrantable", "Ícono"): mientras están bloqueados se muestran como "???" en la grilla; los logros no ocultos que siguen bloqueados muestran su nombre/descripción real con el ícono de candado.
- [ ] **Título**: al llegar a nivel 1 ya debería estar disponible "The Builder" — elegilo desde `/profile` y confirmá que se guarda (recargar la página lo mantiene) y aparece como `"The Builder"` bajo el nombre de usuario.
- [ ] **Candado de RLS en achievements/xp**: con el token del usuario, probar `POST /rest/v1/user_achievements` o `POST /rest/v1/xp_transactions` directo por API → debe fallar (no hay `GRANT INSERT` para `authenticated`, solo lo escribe `sync_progression()`/`complete_mission()` vía `SECURITY DEFINER`).
- [ ] **Candado de título ajeno**: probar `PATCH /rest/v1/profiles?id=eq.<mi-id>` con `{"active_title_id": "<uuid-de-un-título-no-desbloqueado>"}` → debe fallar por RLS (policy `profiles_update_own` exige que exista una fila en `user_titles` para ese título).

### Reinicio diario por zona horaria (después de correr `0005_timezone_aware_daily_reset.sql`)

Bug real encontrado probando la Fase 1: para cualquier cuenta que no esté en UTC, `complete_mission()` podía rechazar con "Misión ya completada" una misión que el botón todavía mostraba como disponible (el servidor y el navegador no coincidían en qué día era "hoy").

- [ ] **Cuenta existente (creada antes de esta migración)**: al cargar el dashboard, no hace falta hacer nada — `AppLayout` detecta que `timezone_offset_minutes` no coincide con la zona horaria real del navegador y la corrige sola en segundo plano.
- [ ] **Completar una misión diaria** que el botón muestra como disponible → ya no debería devolver "Misión ya completada" salvo que genuinamente ya la hayas completado hoy (en tu zona horaria real, no en UTC).
- [ ] **Cuenta nueva por email/contraseña**: revisar en Table Editor que `profiles.timezone_offset_minutes` del usuario recién creado coincida con `new Date().getTimezoneOffset()` de tu navegador (se manda como metadata del signup).

### Índice anti-duplicado (después de correr `0006_fix_daily_unique_constraint.sql`)

Segundo bug encontrado probando el fix anterior: para cualquier offset distinto de 0, quedaba una franja de varias horas por día donde el índice único (todavía en fecha UTC) rechazaba una misión que el chequeo de "¿ya completada hoy?" (ya corregido en 0005) había dejado pasar como un día nuevo.

- [ ] **Completar una misión diaria un día, y volver a completarla al día siguiente** (en tu zona horaria real) → debe funcionar sin "Misión ya completada", incluso si ambos completados caen en el mismo día calendario en UTC.
- [ ] **Intentar completar la misma misión diaria dos veces seguidas el mismo día** → la segunda debe seguir fallando con "Misión ya completada" (el candado anti-doble-clic sigue funcionando, solo cambió en qué fecha se basa).

### Fase 2 — Sistema de misiones (después de correr `0007_quest_system_upgrade.sql`)

- [ ] **Crear una misión nueva** con "+ Nueva misión" en `/missions`, eligiendo dificultad (Easy/Normal/Hard/Epic/Legendary), repetición (Diaria/Semanal/Mensual/Única vez/Challenge), atributo, categoría, fecha límite y minutos estimados → aparece en "Misiones personalizadas" con el badge de repetición y, si corresponde, los chips de tiempo estimado/fecha límite.
- [ ] **Verificar el XP/monedas según dificultad** (Easy +10 XP, Normal +25, Hard +50, Epic +100, Legendary +250; monedas ≈60% del XP) → confirmalo completando la misión y mirando el toast, o en `xp_transactions`/`coin_transactions`.
- [ ] **Las 6 misiones de sistema conservan su XP histórico** (15 XP c/u) — no deberían cambiar por esta migración.
- [ ] **Misión semanal**: completarla una vez → el botón pasa a "Completada esta semana" y sigue así aunque cambies de día (mientras sigas en la misma semana calendario). Repetir con una mensual → "Completada este mes".
- [ ] **Búsqueda y filtros** en `/missions`: escribir en el buscador, elegir una dificultad y una repetición → las listas se filtran en vivo; "Limpiar filtros" los resetea.
- [ ] **Candado de recompensas**: con el token del usuario, probar `POST /rest/v1/missions` con `{"owner_user_id": "<mi-id>", "title": "x", "stat": "Fuerza", "difficulty": "legendary", "xp_reward": 999999}` → la fila se crea (difficulty sí está permitida) pero `xp_reward` queda en 250 (el que fija el trigger para "legendary"), nunca en 999999.

### Fase 3 — Skill Tree (después de correr `0008_skill_tree.sql`)

- [ ] **`/skills`** muestra 6 ramas (Fuerza, Inteligencia, Disciplina, Enfoque, Creatividad, Carisma) con 3 niveles cada una, y arriba "N puntos disponibles" (= nivel actual, si todavía no desbloqueaste ninguna skill).
- [ ] **Desbloquear una skill de nivel 1** de una rama (ej. "Fuerza base") → pide confirmación, descuenta 1 punto disponible, la tarjeta pasa a "Desbloqueada".
- [ ] **La skill de nivel 2 de esa misma rama** (ej. "Resistencia") ahora es desbloqueable si tu nivel de personaje ya es ≥5 y te quedan puntos; si no, muestra el motivo exacto ("Requiere nivel 5" o "Requiere ‘Fuerza base’" o "No tenés suficientes puntos").
- [ ] **Intentar saltarte un requisito**: con el token del usuario, llamar `POST /rest/v1/rpc/unlock_skill` con el id de una skill de nivel 2/3 sin haber desbloqueado la de nivel 1 → debe fallar con el mensaje del RPC, no desbloquear nada.
- [ ] **"Tu build actual"** (arriba del árbol) muestra tus 3 atributos con mayor progreso relativo (valor/máximo) como barras, con un título de build (Warrior/Scholar/etc. para los 6 atributos base) — creá un atributo personalizado y hacelo tu más alto para confirmar que también aparece ahí con su propio nombre.

### Fase 4 — Focus Mode / Pomodoro (después de correr `0009_pomodoro.sql`)

- [ ] **`/focus`** → elegí Focus (25 min por defecto) y arrancá una sesión → el timer cuenta regresivo, el anillo de progreso avanza.
- [ ] **Cambiar de pestaña y volver** durante una sesión activa → el tiempo restante sigue siendo correcto (no se "congela" ni se adelanta) — confirma que no depende solo de `setInterval`.
- [ ] **Recargar la página** a mitad de una sesión → el timer se retoma solo desde donde iba (persiste en `localStorage`, la cuenta real la sigue llevando `started_at` en el servidor).
- [ ] **Pausar y reanudar** → el tiempo restante no avanza mientras está en pausa.
- [ ] **Dejar completar una sesión de Focus entera** (podés bajar la duración a 1 minuto en "Personalizar duración" para probar rápido) → toast de "+N XP", sube el XP/nivel en el topbar sin recargar, y si elegiste un atributo también sube +1.
- [ ] **Completar dos sesiones de Focus seguidas** (con menos de 30 minutos entre el fin de una y el inicio de la otra) → la segunda debe mostrar "Racha de foco: +10% XP" y dar más XP que la duración nominal.
- [ ] **Botón "Detener"** a mitad de una sesión → se guarda como interrumpida (sin XP), y "Sesiones interrumpidas" en Estadísticas sube.
- [ ] **Vincular una sesión con una misión** desde el selector → mientras corre, la página muestra "Vinculada a: <título de la misión>".
- [ ] **Gráfico "Foco esta semana"** y las tarjetas Hoy/Semana/Mes/Total reflejan las sesiones completadas.
- [ ] **Candado anti-trampa**: con el token del usuario, llamar `POST /rest/v1/rpc/complete_pomodoro_session` con el id de una sesión recién arrancada (sin esperar) → debe devolver `was_completed: false` y `xp_gained: 0` (el servidor mide el tiempo real transcurrido, no confía en que "ya pasaron los 25 minutos").

### Fase 7 — Journal + Notifications + Command Palette (después de correr `0010_journal_and_notifications.sql`)

- [ ] **`/journal`**: elegí un estado de ánimo (5 opciones), escribí una reflexión y opcionalmente logros/problemas/metas del día → "Guardar" la agrega arriba del historial con la fecha de hoy y el chip de color del mood elegido.
- [ ] **Borrar una entrada del journal** → pide confirmación, desaparece de la lista y no reaparece al recargar la página.
- [ ] **Campana de notificaciones** (topbar): completá una misión o una sesión de Focus → aparece el toast de siempre Y además el badge de la campana suma +1 sin recargar.
- [ ] **Abrir el panel de la campana** → lista las notificaciones más recientes primero, cada una con ícono según su tipo (misión/level-up/logro/título/foco) y tiempo relativo ("hace 2 min").
- [ ] **Marcar una notificación como leída** (click individual) → esa notificación pierde el resaltado de "no leída" y el contador del badge baja en 1; recargar la página conserva el estado leído.
- [ ] **"Marcar todas como leídas"** → el badge desaparece (contador en 0) y ninguna notificación queda resaltada.
- [ ] **Command Palette**: `Ctrl+K` (o `Cmd+K` en Mac) desde cualquier página → abre el modal con buscador autoenfocado; escribir filtra la lista de acciones en vivo; flechas ↑/↓ navegan, `Enter` ejecuta, `Esc` cierra.
- [ ] **Acción "Nueva misión"** desde el palette → navega a `/missions` y abre el formulario de misión automáticamente (sin quedar `?new=1` visible en la URL después).
- [ ] **Navegar a una sección** (ej. "Focus", "Analytics") desde el palette → confirma que llega a la ruta correcta.
- [ ] **Candado de RLS**: con el token del usuario, probar `POST /rest/v1/journal_entries` con `{"user_id": "<id-de-otro-usuario>", ...}` → debe fallar (policy exige `user_id = auth.uid()`). Mismo chequeo con `notifications`.

### Fase 8 — Seasons (solo schema, después de correr `0011_seasons.sql`)

Esta migración no tiene UI todavía — es únicamente la tabla `seasons` preparada para una fase social futura. No hay nada que probar en el navegador.

- [ ] En **Table Editor**, confirmar que existe `seasons` (vacía) con columnas `name`, `theme`, `starts_at`, `ends_at`, `is_active`.
- [ ] **Candado de RLS**: con el token del usuario, probar `POST /rest/v1/seasons` con `{"name": "Season 1", "starts_at": "2026-01-01", "ends_at": "2026-03-01"}` → debe fallar (no hay `GRANT INSERT` para `authenticated`, solo lectura).
- [ ] El resto de la app sigue funcionando exactamente igual — esta migración no toca ninguna tabla ni función existente.

### Fase 3 (retomada) — Habit System (después de correr `0012_habits.sql`)

- [ ] **`/habits`** (o "Hábitos" en el menú): "+ Nuevo hábito" con nombre, ícono (selector visual), repetición (Diario/Semanal) y atributo a mejorar → el hábito aparece en la grilla con su recompensa fija (+8 XP / +4 XYR).
- [ ] **Completar un hábito diario** → sube XP/monedas/atributo igual que una misión, el botón pasa a "Completado hoy", y la racha del hábito (🔥) sube a 1.
- [ ] **Completarlo un día distinto** (podés probarlo cambiando la fecha del sistema, o esperar al día siguiente) → la racha del hábito sigue subiendo; si se salta un día, vuelve a 0 al completarlo de nuevo.
- [ ] **Intentar completar el mismo hábito dos veces el mismo día** → falla con "Hábito ya completado" (mismo candado que las misiones diarias).
- [ ] **Hábito semanal**: completarlo una vez → pasa a "Completado esta semana" y se mantiene así el resto de la semana calendario.
- [ ] **Borrar un hábito** → desaparece de `/habits`, pero su historial de completadas sigue contando para el heatmap/analytics (mismo criterio que borrar una misión personalizada).
- [ ] **Dashboard**: si tenés al menos un hábito activo, aparece la sección "Hábitos de hoy" arriba de "Atributos".
- [ ] **Calendario**: el heatmap y "Actividades del mes" ahora suman hábitos completados, no solo misiones; el detalle del día los cuenta juntos.
- [ ] **Analytics**: aparece un gráfico nuevo "Hábitos completados" con el mismo selector de rango (7/30/90/365 días); "Evolución de atributos" también refleja los atributos que suben por hábitos.
- [ ] **Racha general** (topbar/dashboard): completar SOLO un hábito (sin ninguna misión) en el día también cuenta para la racha general de la cuenta.
- [ ] **Candado de RLS**: con el token del usuario, probar `POST /rest/v1/habits` con `{"user_id": "<mi-id>", "title": "x", "stat": "Fuerza", "xp_reward": 999999}` → la fila se crea pero `xp_reward` queda en 8 (el DEFAULT de la tabla), nunca en 999999. Probar también `POST /rest/v1/rpc/complete_habit` con el id de un hábito de otro usuario → debe fallar con "Hábito no encontrado o no disponible".
