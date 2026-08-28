# XYRON — HabitQuest

Un sistema de progresión RPG para tu vida real: convertí hábitos y tareas en misiones,
subí de nivel, desarrollá stats, desbloqueá skills y construí tu build — todo respaldado
por un backend real con anti-trampa server-side, no una demo con datos mockeados.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)

## Qué es

XYRON toma el loop clásico de un RPG y lo aplica a hábitos y objetivos reales:

```
HÁBITO / TAREA → QUEST → XP → LEVEL → STATS → SKILL POINTS → SKILLS → BUILD → RANK → ACHIEVEMENTS
```

No es un habit tracker con una capa de pintura fantasy: cada recompensa (XP, monedas,
subida de stat) la calcula y valida el servidor — nunca el cliente — vía funciones
`SECURITY DEFINER` en Postgres, con Row Level Security en cada tabla y privilegios
columna-por-columna para que ni un `PATCH` directo a la REST API pueda inflar una
recompensa.

## Funcionalidades

**Progresión**
- XP auditable (ledger `xp_transactions`, igual patrón que las monedas)
- Nivel y XP requerido con fórmula exponencial (espejada 1:1 en SQL y en el cliente)
- 8 rangos (Novice → Mythic), derivados puramente del nivel — nunca una columna a sincronizar
- Títulos desbloqueables ligados a nivel/logros, seleccionables desde el perfil

**Quests y hábitos**
- Misiones con 5 dificultades (Easy → Legendary) y 5 repeticiones (diaria, semanal,
  mensual, única vez, challenge), con búsqueda y filtros
- Sistema de **hábitos** separado, con racha y % de consistencia propios por hábito
- Reinicio diario consciente de zona horaria (no UTC ciego) para que "hoy" sea el
  mismo día en el que el usuario realmente está

**Skill Tree y Build**
- Árbol de skills por atributo, con prerequisitos y costo en skill points
  (`puntos disponibles = nivel − costo ya gastado`, siempre derivado)
- Build de personaje 100% emergente: se arma solo con los atributos donde más creciste,
  incluyendo atributos custom que el usuario haya creado

**Focus Mode / Pomodoro**
- Timer resiliente a que se cierre o suspenda la pestaña (ancla el inicio server-side,
  no depende solo de `setInterval` acumulando segundos)
- Bono de racha de foco, vínculo opcional con una misión, estadísticas de estudio

**Seguimiento**
- Calendario tipo heatmap (estilo GitHub) que combina misiones, hábitos y sesiones de foco
- Analytics con rangos de fecha (7/30/90/365 días) y evolución por atributo
- Daily Review y Journal (mood + reflexión + victorias/problemas/metas del día)

**Alrededor del producto**
- Centro de notificaciones persistente (espejo de cada toast, con no-leídas)
- Command Palette (`Ctrl+K` / `Cmd+K`) para navegar y crear misiones sin el mouse
- Logros con rareza y logros ocultos, desbloqueo revalidado server-side en cada sync
- Diseño 100% responsive, dark-mode, con `prefers-reduced-motion` respetado

## Stack

- **Frontend**: React 19, TypeScript, Vite 8, React Router 7
- **Backend**: Supabase (Postgres, Auth, RLS, funciones `SECURITY DEFINER`)
- **Iconografía**: Phosphor Icons
- **Lint**: oxlint

## Arquitectura, en breve

- **Nada de XP/monedas se confía del cliente.** Cada acción que otorga recompensa pasa
  por una RPC `SECURITY DEFINER` (`complete_mission`, `complete_habit`,
  `complete_pomodoro_session`, `unlock_skill`) que revalida todo server-side; las
  columnas de recompensa ni siquiera tienen `GRANT` de escritura para el cliente.
- **Tiempo server-authoritative.** Las sesiones de foco anclan `started_at = now()` en
  el servidor al arrancar, y miden el tiempo real transcurrido al completar — nunca un
  timestamp que mande el navegador.
- **Nada se duplica si se puede derivar.** Rank, skill points disponibles, streaks,
  build de personaje: todo se calcula a partir de datos ya cargados, nunca se guarda en
  una columna aparte que se pueda desincronizar.
- **Migraciones incrementales.** Todo el esquema vive en `supabase/schema.sql` (base) +
  `supabase/migrations/*.sql` (aditivas, nunca destructivas), documentadas paso a paso
  en [`supabase/SETUP.md`](./supabase/SETUP.md).

## Cómo correrlo

1. Cloná el repo e instalá dependencias:
   ```bash
   npm install
   ```
2. Seguí [`supabase/SETUP.md`](./supabase/SETUP.md) para crear el proyecto de Supabase,
   correr el schema y las migraciones, y configurar `.env.local`.
3. Levantá el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check (`tsc --noEmit`) + build de producción |
| `npm run typecheck` | Solo type-check |
| `npm run lint` | oxlint |
| `npm run preview` | Sirve el build de producción localmente |

## Roadmap

- **Seasons**: el schema (`seasons`, con ventana de fechas y tema) ya está preparado
  como base para una futura temporada competitiva/social — todavía sin UI a propósito.
- Sprite de personaje pixel-art que evolucione visualmente según los stats del build.
