// Enums
export enum RoleEnum {
    ADMIN = 'admin',
    CAJERO = 'cajero',
    MESERO = 'mesero',
    BARTENDER = 'bartender',
}

export enum TableStatus {
    LIBRE = 'libre',
    OCUPADA = 'ocupada',
    EN_PAGO = 'en_pago',
}

export enum OrderStatus {
    PENDIENTE = 'pendiente',
    EN_PREPARACION = 'en_preparacion',
    LISTO = 'listo',
    ENTREGADO = 'entregado',
    CANCELADO = 'cancelado',
}

export enum PaymentMethod {
    EFECTIVO = 'efectivo',
    NEQUI = 'nequi',
    DAVIPLATA = 'daviplata',
    TRANSFERENCIA = 'transferencia',
    TARJETA = 'tarjeta',
}

export enum MovementType {
    ENTRADA = 'entrada',
    SALIDA = 'salida',
    AJUSTE = 'ajuste',
    PERDIDA = 'perdida',
    DESPERDICIO = 'desperdicio',
    VENTA = 'venta',
}

// Auth
export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    employee_id: number;
    role: string;
    full_name: string;
}

export interface MeResponse {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
}

// Employee
export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    document: string;
    phone: string | null;
    email: string;
    role: RoleEnum;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmployeeCreate {
    first_name: string;
    last_name: string;
    document: string;
    phone?: string;
    email: string;
    role: RoleEnum;
    password: string;
}

export interface EmployeeUpdate {
    first_name?: string;
    last_name?: string;
    document?: string;
    phone?: string;
    email?: string;
    role?: RoleEnum;
    is_active?: boolean;
    password?: string;
}

export interface EmployeeListResponse {
    items: Employee[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Table
export interface Table {
    id: number;
    number: number;
    status: TableStatus;
    waiter_id: number | null;
    occupied_at: string | null;
    created_at: string;
    updated_at: string;
    waiter_name: string | null;
    occupation_time: string | null;
}

export interface TableCreate {
    number: number;
}

export interface TableUpdate {
    number?: number;
    status?: TableStatus;
    waiter_id?: number;
}

export interface TableListResponse {
    items: Table[];
    total: number;
}

export interface TableOpenRequest {
    waiter_id: number;
}

// Category
export interface Category {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface CategoryCreate {
    name: string;
    description?: string;
}

export interface CategoryUpdate {
    name?: string;
    description?: string;
}

export interface CategoryListResponse {
    items: Category[];
    total: number;
}

// Product
export interface Product {
    id: number;
    name: string;
    category_id: number;
    sale_price: number;
    stock: number;
    min_stock: number;
    is_active: boolean;
    barrel_id: number | null;
    created_at: string;
    updated_at: string;
    category_name: string | null;
}

export interface ProductCreate {
    name: string;
    category_id: number;
    sale_price: number;
    stock?: number;
    min_stock?: number;
    is_active?: boolean;
    barrel_id?: number;
}

export interface ProductUpdate {
    name?: string;
    category_id?: number;
    sale_price?: number;
    stock?: number;
    min_stock?: number;
    is_active?: boolean;
    barrel_id?: number;
}

export interface ProductListResponse {
    items: Product[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Barrel
export interface Barrel {
    id: number;
    name: string;
    shot_price: number;
    shots_sold_today: number;
    revenue_today: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BarrelCreate {
    name: string;
    shot_price: number;
}

export interface BarrelUpdate {
    name?: string;
    shot_price?: number;
    is_active?: boolean;
}

export interface BarrelListResponse {
    items: Barrel[];
    total: number;
}

export interface BarrelShotRequest {
    shots: number;
}

// Order
export interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes: string | null;
    product_name: string | null;
}

export interface OrderItemCreate {
    product_id: number;
    quantity: number;
    notes?: string;
}

export interface Order {
    id: number;
    table_id: number;
    employee_id: number;
    status: OrderStatus;
    total: number;
    notes: string | null;
    order_date: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
    employee_name: string | null;
    table_number: number | null;
}

export interface OrderCreate {
    table_id: number;
    notes?: string;
    items: OrderItemCreate[];
}

export interface OrderUpdate {
    status?: OrderStatus;
    notes?: string;
}

export interface OrderAddItem {
    items: OrderItemCreate[];
}

export interface OrderListResponse {
    items: Order[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Sale
export interface SalePayment {
    id: number;
    payment_method: PaymentMethod;
    amount: number;
    reference: string | null;
}

export interface PaymentCreate {
    payment_method: PaymentMethod;
    amount: number;
    reference?: string;
}

export interface Sale {
    id: number;
    order_id: number;
    employee_id: number;
    total: number;
    sale_date: string;
    notes: string | null;
    payments: SalePayment[];
    employee_name: string | null;
    table_number: number | null;
    created_at: string;
}

export interface SaleCreate {
    order_id: number;
    payments: PaymentCreate[];
    notes?: string;
}

export interface SaleListResponse {
    items: Sale[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Cash Register
export interface CashRegister {
    id: number;
    employee_id: number;
    opening_amount: number;
    closing_amount: number | null;
    expected_amount: number | null;
    difference: number | null;
    total_sales: number;
    total_cash_sales: number;
    total_digital_sales: number;
    is_open: boolean;
    opened_at: string;
    closed_at: string | null;
    notes: string | null;
    employee_name: string | null;
    created_at: string;
}

export interface CashRegisterOpen {
    opening_amount: number;
    notes?: string;
}

export interface CashRegisterClose {
    closing_amount: number;
    notes?: string;
}

export interface CashRegisterListResponse {
    items: CashRegister[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Inventory
export interface InventoryMovement {
    id: number;
    product_id: number;
    movement_type: MovementType;
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reason: string | null;
    employee_id: number | null;
    created_at: string;
    product_name: string | null;
}

export interface InventoryMovementCreate {
    product_id: number;
    movement_type: MovementType;
    quantity: number;
    reason?: string;
}

export interface InventoryMovementListResponse {
    items: InventoryMovement[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface LowStockProduct {
    id: number;
    name: string;
    stock: number;
    min_stock: number;
    category_name: string | null;
}

// Dashboard
export interface DashboardResponse {
    total_sales_today: number;
    total_orders_today: number;
    occupied_tables: number;
    free_tables: number;
    out_of_stock_products: number;
    low_stock_products: number;
    best_seller_today: string | null;
    best_seller_quantity: number;
    active_cash_register: boolean;
}
