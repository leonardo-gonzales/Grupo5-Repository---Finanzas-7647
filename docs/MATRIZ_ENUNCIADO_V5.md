# Matriz de cumplimiento técnico — enunciado SI642, 2026-20

Base: SI642_Enunciado del Trabajo Final 2026-20.pdf, páginas 2–3 (requisitos 1–6), 5 y 7 (sistema de información y base de datos), 8 (Anexo A). La implementación es local, no se certifica su cumplimiento integral hasta la prueba de interfaz y la aceptación académica de esa arquitectura.

| Requisito | Implementación V6 | Validación |
|---|---|---|
| Sistema genérico para múltiples tiendas | Directorio de negocios, giro editable, catálogo/créditos por negocio | Prueba de repositorio; simultaneidad de navegador pendiente |
| 1. Alta/baja de tiendas | Administración de sistema, estados, credenciales de administrador | Prueba de repositorio |
| 1. Acceso de administrador y cliente | Tres perfiles, guard de rutas, comprobación de permisos en servicios locales, portal de cliente, credenciales PBKDF2 | Prueba de repositorio; interfaz pendiente |
| 2. Alta/baja de productos y servicios | Formulario extendido y desactivación/eliminación, marca/descripción/unidad/proveedor/imagen, precios y modalidad | Prueba de repositorio parcial; formulario e imagen pendientes |
| 3. Alta/baja de clientes y condiciones | Tasa TEA/TNA, mora nominal/efectiva anual, moneda, límite, plazo máximo, día/hora de corte, día de pago, estado | Prueba de repositorio; UI pendiente |
| 4. Francés con gracia total | Conserva fórmulas base, capitalización, meses de 30, ajuste al último día cuando corresponde | Casos 1 y 3 y fechas límite |
| 5. Pago único, intereses y mora, límite y no pago parcial | Modalidad única, interés diario equivalente, corte por hora, mora nominal o efectiva, exactitud de pago, bloqueo de pago individual si hay más obligaciones exigibles | Caso 2 y pruebas nuevas |
| 6. Listado por corte | Estado de cuenta por cliente/mes ordenado por fecha, cierres materializados al acceder después del corte, desglose, pago consolidado | Prueba de repositorio; UI y ejecución con reloj real pendientes |
| 9. Login/password y base de datos | Sesión local, SQLite WASM/OPFS, operaciones persistentes; importación de V5/V4 | Lógica de repositorio y SQL nativo aprobadas; WASM/OPFS y migración real pendientes |
| 9. Ayuda y asistencia | Ayudas contextuales en formularios, README y guía de asistencia | Revisión del código, interfaz pendiente |
| Anexo A | 360/30, conversiones, prelación mora/interés/capital, 2 decimales y tasas mostradas con 7 decimales | Pruebas financieras |

## Validación pendiente en WebStorm

1. `npm ci`, `npm run build`, `npm start`; comprobar consola y pantalla de login.
2. Entrar con administrador inicial; editar un cliente y un proveedor, añadir un producto/servicio con imagen y verificar al recargar. Crear/editar sucursal. Inactivar cliente y producto; comprobar rechazo de venta.
3. Crear negocio de otro giro con cuenta propia y sucursal, cliente y artículo distintos; abrir dos pestañas e iniciar sesiones de negocios diferentes, comprobar aislamiento y persistencia. Desactivar negocio desde cuenta de sistema y verificar que no puede iniciar sesión. Crear cuenta cliente y verificar que rutas y operaciones administrativas se rechazan.
4. Probar los 3 casos del informe con clientes de prueba y consumo libre. Ver matriz previa actualizada y revisión de fórmulas; el caso 3 incluye fechas posteriores al 25/11/2026, por lo que su validación automatizada usa reloj explícito (no registrar pagos futuros en la interfaz).
5. Crear dos compras de pago único del mismo cliente y ciclo, consultar estado de cuenta, confirmar orden cronológico, interés y mora, rechazar un céntimo menos y pago individual cuando corresponda, pagar total y verificar saldo/cupo/dashboard/recibos.
6. Configurar producto sin cuotas y cliente con máximo 2; comprobar rechazos y selección automática de tasas. Probar mora efectiva, corte 14:00 con compra 14:01 y vencimientos 31 tras febrero. Probar precios en USD y PEN sin mezclarlos.
7. Seguir la guía de respaldo SQLite, abrir el archivo con DB Browser for SQLite y consultar registros. Recargar y cerrar/abrir navegador. Para migración real, realizar una operación en V5 en el mismo origen, cerrar V5, abrir V6 y comprobar que aparece una sola vez. Mantener copia de datos anteriores.
8. Revisar interfaz a 390×844 y verificar formularios, imágenes y scroll horizontal.

## Límites y decisiones

- No existe servicio remoto; las tiendas pueden coexistir en el mismo perfil de navegador y origen, no desde dispositivos independientes. Los cierres se generan al acceder/consultar; no hay tarea programada cuando la aplicación está cerrada. La reconstrucción histórica usa las condiciones actuales del cliente para identificar el ciclo; cada crédito conserva sus condiciones contractuales originales.
- SQLite usa una tabla física de registros con snapshots JSON; no reproduce todas las entidades como tablas normalizadas. La lógica relaciona identificadores de entidades dentro de snapshots. Confirmar aceptación con el profesor.
- Se mantienen cortes/pagos con día de pago igual o posterior al corte; hora inclusiva con precisión de minuto, límite técnico de tasas 0–100%, máximo 60 cuotas; no se certifica tope legal. PEN/USD sin cambio de divisa. TCEA de flujos contractuales reales a centavos, sin gastos/comisiones/seguros no pactados ni mora futura.
- Inventario y compras son referencia; la gestión de stock y los impuestos no son obligatorios (página 3). No se modifica el informe original. Declarar ayuda de IA conforme a página 5 (herramienta, integrante, solicitudes, cambios aceptados/rechazados, porcentaje calculado por grupo).
