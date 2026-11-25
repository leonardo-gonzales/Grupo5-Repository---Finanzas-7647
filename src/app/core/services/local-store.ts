import { conSQLite } from './sqlite-store';
import { procesarVentaCredito, r2, hoyLocal, fechaValida } from '../finanzas/motor-financiero';
import { condiciones, articulo, ciclo, fechasCiclo, horaLima } from './condiciones';
import { saldoVenta, registrarPago, VentaGuardada } from '../finanzas/pagos';
import pagos from '../../../data/pagos.json';
import dashboard from '../../../data/dashboard.json';
import categorias from '../../../data/categorias.json';
import sucursales from '../../../data/sucursales.json';
import productos from '../../../data/productos.json';
import creditos from '../../../data/creditos.json';
import proveedores from '../../../data/proveedores.json';
import inventario from '../../../data/inventario.json';
import clientes from '../../../data/clientes.json';
import ventas_pos_muestra from '../../../data/ventas-pos-muestra.json';
import compras from '../../../data/compras.json';

const catalogos: Record<string, string> = {
  clientes: 'cliente_id',
  productos: 'producto_id',
  sucursales: 'sucursal_id',
  proveedores: 'proveedor_id',
};
const seeds: Record<string, any> = {
  clientes,
  productos,
  sucursales,
  categorias,
  compras,
  inventario,
  proveedores,
  dashboard,
  creditos,
  pagos,
  'ventas-pos-muestra': ventas_pos_muestra,
};
export const STORAGE_KEY = 'tortishop.local.v2';
const SESSION_KEY = 'tortishop.local.session';
const check = (ok: unknown, msg: string) => {
  if (!ok) throw new Error(msg);
};
const str = (x: any, max = 200) =>
  typeof x === 'string' && x.trim().length > 0 && x.trim().length <= max;
const money = (x: any) =>
  typeof x === 'number' &&
  Number.isFinite(x) &&
  x >= 0 &&
  x <= 99999999 &&
  Math.abs(x - r2(x)) < 1e-7;
const idOk = (x: any) => Number.isSafeInteger(x) && x > 0;
export interface LocalStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
interface State {
  catalog: Record<string, any[]>;
  next: Record<string, number>;
  credits: VentaGuardada[];
  cash: any[];
  config: any;
  opening: Record<string, number>;
  legacyImported: boolean;
  sampleBalancesCleared?: boolean;
  migrationWarnings: string[];
  cierres?: Record<string, any>;
}
function initial(): State {
  const catalog = structuredClone({ clientes, productos, sucursales, proveedores }) as Record<
    string,
    any[]
  >;

  const next = Object.fromEntries(
    Object.entries(catalogos).map(([t, k]) => [t, Math.max(0, ...catalog[t].map((x) => x[k])) + 1]),
  );
  return {
    catalog,
    next,
    opening: Object.fromEntries(clientes.map((c) => [c.cliente_id, c.saldo_utilizado])),
    legacyImported: false,
    sampleBalancesCleared: true,
    migrationWarnings: [],
    credits: [],
    cash: [],
    config: { diaCorte: 20, diaPago: 26, tipoTasa: 'TEA', tasaPct: 24, tnmPct: 15, cuotas: 3 },
  };
}
/** Repositorio local; no HTTP ni servidor. Cada escritura guarda un único snapshot. */
export function createLocalStore(
  storage: LocalStoragePort,
  session: LocalStoragePort,
  today = hoyLocal,
  strict = false,
) {
  let state: State;
  type Account = {
    usuario: string;
    clave?: string;
    sal?: string;
    hash?: string;
    rol: 'sistema' | 'negocio' | 'cliente';
    negocio: number;
    clienteId?: number;
  };
  type Business = {
    id: number;
    nombre: string;
    giro: string;
    direccion: string;
    estado: string;
    ruc?: string;
    telefono?: string;
    correo?: string;
  };
  const directoryKey = 'tortishop.directory.v5';
  const directory = (): { negocios: Business[]; usuarios: Account[] } =>
    JSON.parse(
      storage.getItem(directoryKey) ??
        JSON.stringify({
          negocios: [
            {
              id: 1,
              nombre: 'Tortas Gaby',
              giro: 'Pastelería',
              direccion: 'Surco',
              estado: 'Activo',
            },
          ],
          usuarios: [
            {
              usuario: 'admin@tortishop.pe',
              sal: 'tortishop-demo-admin-v5',
              hash: 'b4d7fd184c367bd0cc2aa23926c78fc9a4b00720ecbd53ece9deeb532901ded3',
              rol: 'negocio',
              negocio: 1,
            },
            {
              usuario: 'sistema@tortishop.pe',
              sal: 'tortishop-demo-system-v5',
              hash: 'c1b68e51901b9e5f007718b13c4e712def46ab83215abbd8beb626de154f8feb',
              rol: 'sistema',
              negocio: 0,
            },
          ],
        }),
    );
  let account: Account;
  let stateKey = STORAGE_KEY;
  const saveDirectory = (d: ReturnType<typeof directory>) =>
    storage.setItem(directoryKey, JSON.stringify(d));
  async function hashClave(clave: string, sal: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(clave), 'PBKDF2', false, [
      'deriveBits',
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(sal), iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    );
    return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function credencial(clave: string) {
    const sal = crypto.randomUUID();
    return { sal, hash: await hashClave(clave, sal) };
  }

  const read = (): State => {
    const raw = storage.getItem(stateKey);
    let v: State;
    try {
      v = raw === null ? initial() : JSON.parse(raw);
      check(
        v.catalog && v.next && Array.isArray(v.credits) && Array.isArray(v.cash) && v.config,
        'Datos locales inválidos',
      );
    } catch {
      throw Error('Datos locales dañados. Conserva una copia antes de restablecerlos.');
    }
    let changed = raw === null;
    if (raw === null && stateKey !== STORAGE_KEY) {
      v.catalog = { clientes: [], productos: [], sucursales: [], proveedores: [] };
      v.next = { clientes: 1, productos: 1, sucursales: 1, proveedores: 1 };
      v.opening = {};
      v.legacyImported = true;
    }
    for (const c of v.catalog['clientes']) {
      const defaults =
        c.cliente_id === 7 && stateKey === STORAGE_KEY
          ? { ...condiciones, tipoTasa: 'TNA', tasaPct: 36, maxCuotas: 1 }
          : c.cliente_id === 8 && stateKey === STORAGE_KEY
            ? { ...condiciones, tasaPct: 30, tnmPct: 18, maxCuotas: 6 }
            : c.cliente_id === 6 && stateKey === STORAGE_KEY
              ? { ...condiciones, maxCuotas: 3 }
              : condiciones;
      for (const [k, val] of Object.entries(defaults))
        if (c[k] === undefined) {
          c[k] = val;
          changed = true;
        }
    }
    for (const p of v.catalog['productos']) {
      for (const [k, val] of Object.entries(articulo))
        if (p[k] === undefined) {
          p[k] = val;
          changed = true;
        }
    }
    // V4: remove only fictitious opening balances; preserve actual credits, payments and cash sales.
    if (!v.sampleBalancesCleared || !v.opening) {
      v.opening = {};
      for (const c of v.catalog['clientes']) {
        c.saldo_utilizado = 0;
        c.credito_disponible = c.limite_credito;
      }
      v.sampleBalancesCleared = true;
      changed = true;
    }
    if (!v.catalog['proveedores']) {
      v.catalog['proveedores'] = structuredClone(proveedores);
      v.next['proveedores'] = Math.max(0, ...proveedores.map((x) => x.proveedor_id)) + 1;
      changed = true;
    }
    v.migrationWarnings ??= [];
    if (!v.legacyImported) {
      const old = storage.getItem('tortishop-ventas-credito');
      if (old !== null) {
        try {
          const legacy = JSON.parse(old);
          check(Array.isArray(legacy), 'Formato anterior inválido');
          for (const x of legacy) {
            if (v.credits.some((c) => c.id === x?.id)) continue;
            const client = v.catalog['clientes'].find((c) => c.cliente_id === x?.clienteId);
            const rows = x?.resultado?.cronograma;
            if (
              !client ||
              typeof x.id !== 'string' ||
              !/^CR-[\w-]+$/.test(x.id) ||
              !x.entrada ||
              !x.resultado?.aprobada ||
              !money(x.resultado.saldoCapitalizado) ||
              !Array.isArray(rows) ||
              !rows.length ||
              rows.some(
                (f: any) =>
                  !money(f.amortizacion) ||
                  !money(f.cuota) ||
                  !money(f.interes) ||
                  !fechaValida(f.vencimiento),
              ) ||
              Math.abs(
                rows.reduce((a: number, f: any) => a + f.amortizacion, 0) -
                  x.resultado.saldoCapitalizado,
              ) >
                0.005 * (rows.length + 1) + 1e-7 ||
              rows.some((f: any, i: number) => f.k !== i + 1) ||
              !fechaValida(x.entrada.fechaCompra)
            ) {
              v.migrationWarnings.push(
                'Crédito anterior no importado por datos incompletos: ' +
                  String(x?.id ?? 'sin código'),
              );
              continue;
            }
            // El motor anterior no tenía modalidad ni TNM. No inventar una tasa moratoria.
            v.credits.push({
              ...x,
              entrada: { ...x.entrada, modalidad: 'cuotas', tnm: 0 },
              pagos: [],
              legacy: true,
            });
          }
        } catch {
          v.migrationWarnings.push(
            'No se pudo leer el almacenamiento anterior; se conserva intacto.',
          );
        }
      }
      v.legacyImported = true;
      changed = true;
    }
    if (changed) storage.setItem(stateKey, JSON.stringify(v));
    return v;
  };
  const list = (t: string): any[] => state.catalog[t];
  const get = (t: string, id: number): any => list(t).find((x) => x[catalogos[t]] === id);
  const debt = (id: number) =>
    r2(
      (state.opening[id] ?? 0) +
        state.credits.filter((v) => v.clienteId === id).reduce((s, v) => s + saldoVenta(v), 0),
    );
  const commit = <T>(v: T): T => {
    storage.setItem(stateKey, JSON.stringify(state));
    return structuredClone(v);
  };
  const validCatalog = (table: string, b: any, old: any) => {
    if (table === 'clientes') {
      check(
        str(b.nombres_razon_social) &&
          str(b.telefono_cliente, 40) &&
          str(b.correo) &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.correo),
        'Nombre, teléfono y correo válidos requeridos',
      );
      check(
        typeof b.dni_ruc === 'string' && /^(\d{8}|\d{11})$/.test(b.dni_ruc),
        'DNI/RUC inválido',
      );
      check(
        money(b.limite_credito) && ['Activo', 'Inactivo'].includes(b.estado),
        'Límite o estado inválido',
      );
      check(
        !list(table).some((x) => x.dni_ruc === b.dni_ruc && x.cliente_id !== old?.cliente_id),
        'DNI/RUC duplicado',
      );
      if (!old) check(b.consentimiento === true, 'Se requiere consentimiento del cliente');
      if (old)
        check(
          b.limite_credito >= debt(old.cliente_id),
          'El límite no puede ser menor a la deuda vigente',
        );
      return {
        ...validConditions(b, old),
        nombres_razon_social: b.nombres_razon_social.trim(),
        dni_ruc: b.dni_ruc,
        telefono_cliente: b.telefono_cliente.trim(),
        correo: b.correo.trim(),
        limite_credito: b.limite_credito,
        saldo_utilizado: 0,
        credito_disponible: b.limite_credito,
        estado: b.estado,
        consentimiento_en: old?.consentimiento_en || (!old ? new Date().toISOString() : null),
      };
    }
    if (table === 'productos') {
      check(
        str(b.sku, 40) && str(b.nombre_producto) && str(b.categoria_producto),
        'SKU, nombre y categoría requeridos',
      );
      check(
        money(b.precio_contado) &&
          b.precio_contado > 0 &&
          money(b.precio_credito) &&
          b.precio_credito > 0 &&
          Number.isSafeInteger(b.stock_referencial) &&
          b.stock_referencial >= 0 &&
          ['Disponible', 'No disponible'].includes(b.estado_disponibilidad),
        'Precios, stock o estado inválidos',
      );
      check(
        !list(table).some(
          (x) =>
            x.sku.toLowerCase() === b.sku.trim().toLowerCase() &&
            x.producto_id !== old?.producto_id,
        ),
        'SKU duplicado',
      );
      return {
        ...validArticle(b, old),
        sku: b.sku.trim(),
        nombre_producto: b.nombre_producto.trim(),
        categoria_producto: b.categoria_producto.trim(),
        precio_contado: b.precio_contado,
        precio_credito: b.precio_credito,
        stock_referencial: b.stock_referencial,
        estado_disponibilidad: b.estado_disponibilidad,
        icono: old?.icono || '🍰',
      };
    }
    if (table === 'proveedores') {
      check(
        ['razon_social', 'contacto', 'telefono', 'rubro'].every((k) => str(b[k])) &&
          ['Activo', 'Inactivo'].includes(b.estado),
        'Complete los datos del proveedor',
      );
      check(typeof b.ruc === 'string' && /^\d{11}$/.test(b.ruc), 'RUC debe tener 11 dígitos');
      check(
        !list(table).some((x) => x.ruc === b.ruc && x.proveedor_id !== old?.proveedor_id),
        'RUC duplicado',
      );
      return {
        razon_social: b.razon_social.trim(),
        ruc: b.ruc,
        contacto: b.contacto.trim(),
        telefono: b.telefono.trim(),
        rubro: b.rubro.trim(),
        estado: b.estado,
      };
    }
    check(
      ['nombre_sucursal', 'direccion_sucursal', 'telefono_sucursal', 'distrito_sucursal'].every(
        (k) => str(b[k]),
      ) && ['Operativa', 'Inactiva', 'Mantenimiento'].includes(b.estado),
      'Datos o estado de sucursal inválidos',
    );
    return {
      nombre_sucursal: b.nombre_sucursal.trim(),
      direccion_sucursal: b.direccion_sucursal.trim(),
      telefono_sucursal: b.telefono_sucursal.trim(),
      distrito_sucursal: b.distrito_sucursal.trim(),
      estado: b.estado,
    };
  };
  function validConditions(b: any, old: any) {
    const x: any = {
      ...condiciones,
      ...Object.fromEntries(
        Object.keys(condiciones).map((k) => [k, b[k] ?? old?.[k] ?? (condiciones as any)[k]]),
      ),
    };
    check(
      ['TEA', 'TNA'].includes(x.tipoTasa) &&
        ['TNM', 'TEMORA'].includes(x.tipoMora) &&
        ['PEN', 'USD'].includes(x.moneda) &&
        [x.tasaPct, x.tnmPct].every((n) => Number.isFinite(n) && n >= 0 && n <= 100) &&
        Number.isInteger(x.maxCuotas) &&
        x.maxCuotas >= 1 &&
        x.maxCuotas <= 60 &&
        [x.diaCorte, x.diaPago].every((n) => Number.isInteger(n) && n >= 1 && n <= 31) &&
        x.diaPago >= x.diaCorte &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(x.horaCorte),
      'Condiciones crediticias inválidas',
    );
    if (old && debt(old.cliente_id) > 0)
      check(x.moneda === old.moneda, 'No cambie moneda con deuda vigente');
    return x;
  }
  function validArticle(b: any, old: any) {
    const x: any = {
      ...articulo,
      ...Object.fromEntries(
        Object.keys(articulo).map((k) => [k, b[k] ?? old?.[k] ?? (articulo as any)[k]]),
      ),
    };
    check(
      ['Producto', 'Servicio'].includes(x.tipoArticulo) &&
        ['PEN', 'USD'].includes(x.monedaPrecio) &&
        [x.marca, x.descripcion, x.unidad].every((v) => str(v)) &&
        ['Sí', 'No'].includes(x.pagoUnico) &&
        ['Sí', 'No'].includes(x.pagoCuotas) &&
        (!x.proveedorId || get('proveedores', x.proveedorId)) &&
        typeof x.imagen === 'string' &&
        x.imagen.length <= 2000000 &&
        (!x.imagen ||
          /^data:image\/(png|jpeg|webp);base64,/.test(x.imagen) ||
          /^https:\/\//.test(x.imagen)),
      'Datos del artículo inválidos',
    );
    return x;
  }
  const configValida = (b: any) =>
    [b.diaCorte, b.diaPago].every((d) => Number.isInteger(d) && d >= 1 && d <= 31) &&
    b.diaPago >= b.diaCorte &&
    ['TEA', 'TNA'].includes(b.tipoTasa) &&
    money(b.tasaPct) &&
    b.tasaPct <= 100 &&
    money(b.tnmPct) &&
    b.tnmPct <= 100 &&
    Number.isInteger(b.cuotas) &&
    b.cuotas >= 1 &&
    b.cuotas <= 60;

  const request = async <T>(url: string, method = 'GET', body?: unknown): Promise<T> => {
    const b = body as any;
    const result = (v: unknown) => structuredClone(v) as T;
    const p = url;
    const m = method;
    const d = directory();
    if (p === '/login' && m === 'POST') {
      const u = d.usuarios.find((u) => u.usuario === b?.usuario);
      if (
        !u ||
        typeof b?.clave !== 'string' ||
        b.clave.length > 200 ||
        !(u.hash && u.sal ? (await hashClave(b.clave, u.sal)) === u.hash : u.clave === b.clave)
      )
        throw Error('Credenciales incorrectas');
      if (!u.hash) {
        Object.assign(u, await credencial(b.clave));
        delete u.clave;
        saveDirectory(d);
      }
      check(
        u.rol === 'sistema' || d.negocios.some((n) => n.id === u.negocio && n.estado === 'Activo'),
        'Negocio inactivo',
      );
      session.setItem(SESSION_KEY, b.usuario);
      return result({ usuario: b.usuario });
    }
    const username = session.getItem(SESSION_KEY);
    const found = d.usuarios.find(
      (u) => u.usuario === (username === '1' ? 'admin@tortishop.pe' : username),
    );
    if (!found) throw Error('Inicie sesión');
    account = found;
    check(
      p === '/logout' ||
        account.rol === 'sistema' ||
        d.negocios.some((n) => n.id === account.negocio && n.estado === 'Activo'),
      'Negocio inactivo',
    );
    if (p === '/session' && m === 'GET')
      return result({
        usuario: account.usuario,
        rol: account.rol,
        negocio: account.negocio,
        nombreNegocio: d.negocios.find((n) => n.id === account.negocio)?.nombre,
        clienteId: account.clienteId,
      });
    if (p === '/logout' && m === 'POST') {
      session.removeItem(SESSION_KEY);
      return result({ ok: true });
    }
    if (p === '/negocios' && account.rol === 'sistema') {
      if (m === 'GET') return result(d.negocios);
      check(
        str(b.nombre) &&
          str(b.giro) &&
          str(b.direccion) &&
          ['Activo', 'Inactivo'].includes(b.estado),
        'Datos del negocio inválidos',
      );
      const old = d.negocios.find((n) => n.id === b.id);
      const id = old?.id ?? Math.max(0, ...d.negocios.map((n) => n.id)) + 1;
      if (!old) {
        check(
          str(b.usuario) &&
            str(b.clave) &&
            b.clave.length >= 8 &&
            !d.usuarios.some((u) => u.usuario === b.usuario),
          'Credenciales nuevas inválidas',
        );
        d.usuarios.push({
          usuario: b.usuario,
          ...(await credencial(b.clave)),
          rol: 'negocio',
          negocio: id,
        });
      }
      const n = {
        id,
        nombre: b.nombre,
        giro: b.giro,
        direccion: b.direccion,
        estado: b.estado,
        ruc: b.ruc ?? old?.['ruc'] ?? '',
        telefono: b.telefono ?? old?.['telefono'] ?? '',
        correo: b.correo ?? old?.['correo'] ?? '',
      };
      d.negocios = [...d.negocios.filter((x) => x.id !== id), n];
      saveDirectory(d);
      return result(n);
    }
    check(account.rol !== 'sistema', 'Seleccione gestión de negocios');
    stateKey = account.negocio === 1 ? STORAGE_KEY : STORAGE_KEY + '.negocio.' + account.negocio;
    state = read();
    // Al abrir la app, materializa los cierres ya alcanzados; permite reconstruir meses anteriores.
    // La fecha/hora de compra y los recibos determinan qué existía al cierre, incluso si se registró después.
    function cerrar(c: any, mes: string) {
      const f = fechasCiclo(mes, c);
      const key = c.cliente_id + '-' + mes;
      if (f.corte > today() || (f.corte === today() && horaLima() < c.horaCorte)) return undefined;
      state.cierres ??= {};
      const rows = state.credits
        .filter(
          (v) =>
            v.clienteId === c.cliente_id &&
            (v.entrada.fechaCompra < f.corte ||
              (v.entrada.fechaCompra === f.corte &&
                (v.entrada.horaCompra ?? '00:00') <= c.horaCorte)),
        )
        .flatMap((v) =>
          (v.resultado.cronograma ?? [])
            .filter(
              (row) =>
                row.vencimiento <= f.pago &&
                !(v.pagos ?? []).some((p) => p.cuota === row.k && p.fecha <= f.corte),
            )
            .map((row) => ({
              id: v.id,
              compra: v.entrada.fechaCompra,
              producto: v.producto,
              moneda: v.entrada.moneda ?? 'PEN',
              ...row,
            })),
        )
        .sort((a, b) => a.compra.localeCompare(b.compra));
      const cierre = {
        ...f,
        horaCorte: c.horaCorte,
        rows,
        total: r2(rows.reduce((n, r) => n + r.cuota, 0)),
      };
      if (JSON.stringify(cierre) !== JSON.stringify(state.cierres[key])) {
        state.cierres[key] = cierre;
        commit(null);
      }
      return cierre;
    }
    if (account.rol === 'negocio' && strict) {
      const current = today().slice(0, 7);
      const prev = new Date(current + '-01T00:00:00Z');
      prev.setUTCMonth(prev.getUTCMonth() - 1);
      for (const mes of [prev.toISOString().slice(0, 7), current])
        for (const c of list('clientes')) cerrar(c, mes);
    }
    if (p === '/usuarios' && account.rol === 'negocio' && m === 'POST') {
      check(
        str(b.usuario) &&
          str(b.clave) &&
          b.clave.length >= 8 &&
          !d.usuarios.some((u) => u.usuario === b.usuario) &&
          get('clientes', b.clienteId),
        'Credenciales o cliente inválidos',
      );
      d.usuarios.push({
        usuario: b.usuario,
        ...(await credencial(b.clave)),
        rol: 'cliente',
        negocio: account.negocio,
        clienteId: b.clienteId,
      });
      saveDirectory(d);
      return result({ ok: true });
    }
    if (account.rol === 'cliente') {
      check(
        m === 'GET' &&
          ['/creditos', '/data/clientes', '/estado-cuenta'].some(
            (x) => p === x || p.startsWith(x + '?'),
          ),
        'Acceso de solo consulta',
      );
    }
    if ((p.startsWith('/estado-cuenta?') && m === 'GET') || (p === '/pago-ciclo' && m === 'POST')) {
      const q = new URLSearchParams(p.split('?')[1]);
      const id =
        account.rol === 'cliente' ? account.clienteId! : Number(b?.clienteId ?? q.get('clienteId'));
      const hasta = b?.hasta ?? q.get('hasta'),
        fecha = b?.fecha ?? q.get('fecha');
      check(
        get('clientes', id) && fechaValida(hasta) && fechaValida(fecha) && fecha <= today(),
        'Cliente o fechas inválidos',
      );
      const pactado = fechasCiclo(hasta.slice(0, 7), get('clientes', id)).pago;
      check(hasta === pactado, 'Seleccione el vencimiento pactado del ciclo');
      const fin = hasta > fecha ? hasta : fecha;
      const rows = ciclo(state.credits, id, fin, fecha, today());
      const total = r2(rows.reduce((n, x) => n + x.total, 0));
      if (m === 'GET') {
        const mes = hasta.slice(0, 7),
          c = get('clientes', id),
          f = fechasCiclo(mes, c);
        const cierre = cerrar(c, mes);
        return result({
          rows,
          total,
          corte: f.corte,
          pago: f.pago,
          horaCorte: c.horaCorte,
          cierre,
          moneda: c.moneda,
        });
      }
      check(rows.length && money(b.monto) && b.monto === total, 'Pague el total del ciclo');
      for (const x of [...rows].sort((a, b) => a.id.localeCompare(b.id) || a.cuota - b.cuota)) {
        const v = state.credits.find((v) => v.id === x.id)!;
        v.pagos = [
          ...(v.pagos ?? []),
          registrarPago(v, x.cuota, fecha, x.total, b.metodo, today()),
        ];
      }
      return result(commit({ total }));
    }
    const data = p.match(/^\/data\/([a-z-]+)$/);
    if (data && m === 'GET') {
      const t = data[1];
      if (t === 'clientes')
        return result(
          list(t)
            .filter((c) => account.rol !== 'cliente' || c.cliente_id === account.clienteId)
            .map((c) => ({
              ...c,
              saldo_utilizado: debt(c.cliente_id),
              credito_disponible: r2(c.limite_credito - debt(c.cliente_id)),
            })),
        );
      if (Object.hasOwn(catalogos, t)) return result(list(t));
      if (Object.hasOwn(seeds, t))
        return result(account.negocio === 1 ? seeds[t] : Array.isArray(seeds[t]) ? [] : seeds[t]);
    }
    const cat = p.match(/^\/catalog\/([a-z]+)(?:\/(\d+))?$/);
    if (cat && Object.hasOwn(catalogos, cat[1])) {
      const t = cat[1],
        key = catalogos[t],
        id = cat[2] ? Number(cat[2]) : null;
      if ((m === 'POST' && !id) || (m === 'PUT' && id)) {
        const old = id ? get(t, id) : undefined;
        check(!id || old, 'Registro inexistente');
        const v = { ...validCatalog(t, b, old), [key]: id ?? state.next[t]++ };
        state.catalog[t] = [...list(t).filter((x) => x[key] !== id), v];
        return result(commit(v));
      }
      if (m === 'DELETE' && id && t === 'productos') {
        check(get(t, id), 'Producto inexistente');
        state.catalog[t] = list(t).filter((x) => x[key] !== id);
        return result(commit({ ok: true }));
      }
    }
    if (p === '/config' && m === 'GET') return result(state.config);
    if (p === '/config' && m === 'PUT') {
      check(configValida(b), 'Configuración inválida');
      state.config = {
        diaCorte: b.diaCorte,
        diaPago: b.diaPago,
        tipoTasa: b.tipoTasa,
        tasaPct: b.tasaPct,
        tnmPct: b.tnmPct,
        cuotas: b.cuotas,
      };
      return result(commit(state.config));
    }
    if (p === '/apertura' && m === 'GET') return result(state.opening);
    if (p === '/historico' && m === 'GET')
      return result({
        creditos,
        pagos,
        ventas: ventas_pos_muestra,
        dashboard,
        avisos: state.migrationWarnings,
      });
    if (p === '/creditos' && m === 'GET')
      return result(
        state.credits.filter((v) => account.rol !== 'cliente' || v.clienteId === account.clienteId),
      );
    if (p === '/creditos' && m === 'POST') {
      check(idOk(b.clienteId) && idOk(b.sucursalId), 'Seleccione cliente y sucursal');
      const c = get('clientes', b.clienteId),
        s = get('sucursales', b.sucursalId);
      check(c?.estado === 'Activo', 'Cliente inexistente o inactivo');
      check(s?.estado === 'Operativa', 'Sucursal no operativa');
      check(!b.productoId || idOk(b.productoId), 'Producto inválido');
      const prod = b.productoId ? get('productos', b.productoId) : null;
      check(
        !b.productoId || prod?.estado_disponibilidad === 'Disponible',
        'Producto no disponible',
      );
      const x = b.entrada;
      check(
        x && money(x.monto) && x.monto > 0 && ['unico', 'cuotas'].includes(x.modalidad),
        'Importe o modalidad inválidos',
      );
      check(x.fechaCompra <= today(), 'Fecha futura no permitida');
      if (strict) {
        check(
          !prod || prod.monedaPrecio === c.moneda,
          'La moneda del artículo debe coincidir con la del crédito',
        );
        check(
          x.modalidad === 'unico' || x.cuotas <= c.maxCuotas,
          'Excede máximo de cuotas pactado',
        );
        check(
          !prod || (x.modalidad === 'unico' ? prod.pagoUnico === 'Sí' : prod.pagoCuotas === 'Sí'),
          'Modalidad no permitida para el artículo',
        );
      }
      const entrada = {
        monto: x.monto,
        limite: c.limite_credito,
        pendientes: debt(c.cliente_id),
        fechaCompra: x.fechaCompra,
        diaCorte: strict ? c.diaCorte : x.diaCorte,
        horaCorte: strict ? c.horaCorte : x.horaCorte,
        horaCompra: x.horaCompra ?? '00:00',
        moneda: c.moneda,
        tipoMora: strict ? c.tipoMora : x.tipoMora,
        diaPago: strict ? c.diaPago : x.diaPago,
        cuotas: x.modalidad === 'unico' ? 1 : x.cuotas,
        tipoTasa: strict ? c.tipoTasa : x.tipoTasa,
        tasa: strict ? c.tasaPct / 100 : x.tasa,
        tnm: strict ? c.tnmPct / 100 : x.tnm,
        modalidad: x.modalidad,
      };
      const resultado = procesarVentaCredito(entrada);
      check(resultado.aprobada, resultado.motivo || 'Crédito rechazado');
      const v = {
        id: 'CR-' + crypto.randomUUID(),
        clienteId: c.cliente_id,
        clienteNombre: c.nombres_razon_social,
        producto: prod?.nombre_producto || 'Consumo libre',
        productoId: prod?.producto_id,
        sucursalId: s.sucursal_id,
        sucursalNombre: s.nombre_sucursal,
        entrada,
        resultado,
        creadaEn: new Date().toISOString(),
        pagos: [],
      };
      state.credits.push(v);
      return result(commit(v));
    }
    const pago = p.match(/^\/creditos\/(CR-[\w-]+)\/pagos$/);
    if (pago && m === 'POST') {
      const v = state.credits.find((x) => x.id === pago[1]);
      if (!v) throw Error('Crédito inexistente');
      if (strict) {
        const q = v.resultado.cronograma?.find((f) => f.k === b.cuota);
        check(q, 'Cuota inexistente');
        const others = ciclo(
          state.credits,
          v.clienteId,
          q!.vencimiento > b.fecha ? q!.vencimiento : b.fecha,
          b.fecha,
          today(),
        );
        check(
          others.length === 1,
          'Utilice Estado de cuenta para pagar todas las obligaciones del ciclo',
        );
      }
      const recibo = registrarPago(v, b.cuota, b.fecha, b.monto, b.metodo, today());
      v.pagos = [...(v.pagos ?? []), recibo];
      return result(commit(v));
    }
    if (p === '/ventas-contado' && m === 'GET') return result(state.cash);
    if (p === '/ventas-contado' && m === 'POST') {
      const s = get('sucursales', Number(b.sucursalId));
      check(s?.estado === 'Operativa', 'Seleccione sucursal operativa');
      check(
        Array.isArray(b.items) && b.items.length >= 1 && b.items.length <= 100,
        'Carrito vacío o inválido',
      );
      const items = b.items.map((x: any) => {
        check(
          x &&
            idOk(x.productoId) &&
            Number.isInteger(x.cantidad) &&
            x.cantidad >= 1 &&
            x.cantidad <= 10000,
          'Producto o cantidad inválidos',
        );
        const prod = get('productos', x.productoId);
        check(prod?.estado_disponibilidad === 'Disponible', 'Producto no disponible');
        return {
          productoId: prod.producto_id,
          nombre: prod.nombre_producto,
          cantidad: x.cantidad,
          moneda: prod.monedaPrecio ?? 'PEN',
          precio: prod.precio_contado,
          total: r2(prod.precio_contado * x.cantidad),
        };
      });
      check(
        items.every((i: any) => i.moneda === items[0].moneda),
        'No mezcle monedas en una venta',
      );
      const total = r2(items.reduce((a: number, x: any) => a + x.total, 0));
      check(money(total), 'Total fuera de rango');
      const v = {
        id: 'VE-' + crypto.randomUUID(),
        fecha: today(),
        sucursalId: s.sucursal_id,
        sucursal: s.nombre_sucursal,
        items,
        moneda: items[0].moneda,
        total,
      };
      state.cash.push(v);
      return result(commit(v));
    }
    throw Error('Operación local inexistente');
  };
  return { request };
}
// SQLite es la fuente de verdad. La migración de V5 no modifica la base anterior.
let queue: Promise<unknown> = Promise.resolve();
async function execute<T>(url: string, method: string, body: unknown): Promise<T> {
  // Stage session changes until the database has been persisted successfully.
  let sessionValue = sessionStorage.getItem(SESSION_KEY);
  const previousSession = sessionValue;
  const session: LocalStoragePort = {
    getItem: (k) => (k === SESSION_KEY ? sessionValue : sessionStorage.getItem(k)),
    setItem: (k, v) => {
      if (k === SESSION_KEY) sessionValue = v;
      else throw Error('Clave de sesión desconocida');
    },
    removeItem: (k) => {
      if (k === SESSION_KEY) sessionValue = null;
      else throw Error('Clave de sesión desconocida');
    },
  };
  const value = await conSQLite((map) => {
    const port: LocalStoragePort = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
      removeItem: (k) => {
        map.delete(k);
      },
    };
    return createLocalStore(port, session, hoyLocal, true).request<T>(url, method, body);
  });
  if (sessionValue !== previousSession) {
    if (sessionValue === null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, sessionValue);
  }
  return value;
}
export function operacionLocal<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const work = () =>
    navigator.locks
      ? navigator.locks.request('TortiShopV6SQLite', () => execute<T>(url, method, body))
      : execute<T>(url, method, body);
  const next = queue.then(work, work);
  queue = next.catch(() => {});
  return next;
}
