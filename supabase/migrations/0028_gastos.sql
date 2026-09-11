-- Gastos de operación: servicios, equipo y todo lo demás.
--
-- Hasta ahora Finanzas restaba solo dos cosas: materiales y pagos a
-- trabajadores. La luz, el agua, el alquiler y una reparación de equipo no
-- estaban en ninguna parte, así que **la utilidad que mostraba el sistema
-- estaba inflada**. No por un error de cálculo: por un gasto que no se podía
-- registrar.
--
-- Una sola tabla y no una por tipo. Un recibo de luz y la reparación de un
-- motor de pulido son lo mismo —dinero que sale, con fecha, importe y motivo—
-- y lo único que cambia es la categoría. Dos tablas serían dos pantallas y el
-- doble de código para la misma cosa.

create table if not exists gasto (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  -- 'servicio' lo que se repite cada mes, 'equipo' compras y reparaciones,
  -- 'otro' el resto. Tres son suficientes para saber a dónde se va el dinero
  -- sin obligar a nadie a clasificar con precisión contable.
  categoria text not null check (categoria in ('servicio', 'equipo', 'otro')),
  -- El motivo, en palabras del laboratorio: «Luz — recibo agosto»,
  -- «Reparación del motor de pulido». Obligatorio: un gasto sin motivo no se
  -- puede revisar tres meses después, que es cuando se revisa.
  concepto text not null check (length(trim(concepto)) > 0),
  monto numeric(10,2) not null check (monto > 0),
  fecha date not null default current_date,
  creado_en timestamptz not null default now()
);

-- Por laboratorio y fecha: es como lo consulta Finanzas, siempre por periodo.
create index if not exists idx_gasto_lab_fecha on gasto(laboratorio_id, fecha);

alter table gasto enable row level security;

-- Tabla de inquilino: mismo patrón que trabajador y pago_trabajador. Cada
-- laboratorio ve y escribe lo suyo, y nada más.
drop policy if exists gasto_rw on gasto;
create policy gasto_rw on gasto for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
