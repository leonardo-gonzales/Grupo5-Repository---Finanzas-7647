export interface ItemInventario {
    inventario_id: number;
    sku: string;
    producto: string;
    categoria: string;
    sucursal: string;
    stock_actual: number;
    stock_minimo: number;
    unidad_medida: string;
    estado_stock: 'Óptimo' | 'Stock Bajo' | 'Agotado';
}