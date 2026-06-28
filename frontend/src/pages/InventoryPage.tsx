import { useState } from 'react';
import { Button, Chip, Spinner } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service';
import { productService } from '../services/product.service';
import { MovementType, Product } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const movementTypeLabel: Record<MovementType, string> = {
    [MovementType.ENTRADA]: 'Entrada',
    [MovementType.SALIDA]: 'Salida',
    [MovementType.AJUSTE]: 'Ajuste',
    [MovementType.PERDIDA]: 'Pérdida',
    [MovementType.DESPERDICIO]: 'Desperdicio',
    [MovementType.VENTA]: 'Venta',
};

const movementTypeIcon: Record<MovementType, string> = {
    [MovementType.ENTRADA]: '📦',
    [MovementType.SALIDA]: '📤',
    [MovementType.AJUSTE]: '🔄',
    [MovementType.PERDIDA]: '⚠️',
    [MovementType.DESPERDICIO]: '🗑️',
    [MovementType.VENTA]: '🛒',
};

const movementTypeColor: Record<MovementType, 'success' | 'danger' | 'warning' | 'primary' | 'default'> = {
    [MovementType.ENTRADA]: 'success',
    [MovementType.SALIDA]: 'danger',
    [MovementType.AJUSTE]: 'primary',
    [MovementType.PERDIDA]: 'danger',
    [MovementType.DESPERDICIO]: 'warning',
    [MovementType.VENTA]: 'default',
};

const movementSchema = z.object({
    product_id: z.number().min(1, 'Seleccione un producto'),
    movement_type: z.nativeEnum(MovementType),
    quantity: z.number().min(1, 'Debe ser al menos 1'),
    reason: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

const InventoryPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [tab, setTab] = useState(0);
    const [createDialog, setCreateDialog] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const { data: movements, isLoading } = useQuery({
        queryKey: ['inventory-movements'],
        queryFn: () => inventoryService.getMovements({ limit: 50 }),
    });

    const { data: lowStock } = useQuery({
        queryKey: ['low-stock'],
        queryFn: () => inventoryService.getLowStock(),
    });

    const { data: products } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.getAll({ limit: 100 }),
    });

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<MovementForm>({
        resolver: zodResolver(movementSchema),
        defaultValues: { product_id: 0, movement_type: MovementType.ENTRADA, quantity: 1, reason: '' },
    });

    const watchProductId = watch('product_id');
    const watchMovementType = watch('movement_type');
    const selectedProduct = products?.items.find((p) => p.id === watchProductId);

    const createMutation = useMutation({
        mutationFn: (data: MovementForm) => inventoryService.createMovement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Movimiento registrado exitosamente');
            setCreateDialog(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const onSubmit = (data: MovementForm) => {
        createMutation.mutate(data);
    };

    const filteredProducts = products?.items.filter((p) =>
        !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Inventario</h1>
                <Button color="primary" className="cursor-pointer font-medium" onPress={() => setCreateDialog(true)}>
                    + Nuevo Movimiento
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab(0)}
                    className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 0
                        ? 'bg-blue-500 text-white'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                        }`}
                >
                    Movimientos
                </button>
                <button
                    onClick={() => setTab(1)}
                    className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 1
                        ? 'bg-amber-500 text-white'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                        }`}
                >
                    Bajo Stock ({lowStock?.length || 0})
                </button>
            </div>

            {/* Movements Tab */}
            {tab === 0 && (
                <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <table className="w-full min-w-[800px]">
                        <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                            <tr>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Producto</th>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Tipo</th>
                                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Cantidad</th>
                                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock Anterior</th>
                                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock Nuevo</th>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Razón</th>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {movements?.items.map((mov) => (
                                <tr key={mov.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>{mov.product_name || `#${mov.product_id}`}</td>
                                    <td className="px-4 py-3">
                                        <Chip color={movementTypeColor[mov.movement_type]} size="sm" variant="flat">
                                            {movementTypeIcon[mov.movement_type]} {movementTypeLabel[mov.movement_type]}
                                        </Chip>
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        {mov.movement_type === MovementType.ENTRADA ? '+' : '-'}{mov.quantity.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{mov.previous_stock.toLocaleString()}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-semibold ${mov.new_stock <= 0 ? 'text-red-400' : isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        {mov.new_stock.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{mov.reason || '-'}</td>
                                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(mov.created_at).toLocaleString('es-CO')}</td>
                                </tr>
                            ))}
                            {(!movements?.items || movements.items.length === 0) && (
                                <tr><td colSpan={7} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay movimientos registrados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Low Stock Tab */}
            {tab === 1 && (
                <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <table className="w-full min-w-[600px]">
                        <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                            <tr>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Producto</th>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Categoría</th>
                                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock Actual</th>
                                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock Mínimo</th>
                                <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Estado</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {lowStock?.map((product) => (
                                <tr key={product.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>{product.name}</td>
                                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{product.category_name || '-'}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-semibold ${product.stock <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                        {product.stock.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{product.min_stock.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <Chip color={product.stock <= 0 ? 'danger' : 'warning'} size="sm" variant="flat">
                                            {product.stock <= 0 ? 'Agotado' : 'Bajo Stock'}
                                        </Chip>
                                    </td>
                                </tr>
                            ))}
                            {(!lowStock || lowStock.length === 0) && (
                                <tr><td colSpan={5} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay productos con bajo stock</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Movement Modal */}
            {createDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => { setCreateDialog(false); reset(); }}>
                    <div className={`rounded-3xl border w-full max-w-lg mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">📦</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nuevo Movimiento de Inventario</h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Registra una entrada, salida o ajuste de stock</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Product Search */}
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Producto</label>
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                {productSearch && filteredProducts.length > 0 && !selectedProduct && (
                                    <div className={`mt-1 max-h-40 overflow-y-auto rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                                        {filteredProducts.slice(0, 8).map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className={`cursor-pointer w-full text-left px-4 py-2 text-sm flex justify-between items-center transition-colors ${isDark ? 'hover:bg-zinc-800 text-white' : 'hover:bg-zinc-50 text-zinc-900'}`}
                                                onClick={() => { setValue('product_id', p.id); setProductSearch(p.name); }}
                                            >
                                                <span>{p.name}</span>
                                                <Chip size="sm" variant="flat" color={p.stock <= p.min_stock ? 'warning' : 'default'}>
                                                    Stock: {p.stock.toLocaleString()}
                                                </Chip>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.product_id && <p className="text-red-400 text-xs mt-1">{errors.product_id.message}</p>}
                            </div>

                            {/* Selected Product Info */}
                            {selectedProduct && (
                                <div className={`p-3 rounded-xl flex justify-between items-center ${isDark ? 'bg-zinc-800/60 border border-zinc-700' : 'bg-zinc-100 border border-zinc-200'}`}>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Producto seleccionado</p>
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{selectedProduct.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Stock actual</p>
                                        <p className={`text-lg font-bold ${selectedProduct.stock <= selectedProduct.min_stock ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {selectedProduct.stock.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Type & Quantity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Tipo de Movimiento</label>
                                    <Controller
                                        name="movement_type"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className={`cursor-pointer w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-900'}`}
                                            >
                                                {Object.values(MovementType).filter((t) => t !== MovementType.VENTA).map((t) => (
                                                    <option key={t} value={t}>{movementTypeIcon[t]} {movementTypeLabel[t]}</option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Cantidad</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('quantity', { valueAsNumber: true })}
                                        placeholder="1"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                    {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
                                </div>
                            </div>

                            {/* Alert */}
                            {watchMovementType && watchMovementType !== MovementType.ENTRADA && selectedProduct && (
                                <div className={`p-3 rounded-xl text-sm ${watchMovementType === MovementType.AJUSTE ? 'bg-blue-500/10 text-blue-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                    {watchMovementType === MovementType.SALIDA && '📤 Se restará del stock actual del producto.'}
                                    {watchMovementType === MovementType.PERDIDA && '⚠️ Se registrará como pérdida y se restará del stock.'}
                                    {watchMovementType === MovementType.DESPERDICIO && '🗑️ Se registrará como desperdicio y se restará del stock.'}
                                    {watchMovementType === MovementType.AJUSTE && '🔄 Se ajustará el stock del producto.'}
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Razón del movimiento</label>
                                <textarea
                                    {...register('reason')}
                                    rows={3}
                                    placeholder="Describe el motivo del movimiento..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => { setCreateDialog(false); reset(); setProductSearch(''); }}>Cancelar</Button>
                                <Button size="lg" color="primary" className="flex-1 cursor-pointer font-semibold" type="submit" isLoading={createMutation.isPending}>
                                    Registrar Movimiento
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
