import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JsonDataService } from '../../core/services/json-data.service';
import { Producto } from '../../shared/models/producto.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { operacionLocal } from '../../core/services/local-store';
import { Sucursal } from '../../shared/models/sucursal.model';
import { r2 } from '../../core/finanzas/motor-financiero';
@Component({
  selector: 'app-venta-pos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent],
  template: `<app-page-header
      breadcrumb="Operación comercial · Caja"
      title="Ventas"
      subtitle="Ventas al contado y acceso a financiamiento"
    />
    <section class="ts-card">
      <a routerLink="/creditos/nueva">Registrar venta a crédito</a>
      <h2>Venta al contado</h2>
      <label>Sucursal</label
      ><select class="ts-select" [(ngModel)]="sucursalId">
        <option [ngValue]="0">Seleccione sucursal</option>
        @for (s of sucursales(); track s.sucursal_id) {
          <option [ngValue]="s.sucursal_id">{{ s.nombre_sucursal }}</option>
        }</select
      ><select class="ts-select" [(ngModel)]="id">
        <option [ngValue]="0">Seleccione producto</option>
        @for (p of productos(); track p.producto_id) {
          <option [ngValue]="p.producto_id">
            {{ p.nombre_producto }} · {{ p.monedaPrecio || 'PEN' }} {{ p.precio_contado }}
          </option>
        }</select
      ><label>Cantidad</label
      ><input class="ts-input" type="number" min="1" [(ngModel)]="cantidad" /><button
        class="ts-btn"
        (click)="agregar()"
      >
        Agregar
      </button>
      @for (i of carrito(); track $index) {
        <p>
          {{ i.nombre }} × {{ i.cantidad }} · {{ i.moneda }} {{ i.total }}
          <button class="ts-btn" (click)="quitar($index)">Quitar</button>
        </p>
      }
      <h2>Total: {{ carrito()[0]?.moneda || 'PEN' }} {{ total() | number: '1.2-2' }}</h2>
      <button
        class="ts-btn ts-btn-primary"
        (click)="confirmar()"
        [disabled]="!carrito().length || ocupado || !sucursalId"
      >
        Procesar venta
      </button>
      <button class="ts-btn" (click)="carrito.set([])">Limpiar</button>
      <p role="status">{{ mensaje }}</p>
    </section>
    <section class="ts-card">
      <h2>Ventas al contado registradas</h2>
      @for (v of historial(); track v.id) {
        <p>{{ v.fecha }} · {{ v.id }} · {{ v.moneda || 'PEN' }} {{ v.total | number: '1.2-2' }}</p>
      }
    </section> `,
})
export class VentaPosPageComponent implements OnInit {
  cdr = inject(ChangeDetectorRef);
  ocupado = false;
  sucursales = signal<Sucursal[]>([]);
  sucursalId = 0;
  json = inject(JsonDataService);
  productos = signal<Producto[]>([]);
  id = 0;
  cantidad = 1;
  mensaje = '';
  carrito = signal<
    { productoId: number; nombre: string; moneda: string; cantidad: number; total: number }[]
  >([]);
  total = computed(() => r2(this.carrito().reduce((a, i) => a + i.total, 0)));
  historial = signal<any[]>([]);
  ngOnInit() {
    this.json
      .getData<Producto[]>('productos')
      .subscribe((p) =>
        this.productos.set(p.filter((x) => x.estado_disponibilidad === 'Disponible')),
      );
    this.json.getData<Sucursal[]>('sucursales').subscribe((s) => {
      this.sucursales.set(s.filter((x) => x.estado === 'Operativa'));
      this.sucursalId = this.sucursales()[0]?.sucursal_id ?? 0;
    });
    operacionLocal<any[]>('/ventas-contado')
      .then((v) => this.historial.set(v))
      .catch((e) => {
        this.mensaje = e.message;
        this.cdr.markForCheck();
      });
  }
  agregar() {
    const p = this.productos().find((x) => x.producto_id === this.id);
    if (!p || !Number.isInteger(this.cantidad) || this.cantidad < 1) {
      this.mensaje = 'Seleccione producto y cantidad válida';
      return;
    }
    if (this.carrito().some((i) => i.moneda !== (p.monedaPrecio ?? 'PEN'))) {
      this.mensaje = 'No mezcle monedas en la misma venta';
      return;
    }
    this.carrito.update((l) => [
      ...l,
      {
        productoId: p.producto_id,
        nombre: p.nombre_producto,
        moneda: p.monedaPrecio ?? 'PEN',
        cantidad: this.cantidad,
        total: r2(p.precio_contado * this.cantidad),
      },
    ]);
    this.mensaje = '';
  }
  quitar(i: number) {
    this.carrito.update((l) => l.filter((_, j) => j !== i));
  }
  async confirmar() {
    if (!this.carrito().length || this.ocupado) return;
    this.ocupado = true;
    try {
      const v = await operacionLocal<any>('/ventas-contado', 'POST', {
        sucursalId: this.sucursalId,
        items: this.carrito().map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });
      this.historial.update((l) => [...l, v]);
      this.carrito.set([]);
      this.mensaje = 'Venta registrada';
    } catch (e) {
      this.mensaje = (e as Error).message;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }
}
