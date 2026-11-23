export interface Categoria {
    categoria_id: number;
    nombre: string;
    descripcion: string;
    cantidad_productos: number;
    estado: 'Activa' | 'Inactiva';
}