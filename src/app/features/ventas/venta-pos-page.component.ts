import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonDataService } from '../../core/services/json-data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-venta-pos-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header breadcrumb="Operación comercial · Caja" title="Ventas (Caja POS)" subtitle="Interfaz visual de venta, sin procesamiento real todavía.">
      <button type="button" class="ts-btn ts-btn-secondary">Limpiar carrito</button>
      <button type="button" class="ts-btn ts-btn-primary">Procesar venta</button>
    </app-page-header>

    @if (data()) {
      <div class="pos-layout">
        <section class="ts-card pos-products">
          <h2>Productos seleccionados</h2>
          @for (item of data()!.itemsSeleccionadosMuestra; track item.sku) {
            <div class="pos-item">
              <div><strong>{{ item.nombre }}</strong><span>{{ item.sku }} · Cant. {{ item.cantidad_muestra }}</span></div>
              <div class="pos-amount">{{ item.importe_muestra }}</div>
            </div>
          }
        </section>

        <aside class="ts-card pos-summary">
          <span class="ticket">{{ data()!.ticketReferencia }}</span>
          <h2>Resumen de venta</h2>
          <p><span>Cajero</span><strong>{{ data()!.cajero }}</strong></p>
          <p><span>Sucursal</span><strong>{{ data()!.sucursal }}</strong></p>
          <hr>
          <p><span>Subtotal</span><strong>{{ data()!.resumenVisualEtiquetas.subtotalEtiqueta }}</strong></p>
          <p><span>IGV</span><strong>{{ data()!.resumenVisualEtiquetas.igvEtiqueta }}</strong></p>
          <p><span>Descuento</span><strong>{{ data()!.resumenVisualEtiquetas.descuentoEtiqueta }}</strong></p>
          <p class="total"><span>Total</span><strong>{{ data()!.resumenVisualEtiquetas.totalEtiqueta }}</strong></p>
        </aside>
      </div>
    }
  `,
  styles: [`
    .pos-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, .7fr); gap: 18px; }
    .pos-products h2, .pos-summary h2 { margin-bottom: 14px; }
    .pos-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--ts-border-subtle); }
    .pos-item div:first-child { display: flex; flex-direction: column; }
    .pos-item span { color: var(--ts-text-muted); font-size: .78rem; }
    .pos-amount { font-weight: 800; color: var(--ts-primary); }
    .pos-summary { height: fit-content; }
    .ticket { display: block; color: var(--ts-primary); font-size: .75rem; font-weight: 800; margin-bottom: 4px; }
    .pos-summary p { display: flex; justify-content: space-between; gap: 10px; margin: 9px 0; font-size: .85rem; }
    .pos-summary p span { color: var(--ts-text-secondary); }
    .pos-summary hr { border: 0; border-top: 1px solid var(--ts-border); margin: 14px 0; }
    .pos-summary .total { font-size: 1.05rem; }
    @media (max-width: 760px) { .pos-layout { grid-template-columns: 1fr; } }
  `]
})
export class VentaPosPageComponent implements OnInit {
  private readonly jsonService = inject(JsonDataService);
  data = signal<any>(null);

  ngOnInit(): void {
    this.jsonService.getData<any>('ventas-pos-muestra').subscribe(result => {
      const pos = result as any;
      this.data.set({ ...pos, itemsSeleccionadosMuestra: pos.itemsSeleccionadosMuestra });
    });
  }
}

