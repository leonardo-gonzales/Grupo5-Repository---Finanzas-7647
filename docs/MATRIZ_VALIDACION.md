# Matriz de requisitos y validación

Actualización V5: para requisitos específicos del enunciado oficial consultar MATRIZ_ENUNCIADO_V5.md.

Base: informe SI642 Trabajo Parcial, secciones 6.1–6.4 y 7, y revisión del repositorio. Los IDs son asignados para seguimiento, no aparecen en el informe. Todos los elementos indicados como implementados tienen código; la interfaz requiere la prueba manual en el equipo del grupo.

| ID | Funcionalidad | Implementación |
|---|---|---|
| RF01 | Inicio de sesión | Sesión simulada con sessionStorage, cierre de sesión, guard de rutas; tres perfiles con credenciales locales |
| RF02 | Clientes | Alta, consulta, edición, consentimiento y unicidad documental |
| RF03 | Productos | Alta, consulta, edición y eliminación; precio validado |
| RF04 | Sucursales | Alta, consulta, edición, estado y asociación de ventas |
| RF05 | Línea de crédito | Límite por cliente; rechazo de reducción por debajo de deuda |
| RF06 | Fechas | Día y hora de corte y día de pago pactados por cliente |
| RF07 | Precios | Precio al contado y a crédito |
| RF08 | Consumos | Caja al contado y ventas a crédito persistidas |
| RF09 | Aprobación de crédito | Validación en formulario y repositorio local contra deuda registrada |
| RF10–11 | Conversión de tasas | TEA/TNA a TEM con base 360; TNA diaria |
| RF12 | Ciclo de facturación | Compra posterior al corte al mes siguiente |
| RF13–15 | Gracia, interés y capitalización | Cálculo por días calendario con equivalencias mensuales |
| RF16 | Pago único | Vence en fecha de pago del ciclo; interés separado del capital |
| RF17–19 | Cuotas, método francés, cronograma | Cuota fija y ajuste final a centavos |
| RF20 | TCEA | Flujos contractuales a centavos y fechas reales/360 |
| RF21 | Saldo insoluto | Derivado del capital financiado menos amortizaciones efectivamente pagadas |
| RF22 | Mora | TNM lineal o tasa efectiva anual equivalente sobre cuota vencida; separada y no capitalizable |
| RF23 | Validaciones | Fechas, montos, tipos de tasa, cuotas, límites, consistencia de centavos |
| RF24 | Estado de cuenta | Créditos reales y listado consolidado por cliente y mes, saldo y vencimientos |
| RF25–28 | Registro, total exigible, imputación y rechazo parcial | Cuota + mora; desglose mora/interés/capital; importe exacto obligatorio |
| RF29–31 | Línea disponible, estados y liquidación | Amortización reduce capital; pagada/vencida/pendiente; saldo cero al liquidar |

## Casos del informe

Usar clientes de prueba 1, 2 y 3, respectivamente, sin otras operaciones activas. Día de corte 20 y pago 26. Las pruebas automatizadas no requieren usar la interfaz ni cargar datos personales.

| Parámetro | CP01 | CP02 | CP03 |
|---|---|---|---|
| Fecha compra | 15/09/2026 | 22/09/2026 | 06/09/2026 |
| Importe | 1000.00 | 850.00 | 1200.00 |
| Límite | 1500.00 | 2000.00 (asumido para la prueba) | 3000.00 |
| Tasa | TEA 24% | TNA 36% | TEA 30% |
| TNM | 15% (para pruebas complementarias) | 15% | 18% |
| Modalidad | 3 cuotas | Pago único | 6 cuotas |
| Fecha base | 26/09/2026 | 26/10/2026 | 26/09/2026 |
| Días de gracia/interés | 11 | 34 | 20 |
| TEM | 1.8087583% | 3.0439088% | 2.2104451% |
| Interés inicial | 6.59 | 29.38 | 17.62 |
| Capital con gracia / deuda exigible | 1006.59 | 879.38 | 1217.62 |
| Cuota habitual | 347.74 | 879.38 | 218.92 |
| TCEA | 23.7555152% | 43.3037514% | 29.6389931% |
| Mora de prueba | 0 | 5.50 (15 días) | 1.09 (10 días, cuota 2) |
| Total exigible | 347.74 | 884.88 | 220.01 (cuota 2) |
| Saldo de capital | 677.06 tras cuota 1 | 0 tras pago | 628.77 tras cuota 3 |
| Línea disponible | 822.94 tras cuota 1 | 2000.00 tras pago | 2371.23 tras cuota 3 |

CP03 tiene fechas futuras respecto del 25/11/2026. La aplicación rechaza pagos futuros. El test automatizado permite un reloj de referencia explícito para comprobar las fechas del informe sin modificar el reloj real. Para una demostración manual anticipada, usar 06/08/2026 y vencimientos 26/09, 26/10 (pago 05/11 con 10 días de atraso), 26/11; para registrar los tres pagos antes del 25/11, el tercer pago puede hacerse anticipadamente. Las fechas reales de los flujos cambian la TCEA; no exigir la misma TCEA si se cambian fechas.

## Diferencias de redondeo y decisiones

- El informe redondea interés, amortización y cuota independientemente, lo que ocasiona diferencias de uno o dos céntimos. La versión usa un saldo en centavos, interés redondeado, amortización = cuota - interés, y ajuste de la última cuota. CP01 deja 341.57 en cuota 2 y cierra con 347.75; CP03 deja 423.75 y 214.20 en cuotas 4 y 5 y cierra con 218.93. La cuota 2 de CP03 más la mora redondeada es 218.92 + 1.09 = 220.01, no 220.02. Se conserva la identidad contable y no queda residuo. La TEM de TEA 30% es 2.210445059% según la fórmula, no 2.2104527% tal como se imprime en el informe. V5 usa los flujos contractuales efectivamente programados a centavos, no las cuotas teóricas; ver REVISION_FORMULAS.md.
- El cupo se valida sobre el capital que efectivamente ocupará la línea. Si el consumo cabe pero la capitalización supera el límite, se rechaza. En pago único, el cupo se ocupa por el capital original; el interés se cobra separado.
- Si el importe de pago supera o no alcanza la cuota más la mora, se rechaza; no se admiten pagos parciales, excedentes ni pagos duplicados. Se cobra en orden de cuotas. Un pago antes del vencimiento liquida esa cuota contractual completa, no recalcula el crédito. No se implementa refinanciación ni prepago con descuento.
- Los días de corte y pago se configuran entre 1 y 31 y se exige que el día de pago sea igual o posterior al corte. Para fechas inexistentes en un mes se usa el último día. El calendario usa America/Lima, y las diferencias se calculan en UTC sin errores de zona horaria.
- Se admiten tasas de cero para pruebas sin interés y tasas ingresadas hasta 100% anual como límite técnico ilustrativo, no como certificación legal vigente. El límite legal aplicable debe revisarse antes de cualquier uso comercial. Las tasas compensatorias no se convierten en mora ni viceversa.
- Se conserva el esquema de gracia total del informe, no se añadió una modalidad de gracia parcial independiente. La aplicación es web responsiva; no incluye app móvil nativa. V5 añade tres roles locales. No hay integración de pagos bancarios, gestión logística o facturación fiscal.

## Pruebas manuales recomendadas

| Caso | Comprobación | Resultado esperado |
|---|---|---|
| CP01–03 | Reproducir escenarios de arriba | Importes y cronogramas según criterio de centavos |
| CP04 | Compra el día del corte | Mismo mes |
| CP05 | Tasa cero | Sin interés; suma capital |
| CP06–07 | Superar/igualar cupo | Rechazo de exceso; igualdad aceptada sin capitalización que exceda cupo |
| CP08–10 | Importe inválido, cuotas inválidas, fecha futura | Rechazo |
| CP11 | Compra 21/12 y fechas 20/26 | Pago 26/01 del siguiente año |
| CP12 | Revisar última cuota | Saldo 0; amortizaciones suman capital |
| CP13–14 | Confirmar venta y abrir detalle | Contrato real consultable |
| CP15–16 | Pago puntual / tardío | Mora cero / positiva separada |
| CP17–18 | Pago insuficiente / duplicado | Rechazo; no cambia la deuda |
| CP19–20 | Amortizar y liquidar | Se recupera cupo; saldo final 0 |
| CP21 | Dos créditos del mismo cliente | Suma de saldos y rechazo del exceso, incluso en sucursales distintas |
| CP22 | Recargar navegador | Registros persistentes; iniciar sesión nuevamente |
| CP23 | Contraseña equivocada y ruta directa | Rechazo; sesión obligatoria |
| CP24–25 | Crear y editar cliente | Datos persistentes; límite no menor a deuda |
| CP26–28 | Crear, editar, eliminar producto | Catálogo persistente; histórico de créditos conserva descripción |
| CP29 | Registrar/editar sucursal y vender | Sucursal queda asociada a la operación |
| CP30 | Vista móvil en DevTools 390×844 | Navegación usable, tablas con scroll horizontal |

## Verificación realizada

- `tsc --noEmit -p tsconfig.app.json`: correcta.
- `tsc --noEmit -p tsconfig.spec.json`: correcta.
- `ngc -p tsconfig.app.json --noEmit` con strictTemplates: correcta.
- Compilación TypeScript y `npm run test:local` (pruebas sin servidor): **12 pruebas aprobadas, 0 fallidas**, incluidas los tres casos del informe, invariantes contables, fechas, pagos y repositorio local con persistencia simulada tras recarga.
- Pendiente: `ng build`, ejecución de Vitest con Angular CLI y verificación visual en navegador. El entorno de preparación tiene Node v22.16.0, que no cumple los engines de Angular 22.3; el ZIP original contiene dependencias nativas de Windows. No se sustituyeron las versiones del proyecto para forzar la compilación.

### Validaciones adicionales de la revisión 4
- Inicio limpio: los 8 clientes conservan sus límites, con saldo ficticio cero; dashboard sin créditos, pagos ni ventas de ejemplo.
- Se conservan inventario, sucursales, productos, categorías y proveedores; se vacían compras de referencia.
- Proveedores: alta, edición, estado, RUC único de 11 dígitos y persistencia.
- Migración: elimina apertura ficticia una sola vez, conserva operaciones reales y evita duplicar créditos antiguos compatibles.
- Fórmulas sin modificaciones respecto a V3. Consultar REVISION_FORMULAS.md.
