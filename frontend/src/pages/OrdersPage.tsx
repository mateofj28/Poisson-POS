import { useState } from 'react';
import {
    Button, Chip, Spinner, Select, Label, ListBox,
} from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { tableService } from '../services/table.service';
import { productService } from '../services/product.service';
import { Order, OrderStatus, OrderItemCreate, TableStatus } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const statusLabel: Record<OrderStatus, string> = {
    [OrderStatus.PENDIENTE]: 'Pendiente',
    [OrderStatus.EN_PREPARACION]: 'En Preparación',
    [OrderStatus.LISTO]: 'Listo',
    [OrderStatus.ENTREGADO]: 'Entregado',
    [OrderStatus.CANCELADO]: 'Cancelado',
};

const statusColor: Record<OrderStatus, 'warning' | 'primary' | 'success' | 'default' | 'danger'> = {
    [OrderStatus.PENDIENTE]: 'warning',
    [OrderStatus.EN_PREPARACION]: 'primary',
    [OrderStatus.LISTO]: 'success',
    [OrderStatus.ENTREGADO]: 'default',
    [OrderStatus.CANCELADO]: 'danger',
};

// Searchable product input component
interface ProductSearchProps {
    products: { id: number; name: string; sale_price: number }[];
    isDark: boolean;
    onSelect: (id: number) => void;
}

const ProductSearch = ({ products, isDark, onSelect }: ProductSearchProps) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = search
        ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : products;

    return (
        <div className="relative flex-1">
            <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Escribe para buscar producto..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
            />
            {open && filtered.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-50 ${isDark ? 'bg-[#1c1c1e] border-zinc-700' : 'bg-white border-zinc-200'}`}>
                    {filtered.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { onSelect(p.id); setSearch(''); setOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${isDark ? 'text-white hover:bg-zinc-800' : 'text-zinc-900 hover:bg-zinc-100'}`}
                        >
                            <span>{p.name}</span>
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>${p.sale_price.toLocaleString()}</span>
                        </button>
                    ))}
                </div>
            )}
            {open && filtered.length === 0 && search && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 p-4 text-center text-sm ${isDark ? 'bg-[#1c1c1e] border-zinc-700 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                    No se encontraron productos
                </div>
            )}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>}
        </div>
    );
};

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailDialog, setDetailDialog] = useState<Order | null>(null);
    const [selectedTable, setSelectedTable] = useState<number>(0);
    const [orderItems, setOrderItems] = useState<OrderItemCreate[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number>(0);
    const [notes, setNotes] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['orders', statusFilter],
        queryFn: () => orderService.getAll({ limit: 50, status: statusFilter || undefined }),
    });

    const { data: tables } = useQuery({
        queryKey: ['tables-occupied'],
        queryFn: () => tableService.getAll(),
    });

    const { data: products } = useQuery({
        queryKey: ['products-active'],
        queryFn: () => productService.getAll({ limit: 100, is_active: true }),
    });

    const createMutation = useMutation({
        mutationFn: () => orderService.create({ table_id: selectedTable, items: orderItems, notes: notes || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Pedido creado');
            handleCloseDrawer();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear pedido'),
    });

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedTable(0);
        setOrderItems([]);
        setSelectedProduct(0);
        setNotes('');
    };

    const handleAddItem = () => {
        if (!selectedProduct) return;
        const existing = orderItems.find((i) => i.product_id === selectedProduct);
        if (existing) {
            setOrderItems(orderItems.map((i) => i.product_id === selectedProduct ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setOrderItems([...orderItems, { product_id: selectedProduct, quantity: 1 }]);
        }
        setSelectedProduct(0);
    };

    const handleIncrement = (productId: number) => {
        setOrderItems(orderItems.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    };

    const handleDecrement = (productId: number) => {
        setOrderItems(orderItems.map((i) => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
    };

    const handleRemoveItem = (productId: number) => {
        setOrderItems(orderItems.filter((i) => i.product_id !== productId));
    };

    const getProduct = (productId: number) => products?.items.find((p) => p.id === productId);

    const occupiedTables = tables?.items.filter((t) => t.status === TableStatus.OCUPADA) || [];
    const orderTotal = orderItems.reduce((acc, item) => acc + (getProduct(item.product_id)?.sale_price || 0) * item.quantity, 0);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Pedidos</h1>
                <div className="flex items-center gap-3">
                    <Select
                        className="w-[180px]"
                        placeholder="Todos"
                        selectedKey={statusFilter || undefined}
                        onSelectionChange={(key) => setStatusFilter((key as OrderStatus) || '')}
                    >
                        <Label>Estado</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="" textValue="Todos">Todos<ListBox.ItemIndicator /></ListBox.Item>
                                {Object.values(OrderStatus).map((s) => (
                                    <ListBox.Item key={s} id={s} textValue={statusLabel[s]}>{statusLabel[s]}<ListBox.ItemIndicator /></ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <Button color="primary" className="cursor-pointer" onPress={() => setDrawerOpen(true)}>
                        + Nuevo Pedido
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <table className="w-full">
                    <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                        <tr>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>#</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Mesa</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Empleado</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Estado</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Fecha</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {data?.items.map((order) => (
                            <tr key={order.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>{order.id}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Mesa {order.table_number}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{order.employee_name || '-'}</td>
                                <td className="px-4 py-3">
                                    <Chip color={statusColor[order.status]} size="sm" variant="flat">{statusLabel[order.status]}</Chip>
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>${order.total.toLocaleString()}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(order.order_date).toLocaleString('es-CO')}</td>
                                <td className="px-4 py-3 text-right">
                                    <Button size="sm" variant="flat" className="cursor-pointer" onPress={() => setDetailDialog(order)}>Ver</Button>
                                </td>
                            </tr>
                        ))}
                        {(!data?.items || data.items.length === 0) && (
                            <tr>
                                <td colSpan={7} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay pedidos</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer - Nuevo Pedido */}
            {drawerOpen && (
                <>
                    {/* Overlay */}
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={handleCloseDrawer}></div>

                    {/* Drawer Panel */}
                    <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col shadow-2xl border-l transition-transform duration-300 ${isDark ? 'bg-[#111113] border-zinc-800' : 'bg-[#fafafa] border-zinc-200'}`}>
                        {/* Drawer Header */}
                        <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nuevo Pedido</h2>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Agrega productos al pedido</p>
                            </div>
                            <button onClick={handleCloseDrawer} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Drawer Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Table Select */}
                            <Select
                                className="w-full"
                                placeholder="Seleccionar mesa..."
                                selectedKey={selectedTable ? String(selectedTable) : undefined}
                                onSelectionChange={(key) => setSelectedTable(Number(key))}
                            >
                                <Label>Mesa</Label>
                                <Select.Trigger>
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {occupiedTables.map((t) => (
                                            <ListBox.Item key={t.id} id={String(t.id)} textValue={`Mesa ${t.number}`}>
                                                Mesa {t.number} - {t.waiter_name}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            {/* Notes */}
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Notas (opcional)</label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Instrucciones especiales..."
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>

                            {/* Divider */}
                            <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>

                            {/* Add Product Section */}
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Agregar Producto</p>
                                <div className="flex gap-2">
                                    <ProductSearch
                                        products={products?.items || []}
                                        isDark={isDark}
                                        onSelect={(id) => {
                                            setSelectedProduct(id);
                                            // Auto-add on select
                                            const existing = orderItems.find((i) => i.product_id === id);
                                            if (existing) {
                                                setOrderItems(orderItems.map((i) => i.product_id === id ? { ...i, quantity: i.quantity + 1 } : i));
                                            } else {
                                                setOrderItems([...orderItems, { product_id: id, quantity: 1 }]);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Items List */}
                            {orderItems.length > 0 && (
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        Productos ({orderItems.length})
                                    </p>
                                    <div className="space-y-2">
                                        {orderItems.map((item) => {
                                            const product = getProduct(item.product_id);
                                            const subtotal = (product?.sale_price || 0) * item.quantity;
                                            return (
                                                <div key={item.product_id} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{product?.name}</p>
                                                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>${product?.sale_price.toLocaleString()} c/u</p>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDecrement(item.product_id)}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-lg font-medium ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'}`}
                                                        >
                                                            −
                                                        </button>
                                                        <span className={`w-8 text-center text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleIncrement(item.product_id)}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-lg font-medium ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'}`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Subtotal */}
                                                    <p className={`text-sm font-semibold w-20 text-right ${isDark ? 'text-white' : 'text-zinc-900'}`}>${subtotal.toLocaleString()}</p>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => handleRemoveItem(item.product_id)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {orderItems.length === 0 && (
                                <div className={`text-center py-10 rounded-xl border-2 border-dashed ${isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 mx-auto mb-2 opacity-50">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                    </svg>
                                    <p className="text-sm">Aún no hay productos</p>
                                    <p className="text-xs mt-1 opacity-70">Selecciona un producto arriba para agregarlo</p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className={`px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-[#111113]' : 'border-zinc-200 bg-[#f4f4f5]'}`}>
                            {orderItems.length > 0 && (
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{orderItems.length} productos</span>
                                    <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${orderTotal.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={handleCloseDrawer}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="lg"
                                    color="primary"
                                    className="flex-1 cursor-pointer font-semibold"
                                    isLoading={createMutation.isPending}
                                    isDisabled={!selectedTable || orderItems.length === 0}
                                    onPress={() => createMutation.mutate()}
                                >
                                    Crear Pedido
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Detail Modal - Invoice Style */}
            {detailDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDetailDialog(null)}>
                    <div className={`rounded-3xl border w-full max-w-sm mx-4 shadow-2xl overflow-hidden ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        {/* Receipt Header */}
                        <div className={`px-6 pt-6 pb-4 text-center border-b border-dashed ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
                            <p className="text-2xl mb-1">🐟</p>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Poisson POS</h2>
                            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Pedido #{detailDialog.id}</p>
                        </div>

                        {/* Receipt Info */}
                        <div className={`px-6 py-3 text-xs space-y-1 border-b border-dashed ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-zinc-300 text-zinc-500'}`}>
                            <div className="flex justify-between">
                                <span>Mesa:</span>
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{detailDialog.table_number || detailDialog.table_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Empleado:</span>
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{detailDialog.employee_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fecha:</span>
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{new Date(detailDialog.order_date).toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estado:</span>
                                <Chip color={statusColor[detailDialog.status]} size="sm" variant="flat">{statusLabel[detailDialog.status]}</Chip>
                            </div>
                        </div>

                        {/* Receipt Items */}
                        <div className={`px-6 py-3 border-b border-dashed ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
                            <div className={`flex justify-between text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                <span>Producto</span>
                                <span>Subtotal</span>
                            </div>
                            <div className="space-y-2">
                                {detailDialog.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <span className={isDark ? 'text-white' : 'text-zinc-900'}>{item.product_name || `#${item.product_id}`}</span>
                                            <span className={`text-xs ml-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>x{item.quantity}</span>
                                        </div>
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>${item.subtotal.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Receipt Total */}
                        <div className="px-6 py-4">
                            <div className="flex justify-between items-center">
                                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>TOTAL</span>
                                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${detailDialog.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Receipt Footer */}
                        <div className={`px-6 py-4 border-t border-dashed ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
                            <Button size="lg" variant="flat" className="w-full cursor-pointer" onPress={() => setDetailDialog(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
