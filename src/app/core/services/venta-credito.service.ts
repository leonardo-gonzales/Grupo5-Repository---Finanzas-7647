import { Injectable, signal } from '@angular/core';
import { r2 } from '../finanzas/motor-financiero';
import { VentaGuardada, saldoVenta } from '../finanzas/pagos';
import { operacionLocal } from './local-store';
export type { VentaGuardada } from '../finanzas/pagos';
export { saldoVenta, cotizarPago } from '../finanzas/pagos';
@Injectable({ providedIn: 'root' })
export class VentaCreditoService {
  readonly ventas = signal<VentaGuardada[]>([]);
  readonly apertura = signal<Record<string, number>>({});
  readonly listo = signal(false);
  readonly error = signal('');
  async cargar() {
    this.listo.set(false);
    this.error.set('');
    try {
      this.ventas.set(await operacionLocal<VentaGuardada[]>('/creditos'));
      this.apertura.set(await operacionLocal<Record<string, number>>('/apertura'));
      this.listo.set(true);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  async guardar(v: Omit<VentaGuardada, 'id' | 'creadaEn'>): Promise<VentaGuardada> {
    const nueva = await operacionLocal<VentaGuardada>('/creditos', 'POST', {
      clienteId: v.clienteId,
      productoId: v.productoId,
      sucursalId: v.sucursalId,
      entrada: v.entrada,
    });
    this.ventas.update((l) => [...l.filter((x) => x.id !== nueva.id), nueva]);
    return nueva;
  }
  saldoPendienteCliente(id: number) {
    return r2(
      (this.apertura()[id] ?? 0) +
        this.ventas()
          .filter((v) => v.clienteId === id)
          .reduce((a, v) => a + saldoVenta(v), 0),
    );
  }
  async pagar(id: string, k: number, fecha: string, monto: number, metodo: string) {
    const v = await operacionLocal<VentaGuardada>(`/creditos/${id}/pagos`, 'POST', {
      cuota: k,
      fecha,
      monto,
      metodo,
    });
    this.ventas.update((l) => l.map((x) => (x.id === id ? v : x)));
    return v;
  }
}
