export interface Cliente {
  tipoTasa?: 'TEA' | 'TNA';
  tasaPct?: number;
  tipoMora?: 'TNM' | 'TEMORA';
  tnmPct?: number;
  moneda?: 'PEN' | 'USD';
  maxCuotas?: number;
  diaCorte?: number;
  horaCorte?: string;
  diaPago?: number;
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
