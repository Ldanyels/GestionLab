-- Datos para emitir el comprobante a cada laboratorio.
--
-- Hasta ahora el alta pedía nombre del laboratorio, nombre del administrador,
-- correo y contraseña, y nada más. Con eso se puede dar acceso pero no emitir
-- una boleta, así que los datos fiscales del cliente quedaban en un cuaderno
-- aparte del sistema que le cobra.
--
-- Se admiten tres documentos porque los clientes no son homogéneos: un
-- laboratorio constituido tiene RUC, un técnico dental independiente puede
-- recibir boleta con su DNI, y hay profesionales extranjeros con carné de
-- extranjería. Exigir RUC habría dejado fuera a parte de la clientela.
alter table laboratorio add column if not exists doc_tipo text
  check (doc_tipo is null or doc_tipo in ('RUC', 'DNI', 'CE'));
alter table laboratorio add column if not exists doc_numero text;
alter table laboratorio add column if not exists razon_social text;
alter table laboratorio add column if not exists direccion_fiscal text;

-- Nulables a propósito: los laboratorios dados de alta antes de esta migración
-- no los tienen, y obligarlos habría impedido leer sus propias filas. Se
-- completan desde el panel.
comment on column laboratorio.razon_social is
  'Nombre o razón social para el comprobante. Puede diferir del nombre comercial del laboratorio.';
