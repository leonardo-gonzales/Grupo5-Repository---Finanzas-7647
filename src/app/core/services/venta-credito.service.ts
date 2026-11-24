import { Injectable, signal } from '@angular/core';
import { EntradaVenta, ResultadoVenta } from '../finanzas/motor-financiero';

export interface VentaGuardada {
  id: string;
  clienteId: number;
  clienteNombre: string;
  producto: string;
  entrada: EntradaVenta;
  resultado: ResultadoVenta;
  creadaEn: string;
}

const KEY = 'tortishop-ventas-credito';

/** Persistencia local (localStorage). En la Etapa 2 se reemplaza por la API REST. */
@Injectable({ providedIn: 'root' })
export class VentaCreditoService {
  readonly ventas = signal<VentaGuardada[]>(this.leer());

  guardar(v: Omit<VentaGuardada, 'id' | 'creadaEn'>): VentaGuardada {
    const nueva: VentaGuardada = {
      ...v,
      id: 'CR-' + String(this.ventas().length + 1).padStart(4, '0'),
      creadaEn: new Date().toISOString(),
    };
    this.ventas.update(l => [...l, nueva]);
    this.escribir();
    return nueva;
  }

  /** Saldo capital vigente de un cliente: suma de saldos iniciales de las ventas registradas. */
  saldoPendienteCliente(clienteId: number): number {
    return this.ventas()
      .filter(v => v.clienteId === clienteId && v.resultado.aprobada)
      .reduce((a, v) => a + (v.resultado.saldoCapitalizado ?? 0), 0);
  }

  private leer(): VentaGuardada[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
  }
  private escribir() {
    try { localStorage.setItem(KEY, JSON.stringify(this.ventas())); } catch { /* sin almacenamiento */ }
  }
}
