import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { JsonDataService } from '../../core/services/json-data.service';
import { VentaCreditoService } from '../../core/services/venta-credito.service';
import { Cliente } from '../../shared/models/cliente.model';
import { Producto } from '../../shared/models/producto.model';
import { TipoTasa, procesarVentaCredito } from '../../core/finanzas/motor-financiero';

const hoy = () => new Date().toISOString().slice(0, 10);
const num = (e: Event) => Number((e.target as HTMLInputElement).value);
const txt = (e: Event) => (e.target as HTMLInputElement).value;

@Component({
  selector: 'app-credito-nueva-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <app-page-header breadcrumb="Créditos y cuentas · Nueva venta" title="Nueva venta a crédito"
      subtitle="Simulación con el motor financiero (método francés, base 360)." />

    <div class="credito-grid">
      <section class="ts-card">
        <h2>Datos de la venta</h2>

        <label>Cliente</label>
        <select class="ts-select" (change)="clienteId.set(num($event))">
          <option value="0">— Selecciona —</option>
          @for (c of clientes(); track c.cliente_id) {
            <option [value]="c.cliente_id">{{ c.nombres_razon_social }}</option>
          }
        </select>

        <label>Producto</label>
        <select class="ts-select" (change)="productoId.set(num($event)); monto.set(precioProducto())">
          <option value="0">— Selecciona —</option>
          @for (p of productos(); track p.producto_id) {
            <option [value]="p.producto_id">{{ p.icono }} {{ p.nombre_producto }} (S/ {{ p.precio_credito }})</option>
          }
        </select>

        <label>Monto del consumo (S/)</label>
        <input class="ts-input" type="number" min="0" step="0.01" [value]="monto()" (input)="monto.set(num($event))">

        <label>Fecha de compra</label>
        <input class="ts-input" type="date" [value]="fechaCompra()" (input)="fechaCompra.set(txt($event))">

        <div class="fila">
          <div><label>Día de corte</label>
            <input class="ts-input" type="number" min="1" max="28" [value]="diaCorte()" (input)="diaCorte.set(num($event))"></div>
          <div><label>Día de pago</label>
            <input class="ts-input" type="number" min="1" max="28" [value]="diaPago()" (input)="diaPago.set(num($event))"></div>
        </div>

        <div class="fila">
          <div><label>N.º de cuotas</label>
            <input class="ts-input" type="number" min="1" max="60" [value]="cuotas()" (input)="cuotas.set(num($event))"></div>
          <div><label>Tipo de tasa</label>
            <select class="ts-select" (change)="tipoTasa.set($any($event.target).value)">
              <option value="TEA">TEA</option>
              <option value="TNA">TNA (cap. diaria)</option>
            </select></div>
          <div><label>Tasa (%)</label>
            <input class="ts-input" type="number" min="0" step="0.01" [value]="tasaPct()" (input)="tasaPct.set(num($event))"></div>
        </div>
      </section>

      <section class="ts-card">
        <h2>Resultado</h2>
        @if (cliente(); as c) {
          <p class="nota">Límite: S/ {{ c.limite_credito }} · Saldo en uso: S/ {{ pendiente() | number:'1.2-2' }}</p>
        }
        @if (!cliente()) {
          <p class="nota">Selecciona un cliente para validar la línea de crédito.</p>
        } @else if (!resultado().aprobada) {
          <p class="rechazo">❌ {{ resultado().motivo }}</p>
        } @else {
          @let r = resultado();
          <div class="metric-grid">
            <div><span>Fecha de pago</span><strong>{{ r.fechaPago }}</strong></div>
            <div><span>Días de gracia</span><strong>{{ r.diasGracia }}</strong></div>
            <div><span>TEM</span><strong>{{ r.tem! * 100 | number:'1.4-4' }} %</strong></div>
            <div><span>Interés por gracia</span><strong>S/ {{ r.interesGracia | number:'1.2-2' }}</strong></div>
            <div><span>Saldo capitalizado</span><strong>S/ {{ r.saldoCapitalizado | number:'1.2-2' }}</strong></div>
            <div><span>Cuota fija</span><strong>S/ {{ r.cuotaFija | number:'1.2-2' }}</strong></div>
            <div><span>TCEA</span><strong>{{ r.tcea! * 100 | number:'1.2-2' }} %</strong></div>
            <div><span>Línea tras la venta</span><strong>S/ {{ r.lineaDisponible - monto() | number:'1.2-2' }}</strong></div>
          </div>
          <button type="button" class="ts-btn ts-btn-primary" (click)="confirmar()">Confirmar venta a crédito</button>
          @if (mensaje()) { <p class="ok">{{ mensaje() }}</p> }
        }
      </section>
    </div>

    @if (resultado().aprobada && cliente()) {
      <h2 class="sub">Cronograma de pagos</h2>
      <app-data-table [headers]="['Cuota','Vencimiento','Saldo inicial','Interés','Amortización','Cuota','Saldo final']">
        @for (f of resultado().cronograma!; track f.k) {
          <tr>
            <td><strong>#{{ f.k }}</strong></td><td>{{ f.vencimiento }}</td>
            <td>{{ f.saldoInicial | number:'1.2-2' }}</td><td>{{ f.interes | number:'1.2-2' }}</td>
            <td>{{ f.amortizacion | number:'1.2-2' }}</td><td>{{ f.cuota | number:'1.2-2' }}</td>
            <td>{{ f.saldo | number:'1.2-2' }}</td>
          </tr>
        }
      </app-data-table>
    }
  `,
  styles: [`
    .credito-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px; }
    section h2, .sub { margin-bottom: 14px; }
    label { display: block; margin: 12px 0 6px; font-size: .82rem; font-weight: 700; }
    .fila { display: flex; gap: 10px; } .fila > div { flex: 1; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
    .metric-grid div { background: var(--ts-accent-cream); border: 1px solid var(--ts-border-subtle); border-radius: 8px; padding: 12px; }
    .metric-grid span, .metric-grid strong { display: block; }
    .metric-grid span { color: var(--ts-text-secondary); font-size: .75rem; }
    .metric-grid strong { margin-top: 3px; }
    .nota { color: var(--ts-text-secondary); font-size: .85rem; margin-bottom: 12px; }
    .rechazo { color: var(--ts-danger-text); background: var(--ts-danger-bg); padding: 12px; border-radius: 8px; font-weight: 700; }
    .ok { color: var(--ts-success-text); margin-top: 10px; font-weight: 700; }
    @media (max-width: 760px) { .credito-grid { grid-template-columns: 1fr; } .fila { flex-direction: column; } }
  `]
})
export class CreditoNuevaPageComponent implements OnInit {
  private readonly json = inject(JsonDataService);
  private readonly ventas = inject(VentaCreditoService);

  readonly num = num;
  readonly txt = txt;

  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);

  clienteId = signal(0);
  productoId = signal(0);
  monto = signal(0);
  fechaCompra = signal(hoy());
  diaCorte = signal(20);
  diaPago = signal(26);
  cuotas = signal(3);
  tipoTasa = signal<TipoTasa>('TEA');
  tasaPct = signal(24);
  mensaje = signal('');

  cliente = computed(() => this.clientes().find(c => c.cliente_id === this.clienteId()));
  precioProducto = () => this.productos().find(p => p.producto_id === this.productoId())?.precio_credito ?? 0;

  /** Saldo en uso = el del JSON + lo vendido en esta sesión. */
  pendiente = computed(() => (this.cliente()?.saldo_utilizado ?? 0) + this.ventas.saldoPendienteCliente(this.clienteId()));

  resultado = computed(() =>
    procesarVentaCredito({
      monto: this.monto(),
      limite: this.cliente()?.limite_credito ?? 0,
      pendientes: this.pendiente(),
      fechaCompra: this.fechaCompra(),
      diaCorte: this.diaCorte(),
      diaPago: this.diaPago(),
      cuotas: this.cuotas(),
      tipoTasa: this.tipoTasa(),
      tasa: this.tasaPct() / 100,
    })
  );

  ngOnInit(): void {
    this.json.getData<Cliente[]>('clientes').subscribe(d => this.clientes.set(d));
    this.json.getData<Producto[]>('productos').subscribe(d => this.productos.set(d));
  }

  confirmar(): void {
    const c = this.cliente();
    const r = this.resultado();
    if (!c || !r.aprobada) return;
    const p = this.productos().find(x => x.producto_id === this.productoId());
    const v = this.ventas.guardar({
      clienteId: c.cliente_id,
      clienteNombre: c.nombres_razon_social,
      producto: p?.nombre_producto ?? 'Consumo libre',
      entrada: {
        monto: this.monto(), limite: c.limite_credito, pendientes: this.pendiente(),
        fechaCompra: this.fechaCompra(), diaCorte: this.diaCorte(), diaPago: this.diaPago(),
        cuotas: this.cuotas(), tipoTasa: this.tipoTasa(), tasa: this.tasaPct() / 100,
      },
      resultado: r,
    });
    this.mensaje.set(`Venta ${v.id} registrada.`);
  }
}
