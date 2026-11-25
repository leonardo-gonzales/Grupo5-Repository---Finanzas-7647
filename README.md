# TortiShop V6 — Grupo 5 / Finanzas e Ingeniería Económica (SI642)

Aplicación académica web **exclusivamente frontend**, Angular, TypeScript y Angular Material. La base de datos local es **SQLite mediante sql.js (WebAssembly)**, sin servidor de aplicación, API REST, Docker ni instalación de un gestor externo. Angular CLI sirve únicamente el frontend en desarrollo.

## Ejecutar en WebStorm

Abrir la carpeta con `package.json`. Usar Node **24.15.0 o posterior de la rama 24** (o una versión compatible con Angular 22.3).

```powershell
npm ci
npm start
```

Abrir http://localhost:4200. Si PowerShell bloquea npm.ps1, ejecutar `npm.cmd ci` y `npm.cmd start`.

| Cuenta inicial | Contraseña | Rol |
|---|---|---|
| admin@tortishop.pe | TortiDemo2026 | Administrador de Tortas Gaby |
| sistema@tortishop.pe | TortiSistema2026 | Administrador del sistema |

Las cuentas de clientes y administradores de otros negocios se crean desde la pantalla de gestión. Las contraseñas creadas se guardan con sal y PBKDF2-SHA256. La autenticación y los permisos son **una simulación académica local**, no una barrera de seguridad de producción: el usuario que controla el navegador puede modificar código o datos. No introducir información personal real.

## Demostración

1. Iniciar con `sistema@tortishop.pe`; en **Negocios**, dar de alta otro negocio indicando giro, dirección, estado y credenciales de su administrador. Editar o desactivar desde la misma pantalla.
2. Cerrar sesión e ingresar con las credenciales del negocio nuevo. Crear su primera sucursal y sus propios proveedores, artículos y clientes. No comparte registros con Tortas Gaby. Dos pestañas del mismo origen y perfil de navegador pueden tener sesiones distintas.
3. Entrar con el administrador inicial. Los 5 clientes originales y 3 de prueba, productos, proveedores, categorías, sucursales e inventario permanecen; no se incluyen deudas ficticias. Editar un cliente para pactar TEA/TNA, mora nominal o efectiva anual, moneda PEN/USD, límite, máximo de cuotas, día y hora de corte, día de pago. Los tres clientes de prueba tienen condiciones preconfiguradas según el informe.
4. Crear o editar un producto/servicio: marca, descripción, unidad, proveedor opcional, imagen local PNG/JPEG/WebP o URL HTTPS, moneda de precios, precios de contado y crédito, modalidad de crédito permitida. No hay conversión automática de divisas: la moneda de crédito debe coincidir con la del artículo. Para simular los casos del informe, elegir consumo libre e ingresar el monto indicado.
5. En **Venta a Crédito**, seleccionar cliente y sucursal, producto o consumo libre, fecha/hora y número de cuotas/modalidad. Las condiciones pactadas se aplican automáticamente. Confirmar si hay cupo y el producto admite la modalidad.
6. En **Estado de cuenta y usuarios** elegir cliente, mes y fecha de cálculo/pago. Generar el listado de compras y obligaciones; el interés de gracia se informa sin cobrarlo dos veces. Registrar el total exacto del ciclo. La pantalla de crédito individual permite pagar solo si no existen otras obligaciones exigibles en el mismo pago. Los recibos aparecen en Créditos y Cronograma/Pagos.
7. Desde **Estado de cuenta y usuarios**, crear el acceso de un cliente. Ingresar con su cuenta y comprobar que solo ve su información y cronogramas, sin poder registrar pagos o editar datos.
8. Recargar el navegador para comprobar persistencia. Abrir el mismo origen en dos pestañas para probar sesiones independientes. No cambiar el puerto si se desea conservar la base de datos.

## Persistencia y cortes

SQLite: archivo `tortishop-v6.sqlite` en OPFS (almacenamiento privado del origen del navegador), tabla SQL `registros(clave, valor)`. `sql.js` se instala con npm y Angular copia sus archivos JavaScript/WASM a `assets/sqlite/`. No se necesita instalar SQLite en el sistema. Usar Chrome o Edge reciente con soporte OPFS, en localhost o HTTPS. El archivo es una base SQLite binaria real, no un JSON ni IndexedDB. Guarda el directorio y un snapshot por negocio, con catálogos, contratos, recibos, ventas, configuración y cierres; las relaciones del dominio siguen validadas en TypeScript, no se ha normalizado físicamente todo el modelo ER. Si no existe el archivo SQLite, se lee IndexedDB V5 una sola vez y se importan los datos anteriores de localStorage si falta su marca de migración. Las fuentes anteriores permanecen intactas. No ejecutar V5 y V6 simultáneamente. Cada operación espera que termine la escritura del archivo; Web Locks serializa operaciones entre pestañas cuando está disponible. Sin Web Locks usar una sola pestaña. Los cierres se generan al acceder después del corte, no con el navegador cerrado. No hay sincronización remota. Limpiar los datos del sitio elimina el archivo SQLite. No hacerlo sin respaldo. Para ver o descargar el archivo, seguir `docs/PERSISTENCIA_Y_ASISTENCIA.md`.

## Pruebas y compilación

```powershell
npm run test:local
npm test
npm run build
```

`test:local` compila TypeScript y ejecuta las pruebas financieras y de repositorio, una prueba de SQL contra SQLite nativo de Node y una prueba de exportación/reapertura con sql.js (se omite si falta la dependencia). En este entorno: 17 aprobadas, 1 omitida, 0 fallidas; TypeScript y AOT de Angular aprobados. La descarga de sql.js desde npm falló por DNS (EAI_AGAIN). La entrada de versión fijada 1.13.0 se añadió al manifiesto y lockfile; la descarga y comprobación del paquete, `npm ci`, build CLI y funcionamiento real WASM/OPFS en navegador deben verificarse en una PC con Internet y Node compatible. Si npm ci falla por el lockfile, ejecutar `npm install` para regenerarlo y luego `npm ci`. Ver `docs/RESULTADOS_TESTS.txt`.

## Alcance

Se conserva el diseño de V4 y el inventario de referencia. Compras e inventario no son módulos operativos (el enunciado no exige stock, logística ni impuestos). Los roles y negocios simultáneos están limitados al mismo navegador/origen; confirmar con el profesor que SQLite y este modo local satisfacen su interpretación de base de datos y plataforma multiusuario. No se ha implementado despliegue, sincronización remota, cobros bancarios ni facturación tributaria. No se certifica cumplimiento legal para operaciones reales.

Documentos: `docs/MATRIZ_ENUNCIADO_V5.md`, `docs/MATRIZ_VALIDACION.md`, `docs/REVISION_FORMULAS.md`, `docs/PERSISTENCIA_Y_ASISTENCIA.md`, `docs/RESULTADOS_TESTS.txt`.
