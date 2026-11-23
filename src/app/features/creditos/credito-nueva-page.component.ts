import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { JsonDataService } from '../../core/services/json-data.service';

@Component({
  selector: 'app-credito-nueva-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header breadcrumb="Créditos y cuentas · Nueva venta" title="Nueva venta a crédito" subtitle="Simulación visual de financiamiento basada en datos locales." />
    @if (data()) {
      <form class="credito-grid" (submit)="$event.preventDefault()">
        <section class="ts-card">
          <h2>Datos del cliente</h2>
          <label>Cliente</label>
          <input class="ts-input" [value]="data()!.cliente" readonly>
          <label>DNI</label>
          <input class="ts-input" [value]="data()!.dni" readonly>
          <label>Producto</label>
          <input class="ts-input" [value]="data()!.producto" readonly>
        </section>
        <section class="ts-card">
          <h2>Financiamiento</h2>
          <div class="metric-grid">
            <div><span>Monto</span><strong>{{ data()!.monto_consumo }}</strong></div>
            <div><span>Cuotas</span><strong>{{ data()!.numero_cuotas }}</strong></div>
            <div><span>TEA</span><strong>{{ data()!.valor_tasa }}</strong></div>
            <div><span>TEM</span><strong>{{ data()!.tem_equivalente }}</strong></div>
            <div><span>Cuota mensual</span><strong>{{ data()!.cuota_mensual }}</strong></div>
            <div><span>TCEA calculada</span><strong>{{ data()!.tcea_calculada }}</strong></div>
          </div>
          <button type="submit" class="ts-btn ts-btn-primary">Simular crédito</button>
        </section>
      </form>
    }
  `,
  styles: [`
    .credito-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    section h2 { margin-bottom: 16px; }
    label { display: block; margin: 12px 0 6px; font-size: .82rem; font-weight: 700; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
    .metric-grid div { background: var(--ts-accent-cream); border: 1px solid var(--ts-border-subtle); border-radius: 8px; padding: 12px; }
    .metric-grid span, .metric-grid strong { display: block; }
    .metric-grid span { color: var(--ts-text-secondary); font-size: .75rem; }
    .metric-grid strong { margin-top: 3px; }
    @media (max-width: 760px) { .credito-grid { grid-template-columns: 1fr; } }
  `]
})
export class CreditoNuevaPageComponent implements OnInit {
  private readonly jsonService = inject(JsonDataService);
  data = signal<any>(null);

  ngOnInit(): void {
    this.jsonService.getData<any>('creditos').subscribe(result => this.data.set(result.contratoActivo));
  }
}

