export interface Producto {
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