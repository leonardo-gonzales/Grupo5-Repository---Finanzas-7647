export interface Proveedor {
    proveedor_id: number;
    razon_social: string;
    ruc: string;
    contacto: string;
    telefono: string;
    rubro: string;
    estado: 'Activo' | 'Inactivo';
}