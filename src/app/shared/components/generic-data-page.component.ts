import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { JsonDataService } from '../../core/services/json-data.service';
import { VentaCreditoService } from '../../core/services/venta-credito.service';
import { PageHeaderComponent } from './page-header/page-header.component';
import { DataTableComponent } from './data-table/data-table.component';
interface ColumnConfig {
  key: string;
  label: string;
}
const ids: Record<string, string> = {
  clientes: 'cliente_id',
  productos: 'producto_id',
  sucursales: 'sucursal_id',
  proveedores: 'proveedor_id',
};
import { condiciones, articulo } from '../../core/services/condiciones';
const numericos = [
  'tasaPct',
  'tnmPct',
  'maxCuotas',
  'diaCorte',
  'diaPago',
  'proveedorId',
  'limite_credito',
  'precio_contado',
  'precio_credito',
  'stock_referencial',
];
@Component({
  selector: 'app-generic-data-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent],
  template: ` <app-page-header [breadcrumb]="breadcrumb" [title]="title" [subtitle]="subtitle">
      @if (editable) {
        <button class="ts-btn ts-btn-primary" (click)="editar(-1)">+ Nuevo registro</button>
      }
    </app-page-header>
    @if (borrador) {
      <section class="ts-card" style="margin-bottom:16px">
        <h2>{{ indice < 0 ? 'Nuevo registro' : 'Editar registro' }}</h2>
        <form (ngSubmit)="guardar()">
          @for (c of campos; track c.key) {
            <label style="display:block;margin-top:8px">{{ c.label }}</label>
            <small style="display:block;color:var(--ts-text-secondary)">{{ ayuda(c.key) }}</small>
            @if (c.key === 'imagen') {
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                (change)="cargarImagen($event)"
              /><input
                class="ts-input"
                [name]="c.key"
                [(ngModel)]="borrador[c.key]"
                placeholder="URL HTTPS opcional"
              />
              @if (borrador[c.key]) {
                <img [src]="borrador[c.key]" style="max-width:100px" alt="Imagen del artículo" />
              }
            } @else if (c.key === 'horaCorte') {
              <input type="time" class="ts-input" [name]="c.key" [(ngModel)]="borrador[c.key]" />
            } @else if (c.key === 'proveedorId') {
              <select class="ts-select" [name]="c.key" [(ngModel)]="borrador[c.key]">
                <option [ngValue]="0">Sin proveedor</option>
                @for (p of proveedores; track p.proveedor_id) {
                  <option [ngValue]="p.proveedor_id">{{ p.razon_social }}</option>
                }
              </select>
            } @else if (opciones(c.key).length) {
              <select class="ts-select" [name]="c.key" [(ngModel)]="borrador[c.key]">
                @for (o of opciones(c.key); track o) {
                  <option [value]="o">{{ o }}</option>
                }
              </select>
            } @else if (esNumero(c.key)) {
              <input
                class="ts-input"
                type="number"
                min="0"
                [step]="
                  ['tasaPct', 'tnmPct'].includes(c.key)
                    ? 0.0000001
                    : ['diaPago', 'diaCorte', 'maxCuotas', 'stock_referencial'].includes(c.key)
                      ? 1
                      : 0.01
                "
                [name]="c.key"
                [(ngModel)]="borrador[c.key]"
                required
              />
            } @else {
              <input class="ts-input" [name]="c.key" [(ngModel)]="borrador[c.key]" required />
            }
          }
          @if (file === 'clientes' && indice < 0) {
            <label
              ><input type="checkbox" name="consentimiento" [(ngModel)]="consentimiento" />
              Consentimiento para registrar los datos</label
            >
          }
          <p>
            <button class="ts-btn ts-btn-primary" type="submit" [disabled]="ocupado">
              Guardar
            </button>
            <button class="ts-btn" type="button" (click)="borrador = null">Cancelar</button>
          </p>
        </form>
      </section>
    }
    <p role="status">{{ mensaje }}</p>
    <app-data-table
      [headers]="labels"
      [footerText]="editable ? 'Registros locales' : 'Datos de referencia'"
      ><tr *ngFor="let row of rows(); index as i">
        <td *ngFor="let c of columns">
          @if (file === 'productos' && c.key === 'nombre_producto' && row['imagen']) {
            <img
              [src]="row['imagen']"
              alt="Imagen del artículo"
              style="width:44px;height:44px;object-fit:cover;vertical-align:middle;margin-right:6px"
            />
          }
          {{ valor(row, c.key) }}
        </td>
        @if (editable) {
          <td>
            <button class="ts-btn" (click)="editar(i)">Editar</button>
            @if (file === 'productos') {
              <button class="ts-btn" (click)="eliminar(i)">Eliminar</button>
            }
          </td>
        }
      </tr></app-data-table
    >`,
})
export class GenericDataPageComponent implements OnInit {
  cdr = inject(ChangeDetectorRef);
  ocupado = false;
  route = inject(ActivatedRoute);
  json = inject(JsonDataService);
  ventas = inject(VentaCreditoService);
  title = '';
  subtitle = '';
  breadcrumb = '';
  file = '';
  columns: ColumnConfig[] = [];
  rows = signal<Record<string, any>[]>([]);
  borrador: Record<string, any> | null = null;
  indice = -1;
  mensaje = '';
  consentimiento = false;
  get editable() {
    return !!ids[this.file];
  }
  get labels() {
    return [...this.columns.map((c) => c.label), ...(this.editable ? ['Acciones'] : [])];
  }
  proveedores: any[] = [];
  get campos() {
    const extras =
      this.file === 'clientes'
        ? {
            tipoTasa: 'Tipo de tasa anual',
            tasaPct: 'Tasa pactada (%)',
            tipoMora: 'Tipo de mora anual',
            tnmPct: 'Tasa moratoria (%)',
            moneda: 'Moneda',
            maxCuotas: 'Máximo de cuotas',
            diaCorte: 'Día de corte',
            horaCorte: 'Hora de corte',
            diaPago: 'Día de pago',
          }
        : this.file === 'productos'
          ? {
              monedaPrecio: 'Moneda de precios',
              tipoArticulo: 'Producto o servicio',
              marca: 'Marca',
              descripcion: 'Descripción',
              unidad: 'Unidad de medida',
              proveedorId: 'Proveedor',
              imagen: 'Imagen',
              pagoUnico: 'Permite pago único',
              pagoCuotas: 'Permite cuotas',
            }
          : {};
    return [
      ...this.columns,
      ...Object.entries(extras).map(([key, label]) => ({ key, label: String(label) })),
    ].filter((c) => !['saldo_utilizado', 'credito_disponible', ids[this.file]].includes(c.key));
  }
  esNumero(k: string) {
    return numericos.includes(k);
  }
  ayuda(k: string) {
    return (
      (
        {
          tasaPct: 'Tasa anual en porcentaje; base 360.',
          tnmPct: 'Tasa anual de mora; solo días de atraso.',
          diaCorte: 'Día mensual de cierre (1–31).',
          horaCorte: 'Compras posteriores pasan al ciclo siguiente.',
          diaPago: 'Día pactado de vencimiento.',
          maxCuotas: 'Máximo de meses permitido (1–60).',
          moneda: 'Moneda del contrato; no se convierte automáticamente.',
          proveedorId: 'Seleccione proveedor cuando corresponda.',
          imagen: 'Archivo PNG, JPEG o WebP o URL HTTPS.',
        } as Record<string, string>
      )[k] ?? 'Ingrese o seleccione ' + k.replaceAll('_', ' ') + '.'
    );
  }
  cargarImagen(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (f.size > 1400000) {
      this.mensaje = 'Imagen demasiado grande';
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      if (this.borrador) this.borrador['imagen'] = String(r.result);
      this.cdr.markForCheck();
    };
    r.readAsDataURL(f);
  }
  opciones(k: string): string[] {
    const opts: Record<string, string[]> = {
      tipoTasa: ['TEA', 'TNA'],
      tipoMora: ['TNM', 'TEMORA'],
      moneda: ['PEN', 'USD'],
      monedaPrecio: ['PEN', 'USD'],
      tipoArticulo: ['Producto', 'Servicio'],
      pagoUnico: ['Sí', 'No'],
      pagoCuotas: ['Sí', 'No'],
    };
    if (opts[k]) return opts[k];
    if (k === 'estado_disponibilidad') return ['Disponible', 'No disponible'];
    if (k === 'estado' && ['clientes', 'proveedores'].includes(this.file))
      return ['Activo', 'Inactivo'];
    if (k === 'estado' && this.file === 'sucursales')
      return ['Operativa', 'Mantenimiento', 'Inactiva'];
    return [];
  }
  ngOnInit() {
    const d = this.route.snapshot.data;
    this.title = d['title'];
    this.subtitle = d['subtitle'];
    this.breadcrumb = d['breadcrumb'];
    this.file = d['file'];
    this.columns = d['columns'];
    this.cargar();
    if (this.file === 'productos')
      this.json.getData<any[]>('proveedores').subscribe((v) => {
        this.proveedores = v;
        this.cdr.markForCheck();
      });
    if (this.file === 'clientes') void this.ventas.cargar();
  }
  valor(row: Record<string, any>, key: string) {
    if (this.file === 'clientes') {
      if (['saldo_utilizado', 'credito_disponible'].includes(key) && !this.ventas.listo())
        return '—';
      const saldo = this.ventas.saldoPendienteCliente(row['cliente_id']);
      if (key === 'saldo_utilizado') return saldo.toFixed(2);
      if (key === 'credito_disponible') return (row['limite_credito'] - saldo).toFixed(2);
    }
    if (['precio_contado', 'precio_credito'].includes(key))
      return (row['monedaPrecio'] ?? 'PEN') + ' ' + Number(row[key]).toFixed(2);
    if (key === 'limite_credito')
      return (row['moneda'] ?? 'PEN') + ' ' + Number(row[key]).toFixed(2);
    return row[key] ?? '';
  }
  editar(i: number) {
    this.indice = i;
    this.consentimiento = false;
    this.mensaje = '';
    this.borrador =
      i >= 0
        ? { ...this.rows()[i] }
        : Object.fromEntries(
            this.campos.map((c) => [
              c.key,
              this.esNumero(c.key)
                ? 0
                : c.key.startsWith('estado')
                  ? this.file === 'productos'
                    ? 'Disponible'
                    : this.file === 'sucursales'
                      ? 'Operativa'
                      : 'Activo'
                  : '',
            ]),
          );
    if (i < 0)
      Object.assign(
        this.borrador!,
        this.file === 'clientes' ? condiciones : this.file === 'productos' ? articulo : {},
      );
  }
  cargar() {
    this.json.getData<any>(this.file).subscribe({
      next: (r) =>
        this.rows.set(
          Array.isArray(r) ? r : ((Object.values(r).find(Array.isArray) as any[]) ?? []),
        ),
      error: (e) => {
        this.mensaje = e.error?.error || 'No se pudo cargar';
        this.cdr.markForCheck();
      },
    });
  }
  async guardar() {
    if (!this.borrador || this.ocupado) return;
    this.ocupado = true;
    try {
      const b = { ...this.borrador };
      for (const c of this.campos) {
        if (this.esNumero(c.key)) {
          if (!Number.isFinite(b[c.key]) || b[c.key] < 0) throw Error('Valor numérico inválido');
        } else if (c.key !== 'imagen' && !String(b[c.key] ?? '').trim())
          throw Error('Complete ' + c.label);
      }
      const list = [...this.rows()];
      if (this.file === 'clientes') {
        if (this.indice < 0 && !this.consentimiento) throw Error('Se requiere consentimiento');
        if (!/^\d{8}$|^\d{11}$/.test(b['dni_ruc'])) throw Error('DNI/RUC inválido');
        if (list.some((x, i) => i !== this.indice && x['dni_ruc'] === b['dni_ruc']))
          throw Error('Documento duplicado');
        if (b['limite_credito'] < this.ventas.saldoPendienteCliente(b['cliente_id']))
          throw Error('Límite menor a deuda vigente');
        b['saldo_utilizado'] ??= 0;
        b['credito_disponible'] = b['limite_credito'] - b['saldo_utilizado'];
      }
      if (this.file === 'productos') {
        if (b['precio_contado'] <= 0 || b['precio_credito'] <= 0)
          throw Error('Los precios deben ser positivos');
        if (list.some((x, i) => i !== this.indice && x['sku'] === b['sku']))
          throw Error('SKU duplicado');
        b['icono'] ??= '🍰';
      }
      const id = this.indice < 0 ? null : b[ids[this.file]];
      if (this.file === 'clientes' && this.indice < 0) b['consentimiento'] = this.consentimiento;
      await this.json.guardarRegistro(this.file, id, b);
      this.cargar();
      this.borrador = null;
      this.mensaje = 'Registro guardado';
    } catch (e) {
      this.mensaje = (e as Error).message;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }
  async eliminar(i: number) {
    if (this.ocupado || !confirm('¿Eliminar producto del catálogo?')) return;
    this.ocupado = true;
    try {
      await this.json.eliminarRegistro(this.file, this.rows()[i][ids[this.file]]);
      this.cargar();
      this.mensaje = 'Producto eliminado';
    } catch (e) {
      this.mensaje = (e as Error).message;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }
}
