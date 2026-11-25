import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { operacionLocal } from './core/services/local-store';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { VentaPosPageComponent } from './features/ventas/venta-pos-page.component';
import { CreditoNuevaPageComponent } from './features/creditos/credito-nueva-page.component';
import { CreditoDetallePageComponent } from './features/creditos/credito-detalle-page.component';
import { GenericDataPageComponent } from './shared/components/generic-data-page.component';

import { GestionComponent } from './features/administracion/gestion.component';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [
      async () => {
        const router = inject(Router);
        try {
          await operacionLocal('/session');
          return true;
        } catch {
          return router.createUrlTree(['/login']);
        }
      },
    ],
    canActivateChild: [
      async (_route, state) => {
        const router = inject(Router);
        try {
          const p = await operacionLocal<any>('/session');
          if (p.rol !== 'negocio' && !state.url.startsWith('/gestion'))
            return router.createUrlTree(['/gestion']);
          return true;
        } catch {
          return router.createUrlTree(['/login']);
        }
      },
    ],
    children: [
      { path: 'gestion', component: GestionComponent },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'ventas', component: VentaPosPageComponent },
      {
        path: 'compras',
        component: GenericDataPageComponent,
        data: {
          title: 'Compras',
          subtitle: 'Órdenes de compra y recepción de insumos.',
          breadcrumb: 'Operación comercial · Compras',
          file: 'compras',
          columns: [
            { key: 'compra_id', label: 'Código' },
            { key: 'fecha', label: 'Fecha' },
            { key: 'proveedor', label: 'Proveedor' },
            { key: 'sucursal', label: 'Sucursal' },
            { key: 'cantidad_items', label: 'Ítems' },
            { key: 'monto_referencial', label: 'Monto' },
            { key: 'estado', label: 'Estado' },
          ],
        },
      },
      {
        path: 'inventario',
        component: GenericDataPageComponent,
        data: {
          title: 'Inventario / Stock',
          subtitle: 'Control visual de existencias por sucursal.',
          breadcrumb: 'Operación comercial · Inventario',
          file: 'inventario',
          columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'producto', label: 'Producto' },
            { key: 'categoria', label: 'Categoría' },
            { key: 'sucursal', label: 'Sucursal' },
            { key: 'stock_actual', label: 'Stock' },
            { key: 'stock_minimo', label: 'Mínimo' },
            { key: 'unidad_medida', label: 'Unidad' },
            { key: 'estado_stock', label: 'Estado' },
          ],
        },
      },
      {
        path: 'productos',
        component: GenericDataPageComponent,
        data: {
          title: 'Productos y Categorías',
          subtitle: 'Catálogo con precios de contado y crédito.',
          breadcrumb: 'Catálogo y red · Productos',
          file: 'productos',
          columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'nombre_producto', label: 'Producto' },
            { key: 'categoria_producto', label: 'Categoría' },
            { key: 'precio_contado', label: 'Contado' },
            { key: 'precio_credito', label: 'Crédito' },
            { key: 'stock_referencial', label: 'Stock' },
            { key: 'estado_disponibilidad', label: 'Estado' },
          ],
        },
      },
      {
        path: 'proveedores',
        component: GenericDataPageComponent,
        data: {
          title: 'Proveedores',
          subtitle: 'Red de proveedores y rubros de abastecimiento.',
          breadcrumb: 'Catálogo y red · Proveedores',
          file: 'proveedores',
          columns: [
            { key: 'proveedor_id', label: 'ID' },
            { key: 'razon_social', label: 'Razón social' },
            { key: 'ruc', label: 'RUC' },
            { key: 'contacto', label: 'Contacto' },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'rubro', label: 'Rubro' },
            { key: 'estado', label: 'Estado' },
          ],
        },
      },
      {
        path: 'sucursales',
        component: GenericDataPageComponent,
        data: {
          title: 'Sucursales',
          subtitle: 'Locales operativos de la red TortiShop.',
          breadcrumb: 'Catálogo y red · Sucursales',
          file: 'sucursales',
          columns: [
            { key: 'sucursal_id', label: 'ID' },
            { key: 'nombre_sucursal', label: 'Sucursal' },
            { key: 'direccion_sucursal', label: 'Dirección' },
            { key: 'telefono_sucursal', label: 'Teléfono' },
            { key: 'distrito_sucursal', label: 'Distrito' },
            { key: 'estado', label: 'Estado' },
          ],
        },
      },
      {
        path: 'clientes',
        component: GenericDataPageComponent,
        data: {
          title: 'Clientes',
          subtitle: 'Clientes y estado de cuentas corrientes.',
          breadcrumb: 'Créditos y cuentas · Clientes',
          file: 'clientes',
          columns: [
            { key: 'nombres_razon_social', label: 'Cliente' },
            { key: 'dni_ruc', label: 'DNI / RUC' },
            { key: 'telefono_cliente', label: 'Teléfono' },
            { key: 'correo', label: 'Correo' },
            { key: 'limite_credito', label: 'Límite' },
            { key: 'saldo_utilizado', label: 'Saldo usado' },
            { key: 'credito_disponible', label: 'Disponible' },
            { key: 'estado', label: 'Estado' },
          ],
        },
      },
      { path: 'pagos', component: CreditoDetallePageComponent },
      { path: 'creditos/nueva', component: CreditoNuevaPageComponent },
      { path: 'creditos/detalle', component: CreditoDetallePageComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
