import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Select, Label, ListBox } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { tableService } from '../services/table.service';
import { productService } from '../services/product.service';
import { OrderItemCreate, TableStatus } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

// Product search component
const ProductSearch = ({ products, isDark, onSelect }: { products: any[]; isDark: boolean; onSelect: (id: number) => void }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const filtered = search ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : products;

    return (
        <div className="relative">
            <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Escribe para buscar producto..."
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
            />
            {open && filtered.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border shadow-xl z-50 ${isDark ? 'bg-[#1c1c1e] border-zinc-700' : 'bg-white border-zinc-200'}`}>
                    {filtered.map((p) => (
                        <button key={p.id} onClick={() => { onSelect(p.id); setSearch(''); setOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${isDark ? 'text-white hover:bg-zinc-800' : 'text-zinc-900 hover:bg-zinc-50'}`}>
                            <span>{p.name}</span>
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>${p.sale_price.toLocaleString()}</span>
                        </button>
                    ))}
                </div>
            )}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>}
        </div>
    );
};

const NewOrderPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [selectedTable, setSelectedTable] = useState<number>(0);
    const [orderItems, setOrderItems] = useState<OrderItemCreate[]>([]);
    const [notes, setNotes] = useState('');

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
            navigate('/orders');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear pedido'),
    });

    const handleAddProduct = (productId: number) => {
        const existing = orderItems.find((i) => i.product_id === productId);
        if (existing) {
            setOrderItems(orderItems.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setOrderItems([...orderItems, { product_id: productId, quantity: 1 }]);
        }
    };

    const handleIncrement = (productId: number) => {
        setOrderItems(orderItems.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    };

    const handleDecrement = (productId: number) => {
        setOrderItems(orderItems.map((i) => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
    };

    const handleRemove = (productId: number) => {
        setOrderItems(orderItems.filter((i) => i.product_id !== productId));
    };

    const getProduct = (productId: number) => products?.items.find((p) => p.id === productId);
    const occupiedTables = tables?.items.filter((t) => t.status === TableStatus.OCUPADA) || [];
    const orderTotal = orderItems.reduce((acc, item) => acc + (getProduct(item.product_id)?.sale_price || 0) * item.quantity, 0);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/orders')} className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                </button>
                <div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nuevo Pedido</h1>
                    <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Selecciona la mesa y agrega productos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Config + Search */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Table + Notes */}
                    <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                className="w-full"
                                placeholder="Seleccionar mesa..."
                                selectedKey={selectedTable ? String(selectedTable) : undefined}
                                onSelectionChange={(key) => setSelectedTable(Number(key))}
                            >
                                <Label>Mesa</Label>
                                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {occupiedTables.map((t) => (
                                            <ListBox.Item key={t.id} id={String(t.id)} textValue={`Mesa ${t.number}`}>
                                                Mesa {t.number} — {t.waiter_name}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Notas</label>
                                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Product Search */}
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Agregar Producto</p>
                        <ProductSearch products={products?.items || []} isDark={isDark} onSelect={handleAddProduct} />
                    </div>

                    {/* Items List */}
                    {orderItems.length > 0 ? (
                        <div className="space-y-2">
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Productos ({orderItems.length})</p>
                            {orderItems.map((item) => {
                                const product = getProduct(item.product_id);
                                const subtotal = (product?.sale_price || 0) * item.quantity;
                                return (
                                    <div key={item.product_id} className={`flex items-center gap-3 p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{product?.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>${product?.sale_price.toLocaleString()} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => handleDecrement(item.product_id)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-lg font-medium ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}>−</button>
                                            <span className={`w-8 text-center text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{item.quantity}</span>
                                            <button onClick={() => handleIncrement(item.product_id)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-lg font-medium ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}>+</button>
                                        </div>
                                        <p className={`text-sm font-semibold w-24 text-right ${isDark ? 'text-white' : 'text-zinc-900'}`}>${subtotal.toLocaleString()}</p>
                                        <button onClick={() => handleRemove(item.product_id)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-red-400 hover:bg-red-500/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                            <p className="text-sm font-medium">Aún no hay productos</p>
                            <p className="text-xs mt-1">Busca un producto arriba para agregarlo</p>
                        </div>
                    )}
                </div>

                {/* Right - Summary */}
                <div className="lg:col-span-1">
                    <div className={`p-5 rounded-2xl sticky top-6 ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Resumen</p>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Productos</span>
                                <span className={isDark ? 'text-white' : 'text-zinc-900'}>{orderItems.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Items totales</span>
                                <span className={isDark ? 'text-white' : 'text-zinc-900'}>{orderItems.reduce((a, i) => a + i.quantity, 0)}</span>
                            </div>
                            <div className={`h-px my-2 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                            <div className="flex justify-between">
                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Total</span>
                                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${orderTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            color="primary"
                            size="lg"
                            className="w-full cursor-pointer font-semibold"
                            isLoading={createMutation.isPending}
                            isDisabled={!selectedTable || orderItems.length === 0 || createMutation.isPending}
                            onPress={() => { if (!createMutation.isPending) createMutation.mutate(); }}
                        >
                            Crear Pedido
                        </Button>

                        <Button
                            variant="flat"
                            size="lg"
                            className="w-full cursor-pointer mt-2"
                            onPress={() => navigate('/orders')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewOrderPage;
