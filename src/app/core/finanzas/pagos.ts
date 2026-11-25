import {
  EntradaVenta,
  ResultadoVenta,
  r2,
  diasEntre,
  moraPactada,
  fechaValida,
  hoyLocal,
} from './motor-financiero';
export interface Pago {
  cuota: number;
  fecha: string;
  mora: number;
  interes: number;
  capital: number;
  total: number;
  metodo: string;
  diasAtraso: number;
}
export interface VentaGuardada {
  id: string;
  clienteId: number;
  clienteNombre: string;
  producto: string;
  productoId?: number;
  sucursalId?: number;
  entrada: EntradaVenta;
  resultado: ResultadoVenta;
  creadaEn: string;
  pagos?: Pago[];
  legacy?: boolean;
}
export function saldoVenta(v: VentaGuardada): number {
  return r2(
    Math.max(
      0,
      (v.entrada.modalidad === 'unico' ? v.entrada.monto : (v.resultado.saldoCapitalizado ?? 0)) -
        (v.pagos ?? []).reduce((a, p) => a + p.capital, 0),
    ),
  );
}
export function cotizarPago(v: VentaGuardada, k: number, fecha: string, hoy = hoyLocal()) {
  const f = v.resultado.cronograma?.find((x) => x.k === k);
  if (!f) throw Error('Cuota inexistente');
  if (!fechaValida(fecha) || fecha < v.entrada.fechaCompra || fecha > hoy)
    throw Error('Fecha de pago inválida o futura');
  const dias = Math.max(0, diasEntre(f.vencimiento, fecha));
  const mora = r2(moraPactada(f.cuota, v.entrada.tnm ?? 0, dias, v.entrada.tipoMora));
  return { f, dias, mora, total: r2(f.cuota + mora) };
}
export function registrarPago(
  v: VentaGuardada,
  k: number,
  fecha: string,
  monto: number,
  metodo: string,
  hoy = hoyLocal(),
): Pago {
  const pagos = v.pagos ?? [];
  if (pagos.some((p) => p.cuota === k)) throw Error('Cuota ya pagada');
  if (k !== pagos.length + 1) throw Error('Pague primero la cuota anterior');
  if (pagos.some((p) => p.fecha > fecha)) throw Error('Fecha anterior al último pago');
  if (!['Efectivo', 'Transferencia', 'Tarjeta'].includes(metodo))
    throw Error('Método de pago inválido');
  const q = cotizarPago(v, k, fecha, hoy);
  if (!Number.isFinite(monto) || r2(monto) !== q.total || Math.abs(monto - r2(monto)) > 1e-8)
    throw Error('Ingrese el total exacto; no se admiten pagos parciales ni excedentes');
  const capital = k === v.resultado.cronograma!.length ? saldoVenta(v) : q.f.amortizacion;
  return {
    cuota: k,
    fecha,
    mora: q.mora,
    interes: r2(q.f.cuota - capital),
    capital,
    total: q.total,
    metodo,
    diasAtraso: q.dias,
  };
}
