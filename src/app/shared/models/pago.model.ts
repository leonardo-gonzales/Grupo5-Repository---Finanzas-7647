export interface PagoHistorial {
    recibo_id: string;
    cliente: string;
    credito_id: string;
    cuota_nro: string;
    fecha_pago: string;
    dias_atraso: number;
    mora_visual: string;
    importe_liquidado: string;
    metodo_pago: 'Efectivo' | 'Transferencia' | 'Yape / Plin';
}