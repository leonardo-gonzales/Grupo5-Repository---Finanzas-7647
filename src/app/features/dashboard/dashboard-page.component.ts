
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JsonDataService } from '../../core/services/json-data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [CommonModule, RouterLink, PageHeaderComponent, StatCardComponent, DataTableComponent, StatusBadgeComponent],
    template: `
    <app-page-header
      breadcrumb="TortiShop · Panel General"
      title="Bienvenido a TortiShop"
      subtitle="Vista general de la pastelería, sucursales, catálogo y cartera comercial."
    >
      <a routerLink="/ventas" class="ts-btn ts-btn-secondary">🧾 Abrir Caja POS (Visual)</a>
      <a routerLink="/creditos/nueva" class="ts-btn ts-btn-primary">+ Nueva Venta a Crédito</a>
    </app-page-header>

    @if (data()) {
      <div class="ts-kpi-grid">
        @for (kpi of data()!.kpis; track kpi.titulo) {
          <app-stat-card
            [titulo]="kpi.titulo"
            [valor]="kpi.valor"
            [subtitulo]="kpi.subtitulo"
            [icono]="kpi.icono"
            [variante]="kpi.variante"
          />
        }
      </div>

      <div class="ts-section-block">
        <div class="ts-section-header">
          <h2>Últimas operaciones registradas (JSON de muestra)</h2>
          <a routerLink="/creditos/detalle" class="ts-btn ts-btn-ghost">Ver estado de cuenta →</a>
        </div>

        <app-data-table
          [headers]="['Código', 'Cliente', 'Producto / Lote', 'Sucursal', 'Fecha', 'Estado']"
          footerText="Mostrando 3 registros de ejemplo desde data/dashboard.json"
        >
          @for (mov of data()!.ultimosMovimientos; track mov.codigo) {
            <tr>
              <td><strong>{{ mov.codigo }}</strong></td>
              <td>{{ mov.cliente }}</td>
              <td>{{ mov.concepto }}</td>
              <td>{{ mov.sucursal }}</td>
              <td>{{ mov.fecha }}</td>
              <td><app-status-badge [label]="mov.estado" /></td>
            </tr>
          }
        </app-data-table>
      </div>
    }
  `,
    styles: [`
    .ts-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .ts-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .ts-section-header h2 {
      font-size: 1.05rem;
      font-weight: 700;
    }
  `]
})
export class DashboardPageComponent implements OnInit {
    private readonly jsonService = inject(JsonDataService);
    data = signal<any>(null);

    ngOnInit(): void {
        this.jsonService.getData('dashboard').subscribe(res => this.data.set(res));
    }
}