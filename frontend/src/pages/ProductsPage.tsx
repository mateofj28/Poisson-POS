import { useState } from 'react';
import { Button, Chip, Spinner, Select, Label, ListBox } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { Product } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const productSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    category_id: z.number().min(1, 'Seleccione una categoría'),
    sale_price: z.number().min(0.01, 'Debe ser mayor a 0'),
    stock: z.number().min(0).optional(),
    min_stock: z.number().min(0).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const ProductsPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['products', categoryFilter],
        queryFn: () => productService.getAll({ limit: 100, category_id: categoryFilter || undefined }),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
    });

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProductForm>({
        resolver: zodResolver(productSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: ProductForm) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProductForm }) => productService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto actualizado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto eliminado');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset({ name: '', category_id: 0, sale_price: 0, stock: 0, min_stock: 5 });
        setOpenForm(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditing(product);
        reset({ name: product.name, category_id: product.category_id, sale_price: product.sale_price, stock: product.stock, min_stock: product.min_stock });
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditing(null);
    };

    const onSubmit = (formData: ProductForm) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Productos</h1>
                <div className="flex gap-3 items-center">
                    <Select
                        className="w-[200px]"
                        placeholder="Todas las categorías"
                        selectedKey={categoryFilter ? String(categoryFilter) : undefined}
                        onSelectionChange={(key) => setCategoryFilter(key ? Number(key) : '')}
                    >
                        <Label>Categoría</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="" textValue="Todas">Todas las categorías<ListBox.ItemIndicator /></ListBox.Item>
                                {(categories?.items || []).map((cat) => (
                                    <ListBox.Item key={cat.id} id={String(cat.id)} textValue={cat.name}>{cat.name}<ListBox.ItemIndicator /></ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <Button color="primary" className="cursor-pointer font-medium" onPress={handleOpenCreate}>
                        + Nuevo
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <table className="w-full min-w-[700px]">
                    <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                        <tr>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Categoría</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Precio</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock</th>
                            <th className={`text-center px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Estado</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {data?.items.map((product) => (
                            <tr key={product.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                <td className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{product.name}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{product.category_name || '-'}</td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>${product.sale_price.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={product.stock <= 0 ? 'danger' : product.stock <= product.min_stock ? 'warning' : 'success'}
                                    >
                                        {product.stock.toLocaleString()}
                                    </Chip>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Chip size="sm" variant="flat" color={product.is_active ? 'success' : 'default'}>
                                        {product.is_active ? 'Activo' : 'Inactivo'}
                                    </Chip>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleOpenEdit(product)}
                                            className={`cursor-pointer p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(product)}
                                            className="cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!data?.items || data.items.length === 0) && (
                            <tr><td colSpan={6} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay productos</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {openForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={handleCloseForm}>
                    <div className={`rounded-3xl border w-full max-w-lg mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">{editing ? '✏️' : '🛒'}</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {editing ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {editing ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al inventario'}
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nombre</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder="Nombre del producto"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Controller
                                        name="category_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                className="w-full"
                                                placeholder="Seleccionar..."
                                                selectedKey={field.value ? String(field.value) : undefined}
                                                onSelectionChange={(key) => field.onChange(Number(key))}
                                            >
                                                <Label>Categoría</Label>
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Select.Popover>
                                                    <ListBox>
                                                        {(categories?.items || []).map((cat) => (
                                                            <ListBox.Item key={cat.id} id={String(cat.id)} textValue={cat.name}>{cat.name}<ListBox.ItemIndicator /></ListBox.Item>
                                                        ))}
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                        )}
                                    />
                                    {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
                                </div>
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Precio de venta</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('sale_price', { valueAsNumber: true })}
                                        placeholder="$0"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                    {errors.sale_price && <p className="text-red-400 text-xs mt-1">{errors.sale_price.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Stock</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('stock', { valueAsNumber: true })}
                                        placeholder="0"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Stock mínimo</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('min_stock', { valueAsNumber: true })}
                                        placeholder="5"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={handleCloseForm}>Cancelar</Button>
                                <Button size="lg" color="primary" className="flex-1 cursor-pointer font-semibold" type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                                    {editing ? 'Actualizar' : 'Crear'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
                    <div className={`rounded-3xl border w-full max-w-sm mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Eliminar Producto</h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            ¿Está seguro de eliminar <span className="font-semibold">{deleteConfirm.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setDeleteConfirm(null)}>Cancelar</Button>
                            <Button size="lg" color="danger" className="flex-1 cursor-pointer font-semibold" isLoading={deleteMutation.isPending} onPress={() => deleteMutation.mutate(deleteConfirm.id)}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
