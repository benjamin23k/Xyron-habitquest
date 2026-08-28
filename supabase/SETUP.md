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
