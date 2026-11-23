export interface Cliente {
    cliente_id: number;
    nombres_razon_social: string;
    dni_ruc: string;
    telefono_cliente: string;
    correo: string;
    limite_credito: number;
    saldo_utilizado: number;
    credito_disponible: number;
    estado: 'Activo' | 'Inactivo';
}