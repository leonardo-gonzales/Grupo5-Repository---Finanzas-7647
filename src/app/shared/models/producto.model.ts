export interface Producto {
  monedaPrecio?: 'PEN' | 'USD';
  tipoArticulo?: string;
  marca?: string;
  descripcion?: string;
  unidad?: string;
  proveedorId?: number;
  imagen?: string;
  pagoUnico?: string;
  pagoCuotas?: string;
  producto_id: number;
  sku: string;
  nombre_producto: string;
  categoria_producto: string;
  precio_contado: number;
  precio_credito: number;
  stock_referencial: number;
  estado_disponibilidad: 'Disponible' | 'No disponible';
  icono: string;
}
