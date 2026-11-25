import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { JsonDataService } from '../../core/services/json-data.service';
import { VentaCreditoService } from '../../core/services/venta-credito.service';
import { Cliente } from '../../shared/models/cliente.model';
import { Producto } from '../../shared/models/producto.model';
import { Sucursal } from '../../shared/models/sucursal.model';
import { operacionLocal } from '../../core/services/local-store';
import { horaLima } from '../../core/services/condiciones';
import {
  TipoTasa,
  ResultadoVenta,
  procesarVentaCredito,
  hoyLocal,
} from '../../core/finanzas/motor-financiero';

const hoy = hoyLocal;
const num = (e: Event) => Number((e.target as HTMLInputElement).value);
const txt = (e: Event) => (e.target as HTMLInputElement).value;

@Component({
  selector: 'app-credito-nueva-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <app-page-header
      breadcrumb="Créditos y cuentas · Nueva venta"
      title="Nueva venta a crédito"
      subtitle="Simulación con el motor financiero (método francés, base 360)."
    />

    <div class="credito-grid">
      <section class="ts-card">
        <h2>Datos de la venta</h2>

        <label>Sucursal</label
        ><select class="ts-select" [value]="sucursalId()" (change)="sucursalId.set(num($event))">
          <option value="0">Seleccione sucursal</option>
          @for (s of sucursales(); track s.sucursal_id) {
            <option [value]="s.sucursal_id">{{ s.nombre_sucursal }}</option>
          }
        </select>
        <label>Cliente</label>
        <select class="ts-select" (change)="seleccionarCliente(num($event))">
          <option value="0">— Selecciona —</option>
          @for (c of clientes(); track c.cliente_id) {
            <option [value]="c.cliente_id">{{ c.nombres_razon_social }}</option>
          }
        </select>

        <label>Producto</label>
        <select
          class="ts-select"
          (change)="productoId.set(num($event)); monto.set(precioProducto())"
        >
          <option value="0">Consumo libre / importe manual</option>
          @for (p of productos(); track p.producto_id) {
            <option [value]="p.producto_id">
              {{ p.icono }} {{ p.nombre_producto }} ({{ p.monedaPrecio || 'PEN' }}
              {{ p.precio_credito }})
            </option>
          }
        </select>

        <label>Monto del consumo ({{ cliente()?.moneda || 'PEN' }})</label>
        <input
          class="ts-input"
          type="number"
          min="0"
          step="0.01"
          [value]="monto()"
          (input)="monto.set(num($event))"
        />

        <label>Hora de compra</label
        ><input
          class="ts-input"
          type="time"
          [value]="horaCompra()"
          (input)="horaCompra.set(txt($event))"
        /><small>Corte pactado: {{ cliente()?.horaCorte }}</small
        ><label>Fecha de compra</label><small>No se permiten fechas futuras.</small>
        <input
          class="ts-input"
          type="date"
          [max]="hoy()"
          [value]="fechaCompra()"
          (input)="fechaCompra.set(txt($event))"
        />

        <div class="fila">
          <div>
            <label>Día de corte</label
            ><small>Después del corte se traslada al mes siguiente.</small>
            <input
              class="ts-input"
              type="number"
              min="1"
              max="31"
              [disabled]="!!cliente()"
              [value]="diaCorte()"
              (input)="diaCorte.set(num($event))"
            />
          </div>
          <div>
            <label>Día de pago</label>
            <input
              class="ts-input"
              type="number"
              min="1"
              max="31"
              [disabled]="!!cliente()"
              [value]="diaPago()"
              (input)="diaPago.set(num($event))"
            />
          </div>
        </div>

        <label>Modalidad</label
        ><select class="ts-select" (change)="modalidad.set($any($event.target).value)">
          <option value="cuotas">Cuotas</option>
          <option value="unico">Pago único</option></select
        ><label>Mora anual (%) · {{ cliente()?.tipoMora || 'TNM' }}</label
        ><input
          class="ts-input"
          type="number"
          min="0"
          max="100"
          step="0.01"
          [disabled]="!!cliente()"
          [value]="tnm()"
          (input)="tnm.set(num($event))"
        />
        <div class="fila">
          <div>
            <label>N.º de cuotas</label
            ><small>Máximo pactado: {{ cliente()?.maxCuotas || 60 }}.</small>
            <input
              class="ts-input"
              type="number"
              min="1"
              [max]="cliente()?.maxCuotas || 60"
              [disabled]="modalidad() === 'unico'"
              [value]="cuotas()"
              (input)="cuotas.set(num($event))"
            />
          </div>
          <div>
            <label>Tipo de tasa</label
            ><small>TEA efectiva anual o TNA con capitalización diaria.</small>
            <select
              class="ts-select"
              [disabled]="!!cliente()"
              [value]="tipoTasa()"
              (change)="tipoTasa.set($any($event.target).value)"
            >
              <option value="TEA">TEA</option>
              <option value="TNA">TNA (cap. diaria)</option>
            </select>
          </div>
          <div>
            <label>Tasa (%)</label>
            <input
              class="ts-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              [disabled]="!!cliente()"
              [value]="tasaPct()"
              (input)="tasaPct.set(num($event))"
            />
          </div>
        </div>
        <button
          class="ts-btn ts-btn-secondary"
          (click)="guardarConfig()"
          [disabled]="ocupado() || !!cliente()"
        >
          Guardar condiciones predeterminadas
        </button>
      </section>

      <section class="ts-card">
        <h2>Resultado</h2>
        @if (cliente(); as c) {
          <p class="nota">
            Límite: {{ cliente()?.moneda || 'PEN' }} {{ c.limite_credito }} · Saldo en uso:
            {{ cliente()?.moneda || 'PEN' }} {{ pendiente() | number: '1.2-2' }}
          </p>
        }
        @if (!cliente()) {
          <p class="nota">Selecciona un cliente para validar la línea de crédito.</p>
        } @else if (cliente()?.estado !== 'Activo') {
          <p class="rechazo">Cliente inactivo.</p>
        } @else if (monto() <= 0) {
          <p class="nota">Ingrese un monto para simular un nuevo crédito.</p>
        } @else if (!resultado().aprobada) {
          <p class="rechazo">❌ {{ resultado().motivo }}</p>
        } @else {
          @let r = resultado();
          <div class="metric-grid">
            <div>
              <span>Fecha de pago</span><strong>{{ r.fechaPago }}</strong>
            </div>
            <div>
              <span>Días de gracia</span><strong>{{ r.diasGracia }}</strong>
            </div>
            <div>
              <span>TEM</span><strong>{{ r.tem! * 100 | number: '1.7-7' }} %</strong>
            </div>
            <div>
              <span>Interés por gracia</span
              ><strong
                >{{ cliente()?.moneda || 'PEN' }} {{ r.interesGracia | number: '1.2-2' }}</strong
              >
            </div>
            <div>
              <span>{{
                modalidad() === 'unico' ? 'Deuda al vencimiento' : 'Saldo capitalizado'
              }}</span><strong
                >{{ cliente()?.moneda || 'PEN' }}
                {{ r.saldoCapitalizado | number: '1.2-2' }}</strong
              >
            </div>
            <div>
              <span>{{ modalidad() === 'unico' ? 'Pago único' : 'Cuota fija' }}</span><strong
                >{{ cliente()?.moneda || 'PEN' }} {{ r.cuotaFija | number: '1.2-2' }}</strong
              >
            </div>
            <div>
              <span>TCEA</span><strong>{{ r.tcea! * 100 | number: '1.7-7' }} %</strong>
            </div>
            <div>
              <span>Línea tras la venta</span
              ><strong
                >{{ cliente()?.moneda || 'PEN' }}
                {{
                  r.lineaDisponible - (modalidad() === 'unico' ? monto() : r.saldoCapitalizado!)
                    | number: '1.2-2'
                }}</strong
              >
            </div>
          </div>
          <button
            type="button"
            class="ts-btn ts-btn-primary"
            [disabled]="ocupado() || !ventas.listo() || !sucursalId()"
            (click)="confirmar()"
          >
            Confirmar venta a crédito
          </button>
        }
        @if (ventas.error()) {
          <p role="alert">{{ ventas.error() }}</p>
        }
        @if (mensaje()) {
          <p role="status">{{ mensaje() }}</p>
        }
      </section>
    </div>

    @if (resultado().aprobada && cliente()) {
      <h2 class="sub">Cronograma de pagos</h2>
      <app-data-table
        [headers]="[
          'Cuota',
          'Vencimiento',
          'Saldo inicial',
          'Interés',
          'Amortización',
          'Cuota',
          'Saldo final',
        ]"
      >
        @for (f of resultado().cronograma!; track f.k) {
          <tr>
            <td>
              <strong>#{{ f.k }}</strong>
            </td>
            <td>{{ f.vencimiento }}</td>
            <td>{{ f.saldoInicial | number: '1.2-2' }}</td>
            <td>{{ f.interes | number: '1.2-2' }}</td>
            <td>{{ f.amortizacion | number: '1.2-2' }}</td>
            <td>{{ f.cuota | number: '1.2-2' }}</td>
            <td>{{ f.saldo | number: '1.2-2' }}</td>
          </tr>
        }
      </app-data-table>
    }
  `,
  styles: [
    `
      .credito-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-bottom: 22px;
      }
      section h2,
      .sub {
        margin-bottom: 14px;
      }
      label {
        display: block;
        margin: 12px 0 6px;
        font-size: 0.82rem;
        font-weight: 700;
      }
      .fila {
        display: flex;
        gap: 10px;
      }
      .fila > div {
        flex: 1;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 18px;
      }
      .metric-grid div {
        background: var(--ts-accent-cream);
        border: 1px solid var(--ts-border-subtle);
        border-radius: 8px;
        padding: 12px;
      }
      .metric-grid span,
      .metric-grid strong {
        display: block;
      }
      .metric-grid span {
        color: var(--ts-text-secondary);
        font-size: 0.75rem;
      }
      .metric-grid strong {
        margin-top: 3px;
      }
      .nota {
        color: var(--ts-text-secondary);
        font-size: 0.85rem;
        margin-bottom: 12px;
      }
      .rechazo {
        color: var(--ts-danger-text);
        background: var(--ts-danger-bg);
        padding: 12px;
        border-radius: 8px;
        font-weight: 700;
      }
      .ok {
        color: var(--ts-success-text);
        margin-top: 10px;
        font-weight: 700;
      }
      @media (max-width: 760px) {
        .credito-grid {
          grid-template-columns: 1fr;
        }
        .fila {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class CreditoNuevaPageComponent implements OnInit {
  private readonly json = inject(JsonDataService);
  readonly ventas = inject(VentaCreditoService);

  readonly num = num;
  readonly txt = txt;

  readonly hoy = hoy;
  sucursales = signal<Sucursal[]>([]);
  sucursalId = signal(0);
  ocupado = signal(false);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);

  horaCompra = signal(horaLima());
  seleccionarCliente(id: number) {
    this.clienteId.set(id);
    const c = this.cliente();
    if (c) {
      this.diaCorte.set(c.diaCorte ?? 20);
      this.diaPago.set(c.diaPago ?? 26);
      this.tasaPct.set(c.tasaPct ?? 24);
      this.tipoTasa.set(c.tipoTasa ?? 'TEA');
      this.tnm.set(c.tnmPct ?? 15);
      this.cuotas.set(Math.min(this.cuotas(), c.maxCuotas ?? 60));
    }
  }
  clienteId = signal(0);
  productoId = signal(0);
  monto = signal(0);
  fechaCompra = signal(hoy());
  diaCorte = signal(20);
  diaPago = signal(26);
  cuotas = signal(3);
  modalidad = signal<'cuotas' | 'unico'>('cuotas');
  tnm = signal(15);
  tipoTasa = signal<TipoTasa>('TEA');
  tasaPct = signal(24);
  mensaje = signal('');

  cliente = computed(() => this.clientes().find((c) => c.cliente_id === this.clienteId()));
  precioProducto = () =>
    this.productos().find((p) => p.producto_id === this.productoId())?.precio_credito ?? 0;

  /** Saldo de capital vigente de todos los contratos del cliente. */
  pendiente = computed(() => this.ventas.saldoPendienteCliente(this.clienteId()));

  resultado = computed<ResultadoVenta>(() => {
    const c = this.cliente(),
      p = this.productos().find((p) => p.producto_id === this.productoId());
    if (
      c &&
      ((this.modalidad() === 'cuotas' && this.cuotas() > (c.maxCuotas ?? 60)) ||
        (p &&
          ((p.monedaPrecio ?? 'PEN') !== (c.moneda ?? 'PEN') ||
            (this.modalidad() === 'unico' ? p.pagoUnico : p.pagoCuotas) === 'No')))
    )
      return {
        aprobada: false,
        motivo: 'Revise el máximo de cuotas, moneda o modalidad permitida.',
        lineaDisponible: 0,
      };
    return procesarVentaCredito({
      monto: this.monto(),
      limite: this.cliente()?.limite_credito ?? 0,
      pendientes: this.pendiente(),
      fechaCompra: this.fechaCompra(),
      horaCompra: this.horaCompra(),
      horaCorte: this.cliente()?.horaCorte,
      tipoMora: this.cliente()?.tipoMora,
      moneda: this.cliente()?.moneda,
      diaCorte: this.diaCorte(),
      diaPago: this.diaPago(),
      cuotas: this.modalidad() === 'unico' ? 1 : this.cuotas(),
      modalidad: this.modalidad(),
      tnm: this.tnm() / 100,
      tipoTasa: this.tipoTasa(),
      tasa: this.tasaPct() / 100,
    });
  });

  ngOnInit(): void {
    const err = (e: any) => this.mensaje.set(e.error?.error || 'No se pudo cargar la información');
    this.json
      .getData<Cliente[]>('clientes')
      .subscribe({ next: (d) => this.clientes.set(d), error: err });
    this.json.getData<Producto[]>('productos').subscribe({
      next: (d) => this.productos.set(d.filter((p) => p.estado_disponibilidad === 'Disponible')),
      error: err,
    });
    this.json.getData<Sucursal[]>('sucursales').subscribe({
      next: (d) => {
        const s = d.filter((x) => x.estado === 'Operativa');
        this.sucursales.set(s);
        this.sucursalId.set(s[0]?.sucursal_id ?? 0);
      },
      error: err,
    });
    void this.ventas.cargar();
    operacionLocal<any>('/config')
      .then((c) => {
        if (this.cliente()) return;
        this.diaCorte.set(c.diaCorte);
        this.diaPago.set(c.diaPago);
        this.tipoTasa.set(c.tipoTasa);
        this.tasaPct.set(c.tasaPct);
        this.tnm.set(c.tnmPct);
        this.cuotas.set(c.cuotas);
      })
      .catch((e) => this.mensaje.set(e.message));
  }
  async guardarConfig() {
    try {
      await operacionLocal('/config', 'PUT', {
        diaCorte: this.diaCorte(),
        diaPago: this.diaPago(),
        tipoTasa: this.tipoTasa(),
        tasaPct: this.tasaPct(),
        tnmPct: this.tnm(),
        cuotas: this.cuotas(),
      });
      this.mensaje.set('Condiciones predeterminadas guardadas');
    } catch (e) {
      this.mensaje.set((e as Error).message);
    }
  }
  async confirmar(): Promise<void> {
    const c = this.cliente();
    const r = this.resultado();
    if (!c || !r.aprobada || this.ocupado() || !this.ventas.listo() || !this.sucursalId()) return;
    if (c.estado !== 'Activo') {
      this.mensaje.set('Cliente inactivo');
      return;
    }
    const p = this.productos().find((x) => x.producto_id === this.productoId());
    this.ocupado.set(true);
    this.mensaje.set('');
    try {
      const v = await this.ventas.guardar({
        clienteId: c.cliente_id,
        clienteNombre: c.nombres_razon_social,
        producto: p?.nombre_producto ?? 'Consumo libre',
        productoId: p?.producto_id,
        sucursalId: this.sucursalId(),
        entrada: {
          monto: this.monto(),
          limite: c.limite_credito,
          pendientes: this.pendiente(),
          fechaCompra: this.fechaCompra(),
          horaCompra: this.horaCompra(),
          horaCorte: this.cliente()?.horaCorte,
          tipoMora: this.cliente()?.tipoMora,
          moneda: this.cliente()?.moneda,
          diaCorte: this.diaCorte(),
          diaPago: this.diaPago(),
          cuotas: this.modalidad() === 'unico' ? 1 : this.cuotas(),
          modalidad: this.modalidad(),
          tnm: this.tnm() / 100,
          tipoTasa: this.tipoTasa(),
          tasa: this.tasaPct() / 100,
        },
        resultado: r,
      });
      this.mensaje.set(`Venta ${v.id} registrada. Consulte Créditos y Cronograma.`);
      this.monto.set(0);
    } catch (e) {
      this.mensaje.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
