# Política de privacidad de GestionLab

> **Borrador para revisión legal.** Los datos entre `[CORCHETES]` los completa
> Skardiam. Última revisión del marco normativo: 2026-09-10.

**Última actualización:** [FECHA DE PUBLICACIÓN]

## 1. Quiénes somos

GestionLab es un sistema de gestión para laboratorios dentales, operado por
**[RAZÓN SOCIAL], RUC [RUC]**, con domicilio en **[DOMICILIO FISCAL]**, Perú.

Para cualquier asunto sobre datos personales: **[CORREO DE CONTACTO]**.

## 2. Dos papeles distintos, y conviene distinguirlos

En GestionLab hay dos clases de datos personales, y nuestras obligaciones sobre
cada una son distintas:

**Datos que tratamos por cuenta del laboratorio.** Los de sus pacientes, sus
consultorios y sus doctores. Aquí el **responsable es el laboratorio**: él
decide qué registra y para qué. Nosotros somos su **encargado de tratamiento**,
lo que significa que solo hacemos con esos datos lo que él nos indica, y nunca
los usamos para fines propios. Si eres paciente de un laboratorio que usa
GestionLab y quieres ejercer tus derechos, **la solicitud se dirige al
laboratorio**, no a nosotros; ellos nos pedirán ayuda si la necesitan.

**Datos de los que somos responsables nosotros.** Los de contacto y facturación
del laboratorio como cliente, y las cuentas de las personas que entran al
sistema.

## 3. Qué datos tratamos

### Como responsables

| Dato | Para qué | Base legal |
|---|---|---|
| Nombre y correo de cada usuario | Darle acceso, identificarlo dentro de su laboratorio y permitirle recuperar su contraseña | Ejecución del contrato |
| Nombre del laboratorio y datos de contacto | Facturación y soporte | Ejecución del contrato |
| Registro de accesos y cambios hechos por nuestro personal de soporte | Poder demostrar quién entró y qué modificó | Obligación legal y interés legítimo en la seguridad |

No usamos cookies de publicidad ni de análisis de terceros. Las únicas cookies
son las de sesión, imprescindibles para mantenerte identificado.

### Como encargados, por cuenta del laboratorio

- Nombre del paciente.
- El trabajo dental encargado: tipo, pieza, fechas y precio acordado.
- Doctor y consultorio que lo solicitan.
- Pagos registrados sobre ese trabajo.

**El nombre del paciente asociado a un trabajo dental constituye un dato de
salud**, y los datos de salud son datos sensibles según la Ley N° 29733: la
categoría con mayor protección. Los tratamos únicamente para prestar el servicio
al laboratorio.

## 4. Dónde están los datos, y quién más los toca

Los datos se alojan en la infraestructura de nuestros proveedores:

| Proveedor | Qué hace | Dónde |
|---|---|---|
| Supabase | Base de datos y autenticación | **Estados Unidos (región us-east-2)** |
| Vercel | Alojamiento de la aplicación | Estados Unidos y red global |
| Resend | Envío de correos de recuperación de contraseña | Estados Unidos |

### Transferencia internacional

**Los datos, incluidos los datos de salud, se almacenan y procesan fuera del
Perú, en Estados Unidos.** La Ley N° 29733 permite este flujo transfronterizo
cuando existen garantías suficientes, y nos apoyamos en las cláusulas
contractuales y los compromisos de seguridad de cada proveedor.

Si esto no te resulta aceptable como laboratorio, dínoslo antes de contratar: es
una característica de cómo está construido el servicio hoy, no algo que podamos
cambiar para un cliente en particular.

## 5. Quién puede ver los datos de tu laboratorio

**Nadie de otro laboratorio.** El aislamiento entre laboratorios está impuesto
por la base de datos, no solo por la aplicación, y lo verificamos de forma
automática antes de cada despliegue.

**Nuestro personal de soporte sí puede.** Para poder ayudarte —devolver un
acceso perdido, corregir un dato mal registrado— podemos entrar a la información
de tu laboratorio. Con dos límites que están construidos en el sistema y no
dependen de nuestra buena voluntad:

- **No vemos nombres de pacientes.** Las pantallas de soporte no traen ese dato
  de la base de datos: un trabajo se identifica por su tipo, su doctor y su
  fecha.
- **Queda registrado.** Cada vez que entramos a tu laboratorio, y cada cambio
  que hacemos, se guarda con el correo de quien lo hizo, qué hizo y cuál era el
  valor anterior.

## 6. Cuánto tiempo los guardamos

Mientras el laboratorio sea cliente, y **[PLAZO, p. ej. 60] días** después de
terminar el contrato, para darle tiempo de exportar su información. Pasado ese
plazo se eliminan, salvo lo que debamos conservar por obligación contable o
tributaria.

## 7. Tus derechos

Puedes solicitar acceso, rectificación, cancelación u oposición sobre tus datos
personales, y presentar un reclamo ante la **Autoridad Nacional de Protección de
Datos Personales** del Ministerio de Justicia y Derechos Humanos.

- **Si eres usuario del sistema** (administrador o técnico de un laboratorio):
  escríbenos a **[CORREO DE CONTACTO]**. Respondemos en el plazo que fija la
  ley.
- **Si eres paciente**: dirígete al laboratorio que te atiende. Nosotros no
  decidimos sobre esos datos y no podemos atender la solicitud directamente,
  pero estamos obligados a ayudar a tu laboratorio a cumplirla.

## 8. Seguridad

Ciframos las comunicaciones, las contraseñas se guardan con función de derivación
irreversible y no podemos leerlas, el acceso a la base está restringido por
laboratorio, y las acciones de soporte quedan registradas.

Si detectamos una brecha de seguridad que afecte datos personales, **lo
notificaremos a la ANPD dentro de las 48 horas siguientes** y avisaremos a los
laboratorios afectados, como exige el Decreto Supremo N° 016-2024-JUS.

Ninguna medida elimina el riesgo por completo, y no vamos a decir lo contrario.

## 9. Cambios en esta política

Si la modificamos, publicaremos la versión nueva con su fecha y avisaremos a los
laboratorios por correo antes de que entre en vigor.
