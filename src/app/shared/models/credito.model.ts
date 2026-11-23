export interface CuotaCronograma {
    numero_cuota: number;
    fecha_vencimiento: string;
    saldo_inicial: string;
    interes: string;
    amortizacion: string;
    cuota_fija: string;
    saldo_final: string;
    mora_referencial?: string;
    estado_pago: 'Pagado' | 'Vencido' | 'Pendiente';
}

export interface CreditoResumen {
    venta_id: string;
    cliente: string;
    dni: string;
    telefono: string;
    producto: string;
    sucursal: string;
    monto_consumo: string;
    numero_cuotas: number;
    tipo_tasa: 'TEA' | 'TNA';
    valor_tasa: string;
    tem_equivalente: string;
    cuota_mensual: string;
    tcea_calculada: string;
    limite_credito: string;
    saldo_pendiente: string;
    credito_disponible: string;
    proximo_vencimiento: string;
    estado: 'LÍNEA ACTIVA' | 'EN MORA';
    cronograma: CuotaCronograma[];
}