export interface Compra {
    compra_id: string;
    fecha: string;
    proveedor: string;
    sucursal: string;
    cantidad_items: number;
    monto_referencial: string;
    estado: 'Recibida' | 'Pendiente' | 'En tránsito';
}