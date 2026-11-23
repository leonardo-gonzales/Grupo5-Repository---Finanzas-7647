export interface Sucursal {
    sucursal_id: number;
    nombre_sucursal: string;
    direccion_sucursal: string;
    telefono_sucursal: string;
    distrito_sucursal: string;
    estado: 'Operativa' | 'Mantenimiento';
}