# Persistencia y asistencia técnica

## Diseño lógico de la base

- Motor: SQLite vía `sql.js` (WebAssembly), archivo binario `tortishop-v6.sqlite` en OPFS. Tabla física `registros(clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL)`. Las actualizaciones se ejecutan en una transacción SQL y se exporta el archivo; la operación espera el cierre de la escritura OPFS. No requiere backend. Web Locks serializa operaciones entre pestañas si está disponible.
- `tortishop.directory.v5`: directorio lógico de negocios y usuarios. Se conserva la estructura y las credenciales de V5. Sesión por pestaña mediante sessionStorage.
- `tortishop.local.v2` y `tortishop.local.v2.negocio.<id>`: snapshots del negocio inicial y otros negocios, ahora en SQLite. Contienen catálogos, contratos, cronogramas, recibos, ventas, configuración y cierres.
- `migration-v6-sqlite`: marca de migración. Al crear el archivo se importa la base IndexedDB V5 de solo lectura; si falta la marca de V5 se recuperan las claves antiguas de localStorage. No se borran fuentes antiguas. No usar V5 y V6 en paralelo.
- Relaciones lógicas: negocio 1:N usuarios, sucursales, clientes, artículos, proveedores, créditos, ventas; cliente 1:N créditos; crédito 1:N cuotas y recibos. La base es SQLite real, pero no se han convertido todas esas entidades en tablas normalizadas ni claves foráneas físicas. Las reglas se conservan en TypeScript.

## Consultar o respaldar el archivo SQLite

En Chrome/Edge, DevTools > Console, en la aplicación abierta, ejecutar:

```js
const root = await navigator.storage.getDirectory();
const handle = await root.getFileHandle('tortishop-v6.sqlite');
const file = await handle.getFile();
const url = URL.createObjectURL(file);
const a = document.createElement('a');
a.href = url; a.download = 'tortishop-v6.sqlite'; a.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

El archivo descargado puede abrirse con DB Browser for SQLite. Consulta: `SELECT clave, valor FROM registros;`. No borrar ni sustituir el archivo activo mientras la aplicación está abierta. La descarga es una copia, no una restauración automática.

## Ayuda de uso

| Problema | Acción |
|---|---|
| No inicia Angular | Verificar `node -v` (24.15.0+ de la rama 24) y `npm ci`; si PowerShell restringe scripts usar `npm.cmd` |
| Contraseña incorrecta | Utilizar cuenta del rol adecuado indicada en README; el administrador de sistema gestiona negocios, no créditos |
| Negocio sin sucursales | Crear una sucursal operativa primero |
| No aprueba crédito | Revisar estado activo, cupo, condiciones pactadas, máximo de cuotas, moneda y modalidad del artículo |
| Pago individual rechazado | Revisar el listado consolidado en Estado de cuenta y usuarios; pagar el total exacto |
| No se muestra un cierre | Seleccionar mes y fecha de pago; el cierre se materializa después del día/hora pactado, no si el navegador está cerrado |
| Datos de otro negocio no aparecen | Es el comportamiento esperado; cada negocio mantiene sus registros separados |
| Datos antiguos no aparecen | Abrir mismo origen y perfil de navegador; revisar el archivo SQLite y avisos de migración, no borrar claves previas |
| No se guarda | Revisar permiso de almacenamiento, espacio disponible y consola; no borrar la base ni recargar hasta entender el error |

Para uso académico local solamente. No almacenar datos personales reales ni confiar en este mecanismo como autenticación segura multiusuario por Internet.
