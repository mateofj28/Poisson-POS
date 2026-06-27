import { useState } from 'react';
import {
    Button, Chip, Spinner, Select, Label, ListBox,
    Table, TableHeader, TableBody, TableRow, TableCell, TableColumn,
} from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { tableService } from '../services/table.service';
import { productService } from '../services/product.service';
import { Order, OrderStatus, OrderItemCreate, TableStatus, Product } from '../types';
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

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [createDialog, setCreateDialog] = useState(false);
    const [detailDialog, setDetailDialog] = useState<Order | null>(null);
    const [selectedTable, setSelectedTable] = useState<number>(0);
    const [orderItems, setOrderItems] = useState<OrderItemCreate[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number>(0);
    const [quantity, setQuantity] = useState(1);
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
            handleCloseCreate();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear pedido'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => orderService.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Estado actualizado');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleCloseCreate = () => {
        setCreateDialog(false);
        setSelectedTable(0);
        setOrderItems([]);
        setSelectedProduct(0);
        setQuantity(1);
        setNotes('');
    };

    const handleAddItem = () => {
        if (!selectedProduct || quantity < 1) return;
        const existing = orderItems.find((i) => i.product_id === selectedProduct);
        if (existing) {
            setOrderItems(orderItems.map((i) => i.product_id === selectedProduct ? { ...i, quantity: i.quantity + quantity } : i));
        } else {
            setOrderItems([...orderItems, { product_id: selectedProduct, quantity }]);
        }
        setSelectedProduct(0);
        setQuantity(1);
    };

    const handleRemoveItem = (productId: number) => {
        setOrderItems(orderItems.filter((i) => i.product_id !== productId));
    };

    const getProductName = (productId: number) => {
        return products?.items.find((p) => p.id === productId)?.name || `Producto #${productId}`;
    };

    const getProductPrice = (productId: number) => {
        return products?.items.find((p) => p.id === productId)?.sale_price || 0;
    };

    const occupiedTables = tables?.items.filter((t) => t.status === TableStatus.OCUPADA) || [];

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
                    <Button color="primary" onPress={() => setCreateDialog(true)}>
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
                                    <Button size="sm" variant="flat" onPress={() => setDetailDialog(order)}>Ver</Button>
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

            {/* Create Order Modal */}
            {createDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={handleCloseCreate}>
                    <div className={`rounded-3xl border w-full max-w-lg mx-4 p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>

                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nuevo Pedido</h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Selecciona la mesa y agrega productos</p>

                        <div className="space-y-5">
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
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Notas</label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notas opcionales..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>

                            {/* Divider */}
                            <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>

                            {/* Add Product */}
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Agregar productos</p>

                            <div className="flex gap-2">
                                <Select
                                    className="flex-1"
                                    placeholder="Buscar producto..."
                                    selectedKey={selectedProduct ? String(selectedProduct) : undefined}
                                    onSelectionChange={(key) => setSelectedProduct(Number(key))}
                                >
                                    <Label>Producto</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {(products?.items || []).map((p) => (
                                                <ListBox.Item key={p.id} id={String(p.id)} textValue={p.name}>
                                                    {p.name} - ${p.sale_price.toLocaleString()}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)}
                                    className={`w-16 px-3 py-2 rounded-xl border text-sm text-center outline-none focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-900'}`}
                                />

                                <Button color="primary" size="sm" onPress={handleAddItem} isDisabled={!selectedProduct}>
                                    +
                                </Button>
                            </div>

                            {/* Items List */}
                            {orderItems.length > 0 && (
                                <div className={`rounded-xl border p-3 space-y-2 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                    {orderItems.map((item) => (
                                        <div key={item.product_id} className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{getProductName(item.product_id)}</p>
                                                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {item.quantity} x ${getProductPrice(item.product_id).toLocaleString()} = ${(item.quantity * getProductPrice(item.product_id)).toLocaleString()}
                                                </p>
                                            </div>
                                            <button onClick={() => handleRemoveItem(item.product_id)} className="text-red-400 hover:text-red-300 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <div className={`pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                        <p className={`text-sm font-semibold text-right ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                            Total: ${orderItems.reduce((acc, item) => acc + getProductPrice(item.product_id) * item.quantity, 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 text-base" onPress={handleCloseCreate}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary"
                                className="flex-1 text-base font-semibold"
                                isLoading={createMutation.isPending}
                                isDisabled={!selectedTable || orderItems.length === 0}
                                onPress={() => createMutation.mutate()}
                            >
                                Crear Pedido
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDetailDialog(null)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Pedido #{detailDialog.id}</h2>
                        <div className={`text-sm space-y-1 mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            <p>Mesa: {detailDialog.table_number}</p>
                            <p>Empleado: {detailDialog.employee_name}</p>
                            <p>Estado: <Chip color={statusColor[detailDialog.status]} size="sm" variant="flat">{statusLabel[detailDialog.status]}</Chip></p>
                        </div>
                        <div className={`h-px mb-4 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                        <div className="space-y-2 mb-4">
                            {detailDialog.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{item.product_name} x{item.quantity}</span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>${item.subtotal.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className={`h-px mb-4 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                        <div className="flex justify-between">
                            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Total</span>
                            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${detailDialog.total.toLocaleString()}</span>
                        </div>
                        <Button size="lg" variant="flat" className="w-full mt-6" onPress={() => setDetailDialog(null)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
