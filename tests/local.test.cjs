const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLocalStore } = require('./generated/app/core/services/local-store.js');
class MemoryStorage {
  map = new Map();
  getItem(k) {
    return this.map.get(k) ?? null;
  }
  setItem(k, v) {
    this.map.set(k, v);
  }
  removeItem(k) {
    this.map.delete(k);
  }
}
test('Almacenamiento local: sesión, catálogo, crédito, pagos, caja y recarga', async () => {
  const storage = new MemoryStorage();
  let app = createLocalStore(storage, new MemoryStorage(), () => '2026-12-31');
  async function req(url, method = 'GET', body, status = 200) {
    if (status >= 400) {
      await assert.rejects(app.request(url, method, body));
      return;
    }
    return app.request(url, method, body);
  }
  await req('/creditos', 'GET', undefined, 401);
  await req('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'wrong' }, 401);
  await req('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  const c = await req(
    '/catalog/clientes',
    'POST',
    {
      nombres_razon_social: 'Test',
      dni_ruc: '12345670',
      telefono_cliente: '123456789',
      correo: 'test@example.test',
      limite_credito: 1500,
      estado: 'Activo',
      consentimiento: true,
    },
    201,
  );
  const prod = await req(
    '/catalog/productos',
    'POST',
    {
      sku: 'TEST-001',
      nombre_producto: 'Torta test',
      categoria_producto: 'Tortas',
      precio_contado: 45,
      precio_credito: 52,
      stock_referencial: 10,
      estado_disponibilidad: 'Disponible',
    },
    201,
  );
  await req('/catalog/productos/' + prod.producto_id, 'PUT', { ...prod, precio_contado: 50 });
  const s = await req(
    '/catalog/sucursales',
    'POST',
    {
      nombre_sucursal: 'Test',
      direccion_sucursal: 'Test 1',
      telefono_sucursal: '123',
      distrito_sucursal: 'Surco',
      estado: 'Operativa',
    },
    201,
  );
  const entrada = {
    monto: 1000,
    limite: 99999,
    pendientes: 0,
    fechaCompra: '2026-09-15',
    diaCorte: 20,
    diaPago: 26,
    cuotas: 3,
    tipoTasa: 'TEA',
    tasa: 0.24,
    tnm: 0.15,
    modalidad: 'cuotas',
  };
  const v = await req(
    '/creditos',
    'POST',
    { clienteId: c.cliente_id, productoId: prod.producto_id, sucursalId: s.sucursal_id, entrada },
    201,
  );
  assert.equal(v.entrada.limite, 1500);
  await req(
    '/creditos',
    'POST',
    { clienteId: c.cliente_id, sucursalId: s.sucursal_id, entrada },
    400,
  );
  await req(
    `/creditos/${v.id}/pagos`,
    'POST',
    { cuota: 1, fecha: '2026-10-26', monto: 300, metodo: 'Efectivo' },
    400,
  );
  const paid = await req(
    `/creditos/${v.id}/pagos`,
    'POST',
    { cuota: 1, fecha: '2026-10-26', monto: 347.74, metodo: 'Efectivo' },
    201,
  );
  assert.equal(paid.pagos[0].capital, 329.53);
  await req(
    `/creditos/${v.id}/pagos`,
    'POST',
    { cuota: 1, fecha: '2026-10-26', monto: 347.74, metodo: 'Efectivo' },
    400,
  );
  const cash = await req(
    '/ventas-contado',
    'POST',
    {
      sucursalId: s.sucursal_id,
      items: [{ productoId: prod.producto_id, cantidad: 2, total: 1 }],
    },
    201,
  );
  assert.equal(cash.total, 100);
  await req('/catalog/productos/' + prod.producto_id, 'DELETE');
  await req('/config', 'PUT', {
    diaCorte: 20,
    diaPago: 26,
    tipoTasa: 'TNA',
    tasaPct: 36,
    tnmPct: 15,
    cuotas: 3,
  });
  await req('/logout', 'POST', {});
  await req('/creditos', 'GET', undefined, 401);
  app = createLocalStore(storage, new MemoryStorage(), () => '2026-12-31');
  await req('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  const credits = await req('/creditos');
  assert.equal(credits.length, 1);
  assert.equal(credits[0].pagos.length, 1);
  assert.equal((await req('/ventas-contado')).length, 1);
  assert.equal((await req('/config')).tipoTasa, 'TNA');
  assert.ok((await req('/data/clientes')).some((x) => x.cliente_id === c.cliente_id));
});

test('Inicio limpio; conserva proveedores y persiste cambios', async () => {
  const storage = new MemoryStorage(),
    session = new MemoryStorage();
  let app = createLocalStore(storage, session, () => '2026-12-31');
  await app.request('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  const req = (...args) => app.request(...args);
  const clients = await req('/data/clientes');
  assert.deepEqual(
    clients.slice(0, 5).map((c) => c.saldo_utilizado),
    [0, 0, 0, 0, 0],
  );
  assert.equal(clients[0].credito_disponible, 1500);
  assert.equal(
    Object.values(await req('/apertura')).reduce((a, b) => a + b, 0),
    0,
  );
  const refs = await req('/historico');
  assert.equal(refs.creditos.contratoActivo, null);
  assert.equal(refs.pagos.length, 0);
  assert.equal((await req('/creditos')).length, 0);
  assert.equal((await req('/data/inventario')).length, 4);
  assert.equal((await req('/data/sucursales')).length, 3);
  assert.equal((await req('/data/compras')).length, 0);
  assert.equal(refs.dashboard.ultimosMovimientos.length, 0);
  assert.equal(refs.ventas, null);
  const suppliers = await req('/data/proveedores');
  assert.equal(suppliers.length, 4);
  const original = suppliers[0];
  await req('/catalog/proveedores/1', 'PUT', { ...original, contacto: 'Nuevo contacto' });
  const supplier = { ...original, ruc: '20123456789', razon_social: 'Proveedor nuevo' };
  await req('/catalog/proveedores', 'POST', supplier);
  await assert.rejects(req('/catalog/proveedores', 'POST', supplier));
  await assert.rejects(req('/catalog/proveedores', 'POST', { ...supplier, ruc: '123' }));
  await assert.rejects(
    req('/creditos', 'POST', {
      clienteId: 1,
      sucursalId: 1,
      entrada: {
        monto: 1501,
        fechaCompra: '2026-09-15',
        diaCorte: 20,
        diaPago: 26,
        cuotas: 3,
        tipoTasa: 'TEA',
        tasa: 0.24,
        tnm: 0.15,
        modalidad: 'cuotas',
      },
    }),
  );
  app = createLocalStore(storage, session, () => '2026-12-31');
  assert.equal((await req('/data/proveedores')).length, 5);
  assert.equal(
    (await req('/data/proveedores')).find((p) => p.proveedor_id === 1).contacto,
    'Nuevo contacto',
  );
  assert.equal((await req('/data/clientes'))[0].saldo_utilizado, 0);
});

test('Migra v2 y créditos de versión original sin repetir ni borrar operaciones', async () => {
  const storage = new MemoryStorage(),
    session = new MemoryStorage();
  let app = createLocalStore(storage, session, () => '2026-12-31');
  await app.request('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  const req = (...args) => app.request(...args);
  const entrada = {
    monto: 100,
    limite: 1500,
    pendientes: 0,
    fechaCompra: '2026-09-15',
    diaCorte: 20,
    diaPago: 26,
    cuotas: 3,
    tipoTasa: 'TEA',
    tasa: 0.24,
    tnm: 0.15,
    modalidad: 'cuotas',
  };
  const current = await req('/creditos', 'POST', { clienteId: 1, sucursalId: 1, entrada });
  const key = 'tortishop.local.v2';
  const v2 = JSON.parse(storage.getItem(key));
  v2.opening = { 1: 600 };
  delete v2.sampleBalancesCleared;
  delete v2.legacyImported;
  delete v2.catalog.proveedores;
  delete v2.next.proveedores;
  storage.setItem(key, JSON.stringify(v2));
  const old = { ...current, id: 'CR-0001', entrada: { ...entrada } };
  delete old.entrada.modalidad;
  delete old.entrada.tnm;
  storage.setItem('tortishop-ventas-credito', JSON.stringify([old, old]));
  app = createLocalStore(storage, session, () => '2026-12-31');
  const migrated = await req('/creditos');
  assert.equal(migrated.length, 2);
  assert.equal(migrated.find((x) => x.id === 'CR-0001').entrada.tnm, 0);
  assert.equal(migrated.find((x) => x.id === 'CR-0001').legacy, true);
  assert.ok(storage.getItem('tortishop-ventas-credito'));
  assert.equal(
    (await req('/data/clientes'))[0].saldo_utilizado,
    Math.round(2 * current.resultado.saldoCapitalizado * 100) / 100,
  );
  app = createLocalStore(storage, session, () => '2026-12-31');
  assert.equal((await req('/creditos')).length, 2);
});

test('V5: negocios separados, alta/baja, permisos y acceso cliente', async () => {
  const mem = new MemoryStorage(),
    sess = new MemoryStorage();
  const app = createLocalStore(mem, sess, () => '2026-12-31', true);
  const req = (...a) => app.request(...a);
  await req('/login', 'POST', { usuario: 'sistema@tortishop.pe', clave: 'TortiSistema2026' });
  const biz = await req('/negocios', 'POST', {
    nombre: 'Barbería',
    giro: 'Servicios',
    direccion: 'Lima',
    estado: 'Activo',
    usuario: 'barber',
    clave: 'clave1234',
  });
  await assert.rejects(req('/data/clientes'));
  await req('/logout', 'POST');
  await req('/login', 'POST', { usuario: 'barber', clave: 'clave1234' });
  assert.deepEqual(await req('/data/clientes'), []);
  assert.deepEqual(await req('/data/inventario'), []);
  assert.deepEqual(await req('/data/sucursales'), []);
  const c = await req('/catalog/clientes', 'POST', {
    nombres_razon_social: 'Cliente barbería',
    dni_ruc: '12345678',
    telefono_cliente: '123456789',
    correo: 'test@example.test',
    limite_credito: 1000,
    estado: 'Activo',
    consentimiento: true,
  });
  await req('/usuarios', 'POST', {
    clienteId: c.cliente_id,
    usuario: 'clienteBarber',
    clave: 'clave1234',
  });
  await req('/logout', 'POST');
  await req('/login', 'POST', { usuario: 'clienteBarber', clave: 'clave1234' });
  assert.equal((await req('/data/clientes')).length, 1);
  await assert.rejects(req('/catalog/clientes', 'POST', {}));
  await assert.rejects(req('/data/productos'));
  await req('/logout', 'POST');
  await req('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  assert.equal((await req('/data/clientes')).length, 8);
  assert.equal((await req('/data/inventario')).length, 4);
  await req('/logout', 'POST');
  await req('/login', 'POST', { usuario: 'sistema@tortishop.pe', clave: 'TortiSistema2026' });
  await req('/negocios', 'POST', { ...biz, estado: 'Inactivo' });
  await req('/logout', 'POST');
  await assert.rejects(req('/login', 'POST', { usuario: 'barber', clave: 'clave1234' }));
});

test('V5: condiciones por cliente y modalidades del producto, pago consolidado y cierre', async () => {
  const mem = new MemoryStorage(),
    sess = new MemoryStorage();
  const app = createLocalStore(mem, sess, () => '2026-12-31', true);
  const req = (...a) => app.request(...a);
  await req('/login', 'POST', { usuario: 'admin@tortishop.pe', clave: 'TortiDemo2026' });
  const c = (await req('/data/clientes'))[0];
  await req('/catalog/clientes/1', 'PUT', {
    ...c,
    tipoTasa: 'TNA',
    tasaPct: 36,
    tipoMora: 'TEMORA',
    tnmPct: 18,
    maxCuotas: 2,
    horaCorte: '14:00',
  });
  const p = (await req('/data/productos'))[0];
  await req('/catalog/productos/1', 'PUT', {
    ...p,
    marca: 'Gaby',
    unidad: 'Unidad',
    descripcion: 'Torta',
    tipoArticulo: 'Producto',
    proveedorId: 1,
    pagoUnico: 'Sí',
    pagoCuotas: 'No',
  });
  const entrada = {
    monto: 100,
    fechaCompra: '2026-09-20',
    horaCompra: '14:01',
    diaCorte: 20,
    diaPago: 26,
    cuotas: 3,
    tipoTasa: 'TEA',
    tasa: 0,
    tnm: 0,
    modalidad: 'cuotas',
  };
  await assert.rejects(
    req('/creditos', 'POST', { clienteId: 1, sucursalId: 1, productoId: 1, entrada }),
  );
  await assert.rejects(req('/creditos', 'POST', { clienteId: 1, sucursalId: 1, entrada }));
  const v = await req('/creditos', 'POST', {
    clienteId: 1,
    sucursalId: 1,
    productoId: 1,
    entrada: { ...entrada, modalidad: 'unico' },
  });
  assert.equal(v.entrada.tipoTasa, 'TNA');
  assert.equal(v.entrada.tasa, 0.36);
  assert.equal(v.entrada.tipoMora, 'TEMORA');
  assert.equal(v.resultado.fechaPago, '2026-10-26');
  const v2 = await req('/creditos', 'POST', {
    clienteId: 1,
    sucursalId: 1,
    entrada: { ...entrada, fechaCompra: '2026-09-21', modalidad: 'unico' },
  });
  const query = '/estado-cuenta?clienteId=1&hasta=2026-10-26&fecha=2026-11-10';
  const reporte = await req(query);
  assert.equal(reporte.rows.length, 2);
  assert.equal(reporte.cierre.rows.length, 2);
  assert.equal(reporte.rows[0].id, v.id);
  assert.equal(reporte.rows[1].id, v2.id);
  assert.ok(reporte.rows.every((r) => r.mora > 0));
  await assert.rejects(
    req(`/creditos/${v.id}/pagos`, 'POST', {
      cuota: 1,
      fecha: '2026-11-10',
      monto: reporte.rows[0].total,
      metodo: 'Efectivo',
    }),
  );
  const pay = {
    clienteId: 1,
    hasta: '2026-10-26',
    fecha: '2026-11-10',
    metodo: 'Efectivo',
    monto: reporte.total,
  };
  await assert.rejects(req('/pago-ciclo', 'POST', { ...pay, monto: pay.monto - 0.01 }));
  await req('/pago-ciclo', 'POST', pay);
  assert.equal((await req('/data/clientes')).find((c) => c.cliente_id === 1).saldo_utilizado, 0);
  assert.equal((await req(query)).rows.length, 0);
  await assert.rejects(req('/pago-ciclo', 'POST', pay));
});
