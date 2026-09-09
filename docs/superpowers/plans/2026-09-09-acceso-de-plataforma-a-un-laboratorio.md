# Acceso de plataforma a un laboratorio — Plan de implementación

> **Para trabajadores automáticos:** SUB-SKILL REQUERIDA: usar
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar tarea por tarea. Los pasos usan
> casillas (`- [ ]`) para seguimiento.

**Objetivo:** Que quien opera la plataforma pueda abrir la ficha de cualquier
laboratorio y ver su actividad, sin pertenecer a ninguno, sin ver nombres de
pacientes y dejando constancia de cada visita.

**Arquitectura:** Todo ocurre en el grupo de rutas `(plataforma)`, con la clave
de servicio en el servidor. No cambia ninguna política RLS. Las consultas no
usan `createAdminSupabase()` directamente: pasan por `clienteDeLaboratorio(id)`,
que devuelve constructores de consulta ya acotados, de modo que el filtro por
inquilino se escribe una vez en un sitio probado.

**Stack:** Next.js 16 (App Router, Server Components), `@supabase/supabase-js`
2.110 con clave de servicio, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-acceso-de-plataforma-a-un-laboratorio-design.md`

## Restricciones globales

- **Ninguna política RLS cambia.** Criterio de aceptación del sub-proyecto:
  `CONFIRMO=si pnpm test:aislamiento` pasa **sin modificar** las comprobaciones
  existentes del script.
- **`paciente_nombre` no se trae.** No aparece en ninguna lista de columnas ni
  en ningún tipo de este sub-proyecto. No se trae y se oculta: no se trae.
- **Nada de simulacros de Supabase.** En este repositorio no se simula la base
  en ninguna prueba (verificado: cero `vi.mock` sobre supabase). Se prueba la
  lógica pura, y el comportamiento contra la base va en la suite de aislamiento.
- **Toda escritura de auditoría es best-effort.** Un fallo al registrar nunca
  interrumpe la navegación.
- Español en la interfaz y en los comentarios, como el resto del proyecto.

### Desviación respecto del spec, decidida al planificar

El spec describe `ResumenDeLaboratorio` con los campos `porCobrar` y
`ultimoMovimiento` dentro del objeto que devuelve una consulta. El plan los
saca a dos funciones **puras** que se calculan sobre la lista de trabajos que
la ficha ya trae. Dos motivos: evita dos consultas más, y convierte dos cifras
del resumen en algo que se puede probar sin base de datos.

---

### Tarea 1: Migración 0020 y registro de accesos

**Archivos:**
- Crear: `supabase/migrations/0020_auditoria_acceso_plataforma.sql`
- Crear: `lib/plataforma/auditoria.ts`
- Probar: `lib/plataforma/auditoria.test.ts`

**Interfaces:**
- Consume: `createAdminSupabase()` de `@/lib/supabase/admin`; `registrarError(donde, e, respaldo)` de `@/lib/registro`.
- Produce:
  - `interface FilaDeAcceso { laboratorio_id: string; tabla: 'laboratorio'; registro_id: string; accion: 'ACCESO'; usuario_id: null; usuario_nombre: null; actor_plataforma: string }`
  - `filaDeAcceso(laboratorioId: string, correo: string): FilaDeAcceso`
  - `registrarAccesoDePlataforma(laboratorioId: string, correo: string): Promise<void>`

- [ ] **Paso 1: Escribir la prueba que falla**

Crear `lib/plataforma/auditoria.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { filaDeAcceso } from './auditoria'

describe('filaDeAcceso', () => {
  it('marca la acción como ACCESO', () => {
    expect(filaDeAcceso('lab-1', 'yo@ejemplo.com').accion).toBe('ACCESO')
  })

  it('atribuye la visita al operador de la plataforma', () => {
    expect(filaDeAcceso('lab-1', 'yo@ejemplo.com').actor_plataforma).toBe('yo@ejemplo.com')
  })

  // Es la distinción que hace honesto el registro: ningún usuario del
  // laboratorio hizo esto, y decir lo contrario sería mentir en su historial.
  it('deja en nulo los campos del usuario del laboratorio', () => {
    const f = filaDeAcceso('lab-1', 'yo@ejemplo.com')
    expect(f.usuario_id).toBeNull()
    expect(f.usuario_nombre).toBeNull()
  })

  it('apunta a la fila del laboratorio visitado', () => {
    const f = filaDeAcceso('lab-1', 'yo@ejemplo.com')
    expect(f.laboratorio_id).toBe('lab-1')
    expect(f.registro_id).toBe('lab-1')
    expect(f.tabla).toBe('laboratorio')
  })

  it('normaliza el correo a minúsculas', () => {
    expect(filaDeAcceso('lab-1', '  YO@Ejemplo.com ').actor_plataforma).toBe('yo@ejemplo.com')
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

Ejecutar: `pnpm vitest run lib/plataforma/auditoria.test.ts`
Esperado: FALLA con `Failed to resolve import "./auditoria"`.

- [ ] **Paso 3: Escribir la migración**

Crear `supabase/migrations/0020_auditoria_acceso_plataforma.sql`:

```sql
-- Atribución de la plataforma en el historial de auditoría.
--
-- El disparador `registrar_auditoria()` (migración 0010) guarda `auth.uid()` y
-- busca el nombre en `perfil`. Con la clave de servicio, `auth.uid()` es NULL y
-- no hay perfil, así que todo lo que hace el panel quedaría registrado como si
-- no lo hubiera hecho nadie.
--
-- La columna es aparte y no reutiliza `usuario_nombre` porque son preguntas
-- distintas: `usuario_nombre` responde «qué usuario del laboratorio hizo esto»,
-- y aquí la respuesta correcta es «ninguno». Un laboratorio que revise su
-- historial debe poder distinguir un cambio suyo de uno del proveedor.
alter table auditoria add column if not exists actor_plataforma text;

comment on column auditoria.actor_plataforma is
  'Correo del operador de la plataforma que provocó el registro. NULL cuando lo hizo un usuario del propio laboratorio.';

-- 'ACCESO' no es un cambio de datos y por eso no lo contemplaba la restricción
-- original: registra que alguien de la plataforma abrió la ficha del
-- laboratorio. Una restricción CHECK no se amplía, hay que recrearla. El nombre
-- está verificado contra producción (2026-09-09): insertar una fila con
-- accion='ACCESO' responde 23514 nombrando `auditoria_accion_check`.
alter table auditoria drop constraint if exists auditoria_accion_check;
alter table auditoria add constraint auditoria_accion_check
  check (accion in ('INSERT','UPDATE','DELETE','ACCESO'));
```

- [ ] **Paso 4: Escribir la implementación mínima**

Crear `lib/plataforma/auditoria.ts`:

```ts
import { createAdminSupabase } from '@/lib/supabase/admin'
import { registrarError } from '@/lib/registro'

/**
 * Una visita de la plataforma a un laboratorio, tal como se guarda.
 *
 * Los campos de usuario van en nulo a propósito: la visita no la hizo ningún
 * usuario del laboratorio, y rellenarlos falsearía su historial.
 */
export interface FilaDeAcceso {
  laboratorio_id: string
  tabla: 'laboratorio'
  registro_id: string
  accion: 'ACCESO'
  usuario_id: null
  usuario_nombre: null
  actor_plataforma: string
}

export function filaDeAcceso(laboratorioId: string, correo: string): FilaDeAcceso {
  return {
    laboratorio_id: laboratorioId,
    tabla: 'laboratorio',
    registro_id: laboratorioId,
    accion: 'ACCESO',
    usuario_id: null,
    usuario_nombre: null,
    actor_plataforma: correo.trim().toLowerCase(),
  }
}

/**
 * Deja constancia de que la plataforma abrió este laboratorio.
 *
 * No interrumpe nunca: si el registro falla, se anota en el servidor y la ficha
 * se muestra igual. Dejar a un operador sin poder atender a un cliente porque
 * no se pudo apuntar la visita sería un mal cambio; el registro es una
 * obligación de la plataforma, no una condición del servicio.
 */
export async function registrarAccesoDePlataforma(
  laboratorioId: string,
  correo: string,
): Promise<void> {
  try {
    const admin = createAdminSupabase()
    const { error } = await admin.from('auditoria').insert(filaDeAcceso(laboratorioId, correo))
    if (error) throw new Error(error.message)
  } catch (e) {
    registrarError('registrarAccesoDePlataforma', e, 'no se pudo registrar el acceso')
  }
}
```

- [ ] **Paso 5: Ejecutar y comprobar que pasa**

Ejecutar: `pnpm vitest run lib/plataforma/auditoria.test.ts`
Esperado: 5 pruebas en verde.

- [ ] **Paso 6: Aplicar la migración en Supabase**

Este paso lo ejecuta una persona, no el código. En Supabase → SQL Editor, pegar
y ejecutar el contenido de `supabase/migrations/0020_auditoria_acceso_plataforma.sql`.

Comprobar después, con `node` y la clave de servicio de `.env.local`, que una
fila con `accion = 'ACCESO'` y `actor_plataforma` se inserta sin error y
borrarla a continuación. Si responde `23514`, la restricción no se recreó; si
responde `PGRST204` nombrando `actor_plataforma`, la columna no se añadió.

- [ ] **Paso 7: Confirmar**

```bash
git add supabase/migrations/0020_auditoria_acceso_plataforma.sql lib/plataforma/auditoria.ts lib/plataforma/auditoria.test.ts
git commit -m "feat(plataforma): registrar en auditoria los accesos a un laboratorio"
```

---

### Tarea 2: Cliente acotado por laboratorio

**Archivos:**
- Crear: `lib/plataforma/cliente.ts`
- Probar: `lib/plataforma/cliente.test.ts`

**Interfaces:**
- Consume: `createAdminSupabase()` de `@/lib/supabase/admin`.
- Produce:
  - `clienteDeLaboratorio(laboratorioId: string)` que devuelve `{ laboratorioId, leer(tabla, columnas), laboratorio(columnas) }`
  - `type ClienteDeLaboratorio = ReturnType<typeof clienteDeLaboratorio>`

- [ ] **Paso 1: Escribir la prueba que falla**

Crear `lib/plataforma/cliente.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { clienteDeLaboratorio } from './cliente'

beforeAll(() => {
  // Credenciales falsas: construir una consulta no hace ninguna petición, así
  // que la prueba no necesita un proyecto real ni red.
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ejemplo.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-de-prueba'
})

/**
 * La URL que construye postgrest-js. Es la única forma de comprobar el acotado
 * sin simulacros: si el filtro está, aparece en la cadena de consulta.
 */
function urlDe(consulta: unknown): string {
  return String((consulta as { url: URL }).url)
}

describe('clienteDeLaboratorio', () => {
  it('acota toda lectura al laboratorio', () => {
    const c = clienteDeLaboratorio('lab-1')
    expect(urlDe(c.leer('trabajo', 'id'))).toContain('laboratorio_id=eq.lab-1')
  })

  // Lo que hace útil el envoltorio: quien lo use puede seguir filtrando sin
  // poder quitar el acotado por descuido.
  it('el acotado sobrevive a los filtros que se encadenen después', () => {
    const c = clienteDeLaboratorio('lab-1')
    const url = urlDe(c.leer('trabajo', 'id').eq('estado', 'entregado'))
    expect(url).toContain('laboratorio_id=eq.lab-1')
    expect(url).toContain('estado=eq.entregado')
  })

  // La tabla `laboratorio` no tiene columna `laboratorio_id`: se identifica por
  // `id`. Sin este método, leerla con `leer()` filtraría por una columna que no
  // existe y la consulta fallaría.
  it('la propia fila del laboratorio se acota por id', () => {
    const c = clienteDeLaboratorio('lab-1')
    expect(urlDe(c.laboratorio('id, nombre'))).toContain('id=eq.lab-1')
  })

  it('no admite un laboratorio vacío', () => {
    expect(() => clienteDeLaboratorio('')).toThrow(/laboratorio/i)
  })

  it('recuerda a qué laboratorio pertenece', () => {
    expect(clienteDeLaboratorio('lab-1').laboratorioId).toBe('lab-1')
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

Ejecutar: `pnpm vitest run lib/plataforma/cliente.test.ts`
Esperado: FALLA con `Failed to resolve import "./cliente"`.

- [ ] **Paso 3: Escribir la implementación mínima**

Crear `lib/plataforma/cliente.ts`:

```ts
import { createAdminSupabase } from '@/lib/supabase/admin'

/**
 * Lecturas de un laboratorio, ya acotadas a él.
 *
 * El panel usa la clave de servicio, que ignora RLS por definición: aquí no hay
 * ninguna política protegiendo nada. Olvidar un `.eq('laboratorio_id', …)` en
 * una sola consulta expone el laboratorio equivocado, así que el acotado se
 * escribe **una vez**, aquí, en vez de repetirse en cada consulta.
 *
 * No es una barrera infranqueable —quien escriba código nuevo puede importar el
 * cliente crudo— sino una de diseño: el camino fácil es el correcto.
 */
export function clienteDeLaboratorio(laboratorioId: string) {
  if (!laboratorioId) {
    throw new Error('clienteDeLaboratorio necesita el id de un laboratorio')
  }
  const admin = createAdminSupabase()

  return {
    laboratorioId,

    /** SELECT sobre una tabla del inquilino, ya filtrado. */
    leer: (tabla: string, columnas: string) =>
      admin.from(tabla).select(columnas).eq('laboratorio_id', laboratorioId),

    /**
     * SELECT sobre la propia fila del laboratorio. Va aparte porque esa tabla
     * no tiene `laboratorio_id`: se identifica por `id`.
     */
    laboratorio: (columnas: string) =>
      admin.from('laboratorio').select(columnas).eq('id', laboratorioId),
  }
}

export type ClienteDeLaboratorio = ReturnType<typeof clienteDeLaboratorio>
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

Ejecutar: `pnpm vitest run lib/plataforma/cliente.test.ts`
Esperado: 5 pruebas en verde.

- [ ] **Paso 5: Confirmar**

```bash
git add lib/plataforma/cliente.ts lib/plataforma/cliente.test.ts
git commit -m "feat(plataforma): cliente de lectura acotado a un laboratorio"
```

---

### Tarea 3: Lectura de la ficha

**Archivos:**
- Crear: `lib/plataforma/laboratorio-detalle.ts`
- Probar: `lib/plataforma/laboratorio-detalle.test.ts`

**Interfaces:**
- Consume: `clienteDeLaboratorio(id)` (Tarea 2); `LaboratorioFila` de `@/lib/plataforma/laboratorios`; `EstadoTrabajo` de `@/lib/trabajos/estado`.
- Produce:
  - `COLUMNAS_TRABAJO: string`
  - `interface TrabajoDePlataforma { id; tipo_nombre; doctor_nombre; consultorio_nombre; fecha_ingreso; entregado_el; estado; precio_acordado; saldo }`
  - `aTrabajoDePlataforma(fila: FilaCrudaDeTrabajo): TrabajoDePlataforma`
  - `porCobrarDe(trabajos: readonly TrabajoDePlataforma[]): number`
  - `ultimoIngresoDe(trabajos: readonly TrabajoDePlataforma[]): string | null`
  - `resumenDeLaboratorio(id: string): Promise<{ laboratorio: LaboratorioFila; consultorios: number; doctores: number } | null>`
  - `trabajosDeLaboratorio(id: string): Promise<TrabajoDePlataforma[]>`

- [ ] **Paso 1: Escribir la prueba que falla**

Crear `lib/plataforma/laboratorio-detalle.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  aTrabajoDePlataforma,
  COLUMNAS_TRABAJO,
  porCobrarDe,
  ultimoIngresoDe,
} from './laboratorio-detalle'

const cruda = {
  id: 't1',
  fecha_ingreso: '2026-09-01',
  entregado_el: null,
  estado: 'en_curso' as const,
  precio_acordado: 360,
  doctor: { nombre: 'Dr. Pérez', consultorio: { nombre: 'Arte oral' } },
  catalogo: { nombre: 'Corona porcelana' },
  abonos: [{ monto: 100 }, { monto: 60 }],
}

describe('COLUMNAS_TRABAJO', () => {
  // La regla del sub-proyecto: el nombre del paciente no se trae. Un campo que
  // no viaja no se filtra por accidente en un registro de errores.
  it('no pide el nombre del paciente', () => {
    expect(COLUMNAS_TRABAJO).not.toMatch(/paciente/i)
  })

  it('pide lo que la ficha necesita para identificar un trabajo', () => {
    for (const c of ['estado', 'precio_acordado', 'fecha_ingreso', 'entregado_el']) {
      expect(COLUMNAS_TRABAJO).toContain(c)
    }
  })
})

describe('aTrabajoDePlataforma', () => {
  it('resuelve los nombres de tipo, doctor y consultorio', () => {
    const t = aTrabajoDePlataforma(cruda)
    expect(t.tipo_nombre).toBe('Corona porcelana')
    expect(t.doctor_nombre).toBe('Dr. Pérez')
    expect(t.consultorio_nombre).toBe('Arte oral')
  })

  it('calcula el saldo restando los abonos', () => {
    expect(aTrabajoDePlataforma(cruda).saldo).toBe(200)
  })

  it('sin abonos el saldo es el precio completo', () => {
    expect(aTrabajoDePlataforma({ ...cruda, abonos: [] }).saldo).toBe(360)
  })

  it('tolera las relaciones ausentes', () => {
    const t = aTrabajoDePlataforma({ ...cruda, doctor: null, catalogo: null, abonos: null })
    expect(t.doctor_nombre).toBe('—')
    expect(t.consultorio_nombre).toBe('—')
    expect(t.tipo_nombre).toBe('—')
    expect(t.saldo).toBe(360)
  })

  // Segunda línea de defensa: aunque una consulta futura llegara a traer el
  // campo, el mapeo no lo deja pasar a la interfaz.
  it('no devuelve el nombre del paciente aunque la fila lo traiga', () => {
    const conPaciente = { ...cruda, paciente_nombre: 'Juan Díaz' } as unknown as typeof cruda
    const t = aTrabajoDePlataforma(conPaciente)
    expect(Object.keys(t)).not.toContain('paciente_nombre')
  })
})

describe('porCobrarDe', () => {
  it('suma los saldos pendientes', () => {
    const t = [aTrabajoDePlataforma(cruda), aTrabajoDePlataforma({ ...cruda, id: 't2' })]
    expect(porCobrarDe(t)).toBe(400)
  })

  it('sin trabajos es cero', () => {
    expect(porCobrarDe([])).toBe(0)
  })
})

describe('ultimoIngresoDe', () => {
  it('devuelve la fecha de ingreso más reciente', () => {
    const t = [
      aTrabajoDePlataforma(cruda),
      aTrabajoDePlataforma({ ...cruda, id: 't2', fecha_ingreso: '2026-09-08' }),
    ]
    expect(ultimoIngresoDe(t)).toBe('2026-09-08')
  })

  it('sin trabajos no hay fecha', () => {
    expect(ultimoIngresoDe([])).toBeNull()
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

Ejecutar: `pnpm vitest run lib/plataforma/laboratorio-detalle.test.ts`
Esperado: FALLA con `Failed to resolve import "./laboratorio-detalle"`.

- [ ] **Paso 3: Escribir la implementación mínima**

Crear `lib/plataforma/laboratorio-detalle.ts`:

```ts
import { clienteDeLaboratorio } from './cliente'
import type { LaboratorioFila } from './laboratorios'
import type { EstadoTrabajo } from '@/lib/trabajos/estado'

/**
 * Columnas de un trabajo para el panel de plataforma.
 *
 * **`paciente_nombre` no está, y su ausencia es la función.** Quien opera la
 * plataforma no trata datos de salud: un trabajo se identifica por su tipo, su
 * doctor, su fecha y su monto, que alcanza para encontrarlo y corregirlo.
 */
export const COLUMNAS_TRABAJO =
  'id, fecha_ingreso, entregado_el, estado, precio_acordado, ' +
  'doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), ' +
  'catalogo:catalogo_trabajo_id(nombre), abonos:abono(monto)'

export interface TrabajoDePlataforma {
  id: string
  tipo_nombre: string
  doctor_nombre: string
  consultorio_nombre: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  saldo: number
}

export interface FilaCrudaDeTrabajo {
  id: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  doctor: { nombre: string; consultorio: { nombre: string } | null } | null
  catalogo: { nombre: string } | null
  abonos: { monto: number }[] | null
}

/** Construye el objeto campo por campo: nada de la fila cruda pasa sin querer. */
export function aTrabajoDePlataforma(fila: FilaCrudaDeTrabajo): TrabajoDePlataforma {
  const pagado = (fila.abonos ?? []).reduce((s, a) => s + a.monto, 0)
  return {
    id: fila.id,
    tipo_nombre: fila.catalogo?.nombre ?? '—',
    doctor_nombre: fila.doctor?.nombre ?? '—',
    consultorio_nombre: fila.doctor?.consultorio?.nombre ?? '—',
    fecha_ingreso: fila.fecha_ingreso,
    entregado_el: fila.entregado_el,
    estado: fila.estado,
    precio_acordado: fila.precio_acordado,
    saldo: Math.round((fila.precio_acordado - pagado) * 100) / 100,
  }
}

/** Cuánto le deben al laboratorio, sobre los trabajos ya traídos. */
export function porCobrarDe(trabajos: readonly TrabajoDePlataforma[]): number {
  return Math.round(trabajos.reduce((s, t) => s + t.saldo, 0) * 100) / 100
}

/** Cuándo entró el último trabajo: dice si el laboratorio sigue vivo. */
export function ultimoIngresoDe(trabajos: readonly TrabajoDePlataforma[]): string | null {
  return trabajos.reduce<string | null>(
    (max, t) => (max === null || t.fecha_ingreso > max ? t.fecha_ingreso : max),
    null,
  )
}

export async function trabajosDeLaboratorio(id: string): Promise<TrabajoDePlataforma[]> {
  const cliente = clienteDeLaboratorio(id)
  const { data, error } = await cliente
    .leer('trabajo', COLUMNAS_TRABAJO)
    .order('fecha_ingreso', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as FilaCrudaDeTrabajo[]).map(aTrabajoDePlataforma)
}

export interface ResumenDeLaboratorio {
  laboratorio: LaboratorioFila
  consultorios: number
  doctores: number
}

export async function resumenDeLaboratorio(id: string): Promise<ResumenDeLaboratorio | null> {
  const cliente = clienteDeLaboratorio(id)
  // Conteos incrustados: PostgREST devuelve `[{count: N}]` por cada relación.
  const { data, error } = await cliente
    .laboratorio(
      'id, nombre, plan, estado, creado_en, perfil(count), trabajo(count), consultorio(count), doctor(count)',
    )
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const fila = data as unknown as {
    id: string
    nombre: string
    plan: LaboratorioFila['plan']
    estado: LaboratorioFila['estado']
    creado_en: string
    perfil: { count: number }[] | null
    trabajo: { count: number }[] | null
    consultorio: { count: number }[] | null
    doctor: { count: number }[] | null
  }

  return {
    laboratorio: {
      id: fila.id,
      nombre: fila.nombre,
      plan: fila.plan,
      estado: fila.estado,
      creado_en: fila.creado_en,
      usuarios: fila.perfil?.[0]?.count ?? 0,
      trabajos: fila.trabajo?.[0]?.count ?? 0,
    },
    consultorios: fila.consultorio?.[0]?.count ?? 0,
    doctores: fila.doctor?.[0]?.count ?? 0,
  }
}
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

Ejecutar: `pnpm vitest run lib/plataforma/laboratorio-detalle.test.ts`
Esperado: 11 pruebas en verde.

- [ ] **Paso 5: Verificar la consulta contra la base real**

Las funciones que tocan la base no se prueban con simulacros en este
repositorio. Crear `.diag-detalle.mjs` en la raíz (no se confirma; se borra al
terminar):

```js
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = {}
for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = l.indexOf('=')
  if (i > 0 && !l.trim().startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim()
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data: labs } = await admin.from('laboratorio').select('id, nombre').limit(1)
const lab = labs[0]
console.log('laboratorio:', lab.nombre)

const COLUMNAS =
  'id, fecha_ingreso, entregado_el, estado, precio_acordado, ' +
  'doctor:doctor_id(nombre, consultorio:consultorio_id(nombre)), ' +
  'catalogo:catalogo_trabajo_id(nombre), abonos:abono(monto)'

const { data, error } = await admin
  .from('trabajo')
  .select(COLUMNAS)
  .eq('laboratorio_id', lab.id)
  .limit(3)

if (error) {
  console.log('✗ la consulta falló:', error.message)
  process.exitCode = 1
} else {
  console.log(`✓ ${data.length} trabajo(s) leídos`)
  const conPaciente = data.filter((t) => 'paciente_nombre' in t)
  console.log(
    conPaciente.length === 0
      ? '✓ ninguna fila trae paciente_nombre'
      : `✗ ${conPaciente.length} fila(s) TRAEN paciente_nombre`,
  )
  console.log(JSON.stringify(data[0], null, 1))
}
```

Ejecutar: `node .diag-detalle.mjs`
Esperado: las dos marcas en verde. Después: `rm .diag-detalle.mjs`.

- [ ] **Paso 6: Confirmar**

```bash
git add lib/plataforma/laboratorio-detalle.ts lib/plataforma/laboratorio-detalle.test.ts
git commit -m "feat(plataforma): lectura de la ficha de un laboratorio sin datos de pacientes"
```

---

### Tarea 4: La ficha en el panel

**Archivos:**
- Crear: `components/plataforma/FichaLaboratorio.tsx`
- Probar: `components/plataforma/FichaLaboratorio.test.tsx`
- Crear: `app/(plataforma)/plataforma/[id]/page.tsx`
- Modificar: `components/plataforma/FilaLaboratorio.tsx` (enlazar el nombre a la ficha)

**Interfaces:**
- Consume: `resumenDeLaboratorio`, `trabajosDeLaboratorio`, `porCobrarDe`, `ultimoIngresoDe`, `TrabajoDePlataforma` (Tarea 3); `registrarAccesoDePlataforma` (Tarea 1); `correoSesion()` y `requireSuperAdmin()` de `@/lib/plataforma/acceso`; `Card` y `Chip` de `@/components/ui`.
- Produce: la ruta `/plataforma/[id]`.

- [ ] **Paso 1: Escribir la prueba que falla**

Crear `components/plataforma/FichaLaboratorio.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FichaLaboratorio } from './FichaLaboratorio'
import type { TrabajoDePlataforma } from '@/lib/plataforma/laboratorio-detalle'

const resumen = {
  laboratorio: {
    id: 'l1',
    nombre: 'MasterLab',
    plan: 'gratis' as const,
    estado: 'activo' as const,
    creado_en: '2026-07-15T00:00:00Z',
    usuarios: 4,
    trabajos: 29,
  },
  consultorios: 3,
  doctores: 7,
}

const trabajo = (p: Partial<TrabajoDePlataforma> = {}): TrabajoDePlataforma => ({
  id: 't1',
  tipo_nombre: 'Corona porcelana',
  doctor_nombre: 'Dr. Pérez',
  consultorio_nombre: 'Arte oral',
  fecha_ingreso: '2026-09-01',
  entregado_el: null,
  estado: 'en_curso',
  precio_acordado: 360,
  saldo: 200,
  ...p,
})

describe('FichaLaboratorio', () => {
  it('encabeza con el nombre del laboratorio y sus cifras', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[trabajo()]} />)
    expect(screen.getByRole('heading', { name: 'MasterLab' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('lista los trabajos por tipo, doctor y consultorio', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[trabajo()]} />)
    expect(screen.getByText('Corona porcelana')).toBeInTheDocument()
    expect(screen.getByText(/Arte oral · Dr. Pérez/)).toBeInTheDocument()
  })

  it('avisa cuando el laboratorio está suspendido', () => {
    render(
      <FichaLaboratorio
        resumen={{ ...resumen, laboratorio: { ...resumen.laboratorio, estado: 'suspendido' } }}
        trabajos={[]}
      />,
    )
    expect(screen.getByText('Suspendido')).toBeInTheDocument()
  })

  it('dice que no hay trabajos en vez de mostrar una lista vacía', () => {
    render(<FichaLaboratorio resumen={resumen} trabajos={[]} />)
    expect(screen.getByText(/no ha registrado trabajos/i)).toBeInTheDocument()
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

Ejecutar: `pnpm vitest run components/plataforma/FichaLaboratorio.test.tsx`
Esperado: FALLA con `Failed to resolve import "./FichaLaboratorio"`.

- [ ] **Paso 3: Escribir el componente**

Crear `components/plataforma/FichaLaboratorio.tsx`:

```tsx
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatMoney } from '@/lib/format'
import {
  porCobrarDe,
  ultimoIngresoDe,
  type ResumenDeLaboratorio,
  type TrabajoDePlataforma,
} from '@/lib/plataforma/laboratorio-detalle'

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {etiqueta}
      </p>
      <p className="num mt-0.5 text-[17px] font-bold">{valor}</p>
    </div>
  )
}

/**
 * Ficha de un laboratorio vista desde la plataforma.
 *
 * No muestra nombres de pacientes, y no porque los oculte: los datos no vienen
 * con ese campo. Un trabajo se reconoce por su tipo, su doctor y su fecha.
 */
export function FichaLaboratorio({
  resumen,
  trabajos,
}: {
  resumen: ResumenDeLaboratorio
  trabajos: readonly TrabajoDePlataforma[]
}) {
  const { laboratorio: lab } = resumen
  const ultimo = ultimoIngresoDe(trabajos)

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">{lab.nombre}</h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Último ingreso: {ultimo ?? 'sin actividad'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {lab.estado === 'suspendido' ? <Chip tono="peligro">Suspendido</Chip> : null}
          <Chip tono={lab.plan === 'pagado' ? 'exito' : 'neutro'}>
            {lab.plan === 'pagado' ? 'Pagado' : 'Cortesía'}
          </Chip>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra etiqueta="Usuarios" valor={lab.usuarios} />
        <Cifra etiqueta="Consultorios" valor={resumen.consultorios} />
        <Cifra etiqueta="Doctores" valor={resumen.doctores} />
        <Cifra etiqueta="Por cobrar" valor={formatMoney(porCobrarDe(trabajos))} />
      </div>

      {trabajos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Este laboratorio no ha registrado trabajos</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {trabajos.map((t) => (
            <li key={t.id}>
              <Card tono="lista" className="space-y-1 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[15.5px] font-semibold">{t.tipo_nombre}</p>
                  <span className="num shrink-0 text-[15px] font-bold">
                    {formatMoney(t.precio_acordado)}
                  </span>
                </div>
                <p className="truncate text-[13px] text-[var(--color-muted)]">
                  {t.consultorio_nombre} · {t.doctor_nombre} ·{' '}
                  {t.entregado_el ? `entregado ${t.entregado_el}` : `ingresó ${t.fecha_ingreso}`}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

Ejecutar: `pnpm vitest run components/plataforma/FichaLaboratorio.test.tsx`
Esperado: 4 pruebas en verde.

- [ ] **Paso 5: Escribir la página**

Crear `app/(plataforma)/plataforma/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { correoSesion } from '@/lib/plataforma/acceso'
import { registrarAccesoDePlataforma } from '@/lib/plataforma/auditoria'
import {
  resumenDeLaboratorio,
  trabajosDeLaboratorio,
} from '@/lib/plataforma/laboratorio-detalle'
import { FichaLaboratorio } from '@/components/plataforma/FichaLaboratorio'

export default async function LaboratorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resumen = await resumenDeLaboratorio(id)
  if (!resumen) notFound()

  const trabajos = await trabajosDeLaboratorio(id)

  // El acceso se registra después de comprobar que el laboratorio existe: una
  // dirección tecleada al azar no debe ensuciar el historial de nadie. Y no se
  // espera su resultado como condición de nada: la función no lanza.
  const correo = await correoSesion()
  if (correo) await registrarAccesoDePlataforma(id, correo)

  return (
    <div className="space-y-4">
      <Link href="/plataforma" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Laboratorios
      </Link>
      <FichaLaboratorio resumen={resumen} trabajos={trabajos} />
    </div>
  )
}
```

La guardia de super-administrador no se repite aquí: `app/(plataforma)/layout.tsx`
ya llama a `requireSuperAdmin()` y cubre todas las páginas del grupo. La
repetición sí es necesaria en las Server Actions, que se pueden invocar sin
pasar por ninguna página, y este archivo no define ninguna.

- [ ] **Paso 6: Enlazar desde la lista**

En `components/plataforma/FilaLaboratorio.tsx`, envolver el nombre en un enlace.
Reemplazar:

```tsx
          <p className="truncate text-[15.5px] font-semibold">{lab.nombre}</p>
```

por:

```tsx
          {/*
            `prefetch={false}` no es una optimización: es corrección del
            registro. Next precarga los enlaces al pasar el ratón o al entrar en
            pantalla, y esa precarga **renderiza la página**, así que se
            apuntaría un acceso que nadie hizo. Un historial que dice «tu
            proveedor entró» porque alguien rozó un enlace no es un registro,
            es una acusación falsa.
          */}
          <Link
            href={`/plataforma/${lab.id}`}
            prefetch={false}
            className="truncate text-[15.5px] font-semibold text-[var(--color-accent)]"
          >
            {lab.nombre}
          </Link>
```

y añadir `import Link from 'next/link'` al principio del archivo.

- [ ] **Paso 7: Verificación**

Ejecutar: `pnpm tsc --noEmit`
Esperado: sin errores nuevos (queda el preexistente de `lib/inventario/__tests__/schema.test.ts`).

Ejecutar: `pnpm test`
Esperado: todas en verde, **25 más** que antes de la Tarea 1 (5 + 5 + 11 + 4).

Ejecutar: `pnpm build`
Esperado: `✓ Compiled successfully`, con `/plataforma/[id]` en la lista de rutas.

- [ ] **Paso 8: Confirmar**

```bash
git add "app/(plataforma)/plataforma/[id]/page.tsx" components/plataforma/FichaLaboratorio.tsx components/plataforma/FichaLaboratorio.test.tsx components/plataforma/FilaLaboratorio.tsx
git commit -m "feat(plataforma): ficha de un laboratorio con registro del acceso"
```

---

### Tarea 5: Aislamiento y documentación

**Archivos:**
- Modificar: `scripts/probar-aislamiento.mjs` (comprobación nueva, sin tocar las existentes)
- Modificar: `docs/supabase-setup.md`

**Interfaces:**
- Consume: los ayudantes que ya existen en el script (`crearLaboratorio`, `crearUsuario`, `comprobar`, `admin`, `CLAVE`, `PREFIJO`).
- Produce: nada que use otro código.

- [ ] **Paso 1: Añadir la comprobación al script**

En `scripts/probar-aislamiento.mjs`, antes de la sección `── Limpieza ──`,
añadir:

```js
/**
 * El registro de accesos de la plataforma respeta el aislamiento.
 *
 * Importa por dos razones: que la fila se pueda escribir (la migración 0020
 * aplicada) y que cada laboratorio vea solo sus propios accesos. Lo segundo es
 * lo que convierte «puedo entrar a tu laboratorio» en algo que el cliente puede
 * comprobar, sin que de paso vea las visitas a otros.
 */
async function comprobarAccesosDePlataforma(comoA, labA, labB) {
  console.log('\nAuditoría de accesos de la plataforma')

  const fila = (lab) => ({
    laboratorio_id: lab,
    tabla: 'laboratorio',
    registro_id: lab,
    accion: 'ACCESO',
    usuario_id: null,
    usuario_nombre: null,
    actor_plataforma: `${PREFIJO}@ejemplo.invalid`,
  })

  const { error } = await admin.from('auditoria').insert([fila(labA), fila(labB)])
  if (error) {
    // Sin la migración 0020 esto falla por la restricción o por la columna. No
    // es una fuga: es una migración pendiente, y se informa como tal.
    ausentes.push(`auditoria.actor_plataforma / accion='ACCESO' (migración 0020): ${error.message}`)
    return
  }

  const { data: vistos } = await comoA.from('auditoria').select('*').eq('accion', 'ACCESO')
  const propios = (vistos ?? []).filter((f) => f.laboratorio_id === labA)
  const ajenos = (vistos ?? []).filter((f) => f.laboratorio_id !== labA)

  comprobar('el laboratorio ve los accesos de la plataforma a su propia cuenta',
    propios.length === 1, `${propios.length} fila(s)`)
  comprobar('no ve los accesos a otros laboratorios',
    ajenos.length === 0, `${ajenos.length} fila(s) ajena(s)`)
  comprobar('la fila de acceso guarda quién de la plataforma entró',
    propios[0]?.actor_plataforma === `${PREFIJO}@ejemplo.invalid`)
  comprobar('la fila de acceso no atribuye la visita a un usuario del laboratorio',
    propios[0]?.usuario_id === null)
}
```

Y en la sección de ejecución, después de `await comprobarAltaAislada(labB)`:

```js
  await comprobarAccesosDePlataforma(comoA, labA, labB)
```

- [ ] **Paso 2: Ejecutar la suite de aislamiento**

Ejecutar: `CONFIRMO=si pnpm test:aislamiento`
Esperado: todas las comprobaciones en verde, incluidas las cuatro nuevas, y la
limpieza sin filas huérfanas. **Ninguna comprobación existente se modifica**:
ese es el criterio de aceptación del sub-proyecto.

- [ ] **Paso 3: Documentar la migración**

En `docs/supabase-setup.md`, al final de la sección **2. Ejecutar migraciones**,
añadir:

```markdown
### Migraciones posteriores

Las migraciones numeradas se ejecutan en orden en el mismo SQL Editor. Dos que
conviene no saltarse:

- `0019_fecha_entrega_real.sql` — sin ella, marcar un trabajo como entregado
  falla.
- `0020_auditoria_acceso_plataforma.sql` — sin ella, la ficha de laboratorio del
  panel funciona igual, pero **no deja rastro de las visitas**. Como esa
  constancia es justo lo que se le ofrece al laboratorio a cambio de que su
  proveedor pueda ver sus datos, el sistema quedaría prometiendo algo que no
  cumple, y sin ningún error visible que lo delate.
```

- [ ] **Paso 4: Confirmar**

```bash
git add scripts/probar-aislamiento.mjs docs/supabase-setup.md
git commit -m "test(plataforma): aislamiento de la auditoria de accesos"
```

---

## Revisión del plan contra el spec

- **Problema A (atribución de la auditoría)** → Tarea 1: columna, acción nueva y
  función de registro, con la migración verificada contra producción.
- **Problema B (acotado sin RLS)** → Tarea 2: un único punto de paso, probado
  inspeccionando la URL de la consulta, sin red ni simulacros.
- **Sin nombres de pacientes** → Tarea 3: ausentes de `COLUMNAS_TRABAJO` y del
  mapeo, con una prueba para cada cosa.
- **Ficha del laboratorio** → Tarea 4.
- **Registro del acceso al abrir la ficha** → Tarea 4, paso 5.
- **`test:aislamiento` sigue pasando sin modificarse** → Tarea 5, paso 2.
- **Fuera de alcance según el spec** (escrituras, reportes, pantalla del
  historial para el laboratorio): ninguna tarea las toca.
