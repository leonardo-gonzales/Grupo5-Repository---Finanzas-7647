import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { operacionLocal } from '../../core/services/local-store';
import { fechasCiclo } from '../../core/services/condiciones';
import { hoyLocal } from '../../core/finanzas/motor-financiero';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>{{ perfil?.rol === 'sistema' ? 'Administración de negocios' : 'Estado de cuenta' }}</h1>
    <p role="status">{{ mensaje }}</p>
    @if (perfil?.rol === 'sistema') {
      <section class="ts-card">
        <h2>{{ negocio.id ? 'Editar negocio' : 'Nuevo negocio' }}</h2>
        <form (ngSubmit)="guardarNegocio()">
          @for (k of ['nombre', 'giro', 'direccion']; track k) {
            <label
              >{{ k }} <input class="ts-input" [name]="k" [(ngModel)]="negocio[k]" required
            /></label>
          }
          <label>RUC <input class="ts-input" name="ruc" [(ngModel)]="negocio.ruc" /></label
          ><label
            >Teléfono
            <input class="ts-input" name="telefono" [(ngModel)]="negocio.telefono" /></label
          ><label
            >Correo <input class="ts-input" name="correo" [(ngModel)]="negocio.correo" /></label
          ><label
            >Estado
            <select class="ts-select" name="estado" [(ngModel)]="negocio.estado">
              <option>Activo</option>
              <option>Inactivo</option>
            </select></label
          >
          @if (!negocio.id) {
            <label
              >Usuario administrador
              <input
                class="ts-input"
                name="usuario"
                [(ngModel)]="negocio.usuario"
                required /></label
            ><label
              >Contraseña (mín. 8)
              <input
                class="ts-input"
                type="password"
                name="clave"
                [(ngModel)]="negocio.clave"
                required
            /></label>
          }
          <button class="ts-btn ts-btn-primary">Guardar</button
          ><button type="button" class="ts-btn" (click)="nuevo()">Nuevo / cancelar</button>
        </form>
      </section>
      @for (n of negocios; track n.id) {
        <section class="ts-card">
          {{ n.nombre }} · {{ n.giro }} · {{ n.estado }}
          <button class="ts-btn" (click)="negocio = { ...n }">Editar</button>
        </section>
      }
    } @else {
      @if (perfil?.rol === 'negocio') {
        <section class="ts-card">
          <h2>Crear acceso del cliente</h2>
          <label
            >Cliente
            <select class="ts-select" [(ngModel)]="usuario.clienteId">
              <option [ngValue]="0">Seleccione</option>
              @for (c of clientes; track c.cliente_id) {
                <option [ngValue]="c.cliente_id">{{ c.nombres_razon_social }}</option>
              }
            </select></label
          ><label>Usuario <input class="ts-input" [(ngModel)]="usuario.usuario" /></label
          ><label
            >Contraseña (mín. 8)
            <input class="ts-input" type="password" [(ngModel)]="usuario.clave" /></label
          ><button class="ts-btn ts-btn-primary" (click)="crearUsuario()">Crear acceso</button>
        </section>
      }
      <section class="ts-card">
        <h2>Obligaciones hasta el vencimiento del ciclo</h2>
        <label
          >Cliente
          <select class="ts-select" [(ngModel)]="clienteId" (ngModelChange)="actualizarCiclo()">
            @for (c of clientes; track c.cliente_id) {
              <option [ngValue]="c.cliente_id">
                {{ c.nombres_razon_social }} · {{ c.moneda }} · Corte {{ c.diaCorte }}
                {{ c.horaCorte }}
              </option>
            }
          </select></label
        ><label
          >Mes de facturación
          <input
            class="ts-input"
            type="month"
            [(ngModel)]="mes"
            (ngModelChange)="actualizarCiclo()"
        /></label>
        <p>Vencimiento pactado: {{ hasta }}</p>
        <small
          >Incluye obligaciones pendientes hasta ese vencimiento y las ya vencidas a la fecha de
          pago.</small
        ><label
          >Fecha de cálculo/pago <input class="ts-input" type="date" [(ngModel)]="fecha" /></label
        ><button class="ts-btn" (click)="consultar()">Generar listado</button>
        @if (reporte) {
          <div style="overflow:auto">
            <table class="ts-table">
              <thead>
                <tr>
                  <th>Compra</th>
                  <th>Producto</th>
                  <th>Vencimiento</th>
                  <th>Cuota</th>
                  <th>Capital</th>
                  <th>Interés de cuota</th>
                  <th>Gracia (informativo)</th>
                  <th>Mora</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reporte.rows; track r.id + '-' + r.cuota) {
                  <tr>
                    <td>{{ r.compra }}</td>
                    <td>{{ r.producto }}</td>
                    <td>{{ r.f.vencimiento }}</td>
                    <td>{{ r.cuota }}</td>
                    <td>{{ r.f.amortizacion | number: '1.2-2' }}</td>
                    <td>{{ r.f.interes | number: '1.2-2' }}</td>
                    <td>
                      {{
                        r.modalidad === 'unico'
                          ? 'Incluida en interés'
                          : (r.interesGracia | number: '1.2-2')
                      }}
                    </td>
                    <td>{{ r.mora | number: '1.2-2' }}</td>
                    <td>{{ r.total | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p>Total exigible: {{ reporte.total | number: '1.2-2' }} {{ reporte.moneda }}</p>
          <p>
            Corte {{ reporte.corte }} · {{ reporte.horaCorte }}. La gracia capitalizada no se suma
            nuevamente al total.
          </p>
          @if (reporte.cierre) {
            <details>
              <summary>Listado generado al cierre</summary>
              <p>
                Total contractual al corte: {{ reporte.cierre.total | number: '1.2-2' }}
                {{ reporte.moneda }}
              </p>
              @for (r of reporte.cierre.rows; track r.id + '-' + r.k) {
                <p>
                  {{ r.compra }} · {{ r.producto }} · Cuota {{ r.k }} ·
                  {{ r.cuota | number: '1.2-2' }} · Interés {{ r.interes | number: '1.2-2' }}
                </p>
              }
            </details>
          }
          @if (perfil?.rol === 'negocio') {
            <label
              >Importe exacto <input class="ts-input" type="number" [(ngModel)]="monto" /></label
            ><label
              >Método
              <select class="ts-select" [(ngModel)]="metodo">
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
              </select></label
            ><button
              class="ts-btn ts-btn-primary"
              [disabled]="!reporte.rows.length"
              (click)="pagar()"
            >
              Pagar ciclo completo
            </button>
          }
        }
      </section>
      @if (perfil?.rol === 'cliente') {
        <section class="ts-card">
          <h2>Mis créditos y cronogramas</h2>
          @for (v of creditos; track v.id) {
            <h3>{{ v.producto }} · {{ v.entrada.moneda || 'PEN' }}</h3>
            @for (f of v.resultado.cronograma; track f.k) {
              <p>
                {{ f.vencimiento }} · Cuota {{ f.k }} · {{ estadoCuota(v, f.k) }} ·
                {{ f.cuota | number: '1.2-2' }}
              </p>
            }
          }
        </section>
      }
    }
  `,
})
export class GestionComponent implements OnInit {
  cdr = inject(ChangeDetectorRef);
  perfil: any;
  negocios: any[] = [];
  clientes: any[] = [];
  creditos: any[] = [];
  negocio: any = { estado: 'Activo' };
  usuario = { clienteId: 0, usuario: '', clave: '' };
  clienteId = 0;
  mes = hoyLocal().slice(0, 7);
  hasta = hoyLocal();
  fecha = hoyLocal();
  monto = 0;
  metodo = 'Efectivo';
  reporte: any;
  mensaje = '';
  async run(f: () => Promise<void>) {
    try {
      this.mensaje = '';
      await f();
    } catch (e) {
      this.mensaje = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
    }
  }
  ngOnInit() {
    void this.run(async () => {
      this.perfil = await operacionLocal('/session');
      if (this.perfil.rol === 'sistema') this.negocios = await operacionLocal('/negocios');
      else {
        this.clientes = await operacionLocal('/data/clientes');
        this.clienteId = this.perfil.clienteId ?? this.clientes[0]?.cliente_id ?? 0;
        this.creditos = await operacionLocal('/creditos');
        this.actualizarCiclo();
      }
    });
  }
  actualizarCiclo() {
    const c = this.clientes.find((x) => x.cliente_id === this.clienteId);
    if (c && this.mes) {
      this.hasta = fechasCiclo(this.mes, c).pago;
      this.reporte = null;
    }
  }
  estadoCuota(v: any, k: number) {
    return v.pagos?.some((p: any) => p.cuota === k) ? 'Pagada' : 'Pendiente';
  }
  nuevo() {
    this.negocio = { estado: 'Activo' };
  }
  guardarNegocio() {
    void this.run(async () => {
      await operacionLocal('/negocios', 'POST', this.negocio);
      this.negocios = await operacionLocal('/negocios');
      this.nuevo();
      this.mensaje = 'Negocio guardado';
    });
  }
  crearUsuario() {
    void this.run(async () => {
      await operacionLocal('/usuarios', 'POST', this.usuario);
      this.usuario = { clienteId: 0, usuario: '', clave: '' };
      this.mensaje = 'Acceso creado';
    });
  }
  consultar() {
    void this.run(async () => {
      this.reporte = await operacionLocal(
        '/estado-cuenta?' +
          new URLSearchParams({
            clienteId: String(this.clienteId),
            hasta: this.hasta,
            fecha: this.fecha,
          }),
      );
      this.monto = this.reporte.total;
    });
  }
  pagar() {
    void this.run(async () => {
      await operacionLocal('/pago-ciclo', 'POST', {
        clienteId: this.clienteId,
        hasta: this.hasta,
        fecha: this.fecha,
        monto: this.monto,
        metodo: this.metodo,
      });
      this.reporte = null;
      this.mensaje = 'Pago registrado';
    });
  }
}
