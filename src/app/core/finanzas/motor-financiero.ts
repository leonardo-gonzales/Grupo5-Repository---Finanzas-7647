/**
 * Motor financiero TortiShop (funciones puras, sin Angular).
 * Convenciones: año comercial de 360 días, mes de 30 días, tasas en decimal (18 % = 0.18).
 */

// ---------- Fechas (UTC para evitar errores de zona horaria) ----------
const MS_DIA = 86_400_000;

export const aFecha = (iso: string): Date => new Date(iso + 'T00:00:00Z');
export const aISO = (d: Date): string => d.toISOString().slice(0, 10);
export const diasEntre = (desde: string, hasta: string): number =>
  Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / MS_DIA);

/** Suma meses calendario; si el día no existe en el mes destino usa el último día del mes. */
export function sumarMeses(iso: string, meses: number): string {
  const d = aFecha(iso);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return aISO(d);
}

/** Compra hasta el día de corte -> vence ese mes; compra posterior -> pasa al mes siguiente. */
export function fechaPagoDeCompra(fechaCompra: string, diaCorte: number, diaPago: number): string {
  const c = aFecha(fechaCompra);
  const extra = c.getUTCDate() <= diaCorte ? 0 : 1;
  const base = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + extra, 1));
  const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(diaPago, ultimo));
  return aISO(base);
}

// ---------- Tasas ----------
export type TipoTasa = 'TEA' | 'TNA';
export const temDesdeTEA = (tea: number) => Math.pow(1 + tea, 30 / 360) - 1;
export const temDesdeTNA = (tna: number) => Math.pow(1 + tna / 360, 30) - 1;
export const calcularTEM = (tasa: number, tipo: TipoTasa) =>
  tipo === 'TEA' ? temDesdeTEA(tasa) : temDesdeTNA(tasa);

// ---------- Interés y capitalización ----------
export const interesCompensatorio = (P: number, tem: number, d: number) =>
  P * (Math.pow(1 + tem, d / 30) - 1);
export const capitalizarGracia = (P: number, tem: number, g: number) =>
  P * Math.pow(1 + tem, g / 30);

// ---------- Método francés ----------
export const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const cuotaFrancesa = (S: number, tem: number, n: number) =>
  tem === 0 ? S / n : (S * tem) / (1 - Math.pow(1 + tem, -n));

export interface FilaCronograma {
  k: number;
  vencimiento: string;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  saldo: number;
}

export function generarCronograma(S: number, tem: number, n: number, fechaPago: string): FilaCronograma[] {
  const C = cuotaFrancesa(S, tem, n);
  let saldo = S;
  const filas: FilaCronograma[] = [];
  for (let k = 1; k <= n; k++) {
    const saldoInicial = saldo;
    const interes = saldo * tem;
    const cuota = k === n ? saldo + interes : C; // ajuste de cierre: saldo final = 0
    const amort = cuota - interes;
    saldo = k === n ? 0 : saldo - amort;
    filas.push({
      k,
      vencimiento: sumarMeses(fechaPago, k),
      saldoInicial: r2(saldoInicial),
      interes: r2(interes),
      amortizacion: r2(amort),
      cuota: r2(cuota),
      saldo: r2(saldo),
    });
  }
  return filas;
}

// ---------- Mora, saldo, línea ----------
export const interesMoratorio = (Sv: number, tnm: number, dm: number) =>
  dm <= 0 || tnm === 0 ? 0 : Sv * (tnm / 360) * dm;

export const saldoInsoluto = (C: number, tem: number, n: number, k: number) =>
  tem === 0 ? C * (n - k) : (C * (1 - Math.pow(1 + tem, -(n - k)))) / tem;

export const lineaDisponible = (L: number, Sk: number, Cp = 0) => L - (Sk + Cp);

/** Regla del sistema: no se aceptan pagos parciales. */
export const pagoValido = (monto: number, totalExigible: number) => r2(monto) >= r2(totalExigible);

// ---------- TCEA ----------
/** Resuelve la TEA que iguala el monto recibido con los flujos, usando días reales sobre base 360. */
export function tceaPorFechas(
  montoNeto: number,
  fechaInicio: string,
  flujos: { fecha: string; monto: number }[]
): number {
  const f = (i: number) =>
    flujos.reduce((a, x) => a + x.monto / Math.pow(1 + i, diasEntre(fechaInicio, x.fecha) / 360), 0) - montoNeto;
  let lo = 0, hi = 1;
  while (f(hi) > 0) hi *= 2;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    f(mid) > 0 ? (lo = mid) : (hi = mid);
  }
  return (lo + hi) / 2;
}

/** TCEA de un pago único sin cargos adicionales: anualización de la TEM. */
export const tceaPagoUnico = (tem: number) => Math.pow(1 + tem, 12) - 1;

// ---------- Operación completa: venta a crédito ----------
export interface EntradaVenta {
  monto: number;          // P
  limite: number;         // L
  pendientes?: number;    // Cp: saldo vigente del cliente
  fechaCompra: string;    // YYYY-MM-DD
  diaCorte: number;
  diaPago: number;
  cuotas: number;         // n
  tipoTasa: TipoTasa;
  tasa: number;           // decimal
}

export interface ResultadoVenta {
  aprobada: boolean;
  motivo?: string;
  lineaDisponible: number;
  fechaPago?: string;
  diasGracia?: number;
  tem?: number;
  interesGracia?: number;
  saldoCapitalizado?: number;
  cuotaFija?: number;
  tcea?: number;
  cronograma?: FilaCronograma[];
}

export function procesarVentaCredito(e: EntradaVenta): ResultadoVenta {
  const disponible = r2(lineaDisponible(e.limite, e.pendientes ?? 0));
  if (e.monto <= 0 || e.cuotas < 1 || e.tasa < 0)
    return { aprobada: false, motivo: 'Datos inválidos: revisa monto, cuotas y tasa.', lineaDisponible: disponible };
  if (e.monto > disponible)
    return { aprobada: false, motivo: `Supera la línea disponible (S/ ${disponible.toFixed(2)}).`, lineaDisponible: disponible };

  const tem = calcularTEM(e.tasa, e.tipoTasa);
  const fechaPago = fechaPagoDeCompra(e.fechaCompra, e.diaCorte, e.diaPago);
  const g = diasEntre(e.fechaCompra, fechaPago);
  const S = capitalizarGracia(e.monto, tem, g);
  const cronograma = generarCronograma(S, tem, e.cuotas, fechaPago);
  return {
    aprobada: true,
    lineaDisponible: disponible,
    fechaPago,
    diasGracia: g,
    tem,
    interesGracia: r2(S - e.monto),
    saldoCapitalizado: r2(S),
    cuotaFija: r2(cuotaFrancesa(S, tem, e.cuotas)),
    tcea: tceaPorFechas(e.monto, e.fechaCompra, cronograma.map(f => ({ fecha: f.vencimiento, monto: f.cuota }))),
    cronograma,
  };
}
