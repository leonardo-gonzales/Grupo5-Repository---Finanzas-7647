export interface NavItem {
  label: string;
  route: string;
  icon: string;
  section: string;
  badge?: string;
}

export const TORTISHOP_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', route: '/dashboard', icon: '🏠', section: 'PRINCIPAL' },
  { label: 'Ventas (Caja POS)', route: '/ventas', icon: '🧾', section: 'OPERACIÓN COMERCIAL' },
  {
    label: 'Compras',
    route: '/compras',
    icon: '📦',
    section: 'OPERACIÓN COMERCIAL',
    badge: 'Referencia',
  },
  {
    label: 'Inventario / Stock',
    route: '/inventario',
    icon: '📊',
    section: 'OPERACIÓN COMERCIAL',
    badge: 'Referencia',
  },
  { label: 'Productos y Categorías', route: '/productos', icon: '🍰', section: 'CATÁLOGO Y RED' },
  {
    label: 'Proveedores',
    route: '/proveedores',
    icon: '🚚',
    section: 'CATÁLOGO Y RED',
    badge: 'Referencia',
  },
  { label: 'Sucursales', route: '/sucursales', icon: '🏪', section: 'CATÁLOGO Y RED' },
  { label: 'Clientes', route: '/clientes', icon: '👥', section: 'CRÉDITOS Y CUENTAS' },
  { label: 'Venta a Crédito', route: '/creditos/nueva', icon: '💳', section: 'CRÉDITOS Y CUENTAS' },
  {
    label: 'Créditos y Cronograma',
    route: '/creditos/detalle',
    icon: '📑',
    section: 'CRÉDITOS Y CUENTAS',
  },
  { label: 'Pagos', route: '/pagos', icon: '💵', section: 'CRÉDITOS Y CUENTAS' },
];
