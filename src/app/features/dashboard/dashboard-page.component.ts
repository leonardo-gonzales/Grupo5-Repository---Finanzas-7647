import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentaCreditoService, saldoVenta } from '../../core/services/venta-credito.service';
import { operacionLocal } from '../../core/services/local-store';
import { hoyLocal } from '../../core/finanzas/motor-financiero';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, StatCardComponent, DataTableComponent],
  template: `
    <app-page-header
      breadcrumb="TortiShop · Panel general"
      title="Bienvenido a TortiShop"
      subtitle="Operaciones guardadas en este navegador."
      ><a routerLink="/ventas" class="ts-btn ts-btn-secondary">Abrir caja</a
      ><a routerLink="/creditos/nueva" class="ts-btn ts-btn-primary"
        >Nueva venta a crédito</a
      ></app-page-header
    >
    @if (ventas.error()) {
      <p role="alert">{{ ventas.error() }}</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    <div class="kpis">
      <app-stat-card
        titulo="Créditos activos"
        [valor]="activos().toString()"
        icono="💳"
      /><app-stat-card titulo="Saldo pendiente total" [valor]="deuda()" icono="📊" /><app-stat-card
        titulo="Cuotas vencidas"
        [valor]="vencidas().toString()"
        icono="📅"
      /><app-stat-card titulo="Ventas al contado" [valor]="contado()" icono="🧾" />
    </div>
    <h2>Últimos créditos</h2>
    <app-data-table
      [headers]="['Código', 'Cliente', 'Concepto', 'Fecha', 'Saldo', 'Estado']"
      footerText="Operaciones reales"
      ><tr *ngFor="let v of recientes()">
        <td>{{ v.id }}</td>
        <td>{{ v.clienteNombre }}</td>
        <td>{{ v.producto }}</td>
        <td>{{ v.entrada.fechaCompra }}</td>
        <td>{{ v.entrada.moneda || 'PEN' }} {{ saldo(v) | number: '1.2-2' }}</td>
        <td>{{ saldo(v) > 0 ? 'Activo' : 'Liquidado' }}</td>
      </tr></app-data-table
    ><a routerLink="/creditos/detalle">Consultar estado de cuenta</a>
  `,
  styles: [
    `
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      h2 {
        margin-bottom: 10px;
      }
    `,
  ],
})
export class DashboardPageComponent implements OnInit {
  ventas = inject(VentaCreditoService);
  saldo = saldoVenta;
  cash = signal<any[]>([]);
  error = signal('');
  activos = computed(() => this.ventas.ventas().filter((v) => saldoVenta(v) > 0).length);
  deuda = computed(() =>
    ['PEN', 'USD']
      .map(
        (m) =>
          m +
          ' ' +
          this.ventas
            .ventas()
            .filter((v) => (v.entrada.moneda ?? 'PEN') === m)
            .reduce((a, v) => a + saldoVenta(v), 0)
            .toFixed(2),
      )
      .join(' · '),
  );
  vencidas = computed(() =>
    this.ventas
      .ventas()
      .reduce(
        (a, v) =>
          a +
          (v.resultado.cronograma ?? []).filter(
            (f) => f.vencimiento < hoyLocal() && !v.pagos?.some((p) => p.cuota === f.k),
          ).length,
        0,
      ),
  );
  contado = computed(() =>
    ['PEN', 'USD']
      .map(
        (m) =>
          m +
          ' ' +
          this.cash()
            .filter((v) => (v.moneda ?? 'PEN') === m)
            .reduce((a, v) => a + v.total, 0)
            .toFixed(2),
      )
      .join(' · '),
  );
  recientes = computed(() => this.ventas.ventas().slice(-10).reverse());
  ngOnInit() {
    void this.ventas.cargar();
    operacionLocal<any[]>('/ventas-contado')
      .then((x) => this.cash.set(x))
      .catch((e) => this.error.set(e.message));
  }
}
