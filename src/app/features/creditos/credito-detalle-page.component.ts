import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonDataService } from '../../core/services/json-data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-credito-detalle-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent, StatusBadgeComponent],
  template: `
    <app-page-header breadcrumb="Créditos y cuentas · Estado" title="Créditos y cronograma" subtitle="Consulta visual del contrato y sus cuotas." />
    @if (data()) {
      <div class="kpis">
        <div class="ts-card"><span>Saldo pendiente</span><strong>{{ data()!.saldo_pendiente }}</strong></div>
        <div class="ts-card"><span>Crédito disponible</span><strong>{{ data()!.credito_disponible }}</strong></div>
        <div class="ts-card"><span>Próximo vencimiento</span><strong>{{ data()!.proximo_vencimiento }}</strong></div>
        <div class="ts-card"><span>Estado</span><strong>{{ data()!.estado }}</strong></div>
      </div>

      <app-data-table [headers]="['Cuota', 'Vencimiento', 'Saldo inicial', 'Interés', 'Amortización', 'Cuota', 'Saldo final', 'Mora', 'Estado']" footerText="Cronograma de ejemplo desde data/creditos.json">
        @for (cuota of data()!.cronograma; track cuota.numero_cuota) {
          <tr>
            <td><strong>#{{ cuota.numero_cuota }}</strong></td>
            <td>{{ cuota.fecha_vencimiento }}</td>
            <td>{{ cuota.saldo_inicial }}</td>
            <td>{{ cuota.interes }}</td>
            <td>{{ cuota.amortizacion }}</td>
            <td>{{ cuota.cuota_fija }}</td>
            <td>{{ cuota.saldo_final }}</td>
            <td>{{ cuota.mora_referencial }}</td>
            <td><app-status-badge [label]="cuota.estado_pago" /></td>
          </tr>
        }
      </app-data-table>
    }
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .kpis span, .kpis strong { display: block; }
    .kpis span { color: var(--ts-text-secondary); font-size: .78rem; }
    .kpis strong { color: var(--ts-primary); margin-top: 4px; }
  `]
})
export class CreditoDetallePageComponent implements OnInit {
  private readonly jsonService = inject(JsonDataService);
  data = signal<any>(null);

  ngOnInit(): void {
    this.jsonService.getData<any>('creditos').subscribe(result => this.data.set(result.contratoActivo));
  }
}

