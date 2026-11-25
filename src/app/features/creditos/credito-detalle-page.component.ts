import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  VentaCreditoService,
  saldoVenta,
  cotizarPago,
} from '../../core/services/venta-credito.service';
import { JsonDataService } from '../../core/services/json-data.service';
import { operacionLocal } from '../../core/services/local-store';
import { Cliente } from '../../shared/models/cliente.model';
import { hoyLocal, moraPactada, diasEntre, r2 } from '../../core/finanzas/motor-financiero';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
@Component({
  selector: 'app-credito-detalle-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent],
  template: ` <app-page-header
      breadcrumb="Créditos y cuentas"
      title="Estado de cuenta y pagos"
      subtitle="Créditos registrados y recibos reales."
    />
    <section class="ts-card">
      <a routerLink="/creditos/nueva">Nueva venta a crédito</a> ·
      <a routerLink="/gestion">Pagar estado de cuenta consolidado</a><label>Cliente</label
      ><select
        class="ts-select"
        [ngModel]="filtro()"
        (ngModelChange)="filtro.set($event); id.set(filtradas()[0]?.id ?? ''); monto = 0"
      >
        <option [ngValue]="0">Todos los clientes</option>
        @for (c of clientes(); track c.cliente_id) {
          <option [ngValue]="c.cliente_id">{{ c.nombres_razon_social }}</option>
        }</select
      ><label> Crédito </label
      ><select
        class="ts-select"
        [ngModel]="id()"
        (ngModelChange)="id.set($event); mensaje = ''; monto = 0"
      >
        <option value="">Seleccione</option>
        @for (v of filtradas(); track v.id) {
          <option [value]="v.id">{{ v.clienteNombre }} · {{ v.producto }} · {{ v.id }}</option>
        }
      </select>
    </section>
    @if (venta(); as v) {
      <section class="ts-card">
        <h2>{{ v.clienteNombre }}</h2>
        @if (v.legacy) {
          <p>
            Crédito migrado: el registro original no especificaba tasa moratoria; se conserva sin
            recargo.
          </p>
        }
        <p>
          Saldo pendiente de este crédito: {{ v.entrada.moneda || 'PEN' }}
          {{ saldo(v) | number: '1.2-2' }} ·
          {{
            siguiente() ? (siguiente()!.vencimiento < hoy() ? 'Vencido' : 'Activo') : 'Liquidado'
          }}
        </p>
        <p>
          Crédito disponible del cliente: {{ v.entrada.moneda || 'PEN' }}
          {{ disponible() | number: '1.2-2' }}
        </p>
        <p>
          Saldo total del cliente: {{ v.entrada.moneda || 'PEN' }}
          {{ servicio.saldoPendienteCliente(v.clienteId) | number: '1.2-2' }}
        </p>
        <p>
          Próximo vencimiento: {{ siguiente()?.vencimiento || 'Sin cuotas pendientes' }} · TCEA:
          {{ (v.resultado.tcea || 0) * 100 | number: '1.7-7' }}%
        </p>
        <div style="overflow:auto">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Cuota</th>
                <th>Vencimiento</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Importe</th>
                <th>Saldo</th>
                <th>Mora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (f of v.resultado.cronograma; track f.k) {
                <tr>
                  <td>{{ f.k }}</td>
                  <td>{{ f.vencimiento }}</td>
                  <td>{{ f.interes }}</td>
                  <td>{{ f.amortizacion }}</td>
                  <td>{{ f.cuota }}</td>
                  <td>{{ f.saldo | number: '1.2-2' }}</td>
                  <td>{{ mora(f.k, f.vencimiento, f.cuota) | number: '1.2-2' }}</td>
                  <td>{{ estado(f.k, f.vencimiento) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      @if (siguiente(); as f) {
        <section class="ts-card">
          <h2>Registrar cuota {{ f.k }}</h2>
          <label>Fecha de pago</label
          ><input class="ts-input" type="date" [(ngModel)]="fecha" [max]="hoy()" /><label
            >Método</label
          ><select class="ts-select" [(ngModel)]="metodo">
            <option>Efectivo</option>
            <option>Transferencia</option>
            <option>Tarjeta</option>
          </select>
          @if (cotizacion(); as q) {
            <p>
              Días de atraso: {{ q.dias }} · Mora: {{ v.entrada.moneda || 'PEN' }}
              {{ q.mora | number: '1.2-2' }} · Total exigible: {{ v.entrada.moneda || 'PEN' }}
              {{ q.total | number: '1.2-2' }}
            </p>
            <button class="ts-btn" (click)="monto = q.total">Usar importe exacto</button>
          }
          <label>Monto recibido</label
          ><input type="number" class="ts-input" [(ngModel)]="monto" step="0.01" /><button
            class="ts-btn ts-btn-primary"
            (click)="pagar()"
            [disabled]="ocupado"
          >
            Registrar pago
          </button>
        </section>
      }
      <section class="ts-card">
        <h2>Recibos</h2>
        @for (p of v.pagos; track p.cuota) {
          <p>
            Cuota {{ p.cuota }} · {{ p.fecha }} · Mora {{ p.mora }} · Interés {{ p.interes }} ·
            Capital {{ p.capital }} · Total {{ v.entrada.moneda || 'PEN' }} {{ p.total }} ·
            {{ p.metodo }}
          </p>
        } @empty {
          <p>Sin pagos registrados.</p>
        }
      </section>
    }
    @if (servicio.listo() && !filtradas().length) {
      <p>No hay créditos registrados para esta selección.</p>
    }
    @if (servicio.error()) {
      <p role="alert">{{ servicio.error() }}</p>
    }
    @for (aviso of avisos(); track $index) {
      <p role="alert">{{ aviso }}</p>
    }
    <p role="status">{{ mensaje }}</p>`,
  styles: [
    `
      section {
        margin-bottom: 16px;
      }
      label {
        display: block;
        margin: 8px 0;
      }
      button {
        margin: 8px 0;
      }
      th,
      td {
        padding: 10px;
        text-align: left;
      }
      table {
        width: 100%;
      }
    `,
  ],
})
export class CreditoDetallePageComponent implements OnInit {
  cdr = inject(ChangeDetectorRef);
  ocupado = false;
  hoy = hoyLocal;
  json = inject(JsonDataService);
  clientes = signal<Cliente[]>([]);
  avisos = signal<string[]>([]);
  async ngOnInit() {
    operacionLocal<any>('/historico')
      .then((h) => this.avisos.set(h.avisos))
      .catch((e) => {
        this.mensaje = e.message;
        this.cdr.markForCheck();
      });
    this.json.getData<Cliente[]>('clientes').subscribe({
      next: (c) => this.clientes.set(c),
      error: () => {
        this.mensaje = 'No se pudo cargar clientes';
        this.cdr.markForCheck();
      },
    });
    await this.servicio.cargar();
    this.id.set(this.servicio.ventas().at(-1)?.id ?? '');
  }
  disponible() {
    const c = this.clientes().find((c) => c.cliente_id === this.venta()?.clienteId);
    return c ? c.limite_credito - this.servicio.saldoPendienteCliente(c.cliente_id) : 0;
  }
  servicio = inject(VentaCreditoService);
  id = signal('');
  filtro = signal(0);
  filtradas = computed(() =>
    this.servicio.ventas().filter((v) => !this.filtro() || v.clienteId === this.filtro()),
  );
  mora(k: number, fecha: string, cuota: number) {
    const v = this.venta();
    return (
      v?.pagos?.find((p) => p.cuota === k)?.mora ??
      r2(moraPactada(cuota, v?.entrada.tnm ?? 0, diasEntre(fecha, hoyLocal()), v?.entrada.tipoMora))
    );
  }
  venta = computed(() => this.servicio.ventas().find((v) => v.id === this.id()));
  siguiente = computed(() =>
    this.venta()?.resultado.cronograma?.find(
      (f) => !this.venta()?.pagos?.some((p) => p.cuota === f.k),
    ),
  );
  saldo = saldoVenta;
  fecha = hoyLocal();
  monto = 0;
  metodo = 'Efectivo';
  mensaje = '';
  estado(k: number, fecha: string) {
    return this.venta()?.pagos?.some((p) => p.cuota === k)
      ? 'Pagada'
      : fecha < hoyLocal()
        ? 'Vencida'
        : 'Pendiente';
  }
  cotizacion() {
    try {
      return cotizarPago(this.venta()!, this.siguiente()!.k, this.fecha);
    } catch {
      return null;
    }
  }
  async pagar() {
    if (this.ocupado) return;
    this.ocupado = true;
    try {
      await this.servicio.pagar(
        this.id(),
        this.siguiente()!.k,
        this.fecha,
        this.monto,
        this.metodo,
      );
      this.mensaje = 'Pago registrado correctamente';
      this.monto = 0;
    } catch (e) {
      this.mensaje = (e as Error).message;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }
}
