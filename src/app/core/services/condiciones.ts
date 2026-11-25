import { fechaPagoDeCompra } from '../finanzas/motor-financiero';
import { VentaGuardada, cotizarPago } from '../finanzas/pagos';
export const condiciones = {
  tipoTasa: 'TEA',
  tasaPct: 24,
  tipoMora: 'TNM',
  tnmPct: 15,
  moneda: 'PEN',
  maxCuotas: 60,
  diaCorte: 20,
  horaCorte: '23:59',
  diaPago: 26,
};
export const articulo = {
  tipoArticulo: 'Producto',
  marca: 'Sin marca',
  descripcion: 'Sin descripción',
  unidad: 'Unidad',
  proveedorId: 0,
  monedaPrecio: 'PEN',
  imagen: '',
  pagoUnico: 'Sí',
  pagoCuotas: 'Sí',
};
export function ciclo(
  ventas: VentaGuardada[],
  clienteId: number,
  hasta: string,
  fecha: string,
  hoy: string,
) {
  return ventas
    .filter((v) => v.clienteId === clienteId && v.entrada.fechaCompra <= fecha)
    .flatMap((v) =>
      (v.resultado.cronograma ?? [])
        .filter((f) => f.vencimiento <= hasta && !(v.pagos ?? []).some((p) => p.cuota === f.k))
        .map((f) => ({
          id: v.id,
          compra: v.entrada.fechaCompra,
          producto: v.producto,
          moneda: v.entrada.moneda ?? 'PEN',
          interesGracia: v.resultado.interesGracia ?? 0,
          modalidad: v.entrada.modalidad,
          ...cotizarPago(v, f.k, fecha, hoy),
          cuota: f.k,
        })),
    )
    .sort(
      (a, b) => a.compra.localeCompare(b.compra) || a.f.vencimiento.localeCompare(b.f.vencimiento),
    );
}

export function fechasCiclo(mes: string, c: { diaCorte: number; diaPago: number }) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw Error('Mes inválido');
  return {
    corte: fechaPagoDeCompra(mes + '-01', 31, c.diaCorte),
    pago: fechaPagoDeCompra(mes + '-01', 31, c.diaPago),
  };
}
export function horaLima() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}
