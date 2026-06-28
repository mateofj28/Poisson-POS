import { useState } from 'react';
import { Button, Chip, Spinner, Card, CardContent } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { barrelService } from '../services/barrel.service';
import { Barrel } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const barrelSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    capacity_liters: z.number().min(0.1, 'Debe ser mayor a 0'),
    available_liters: z.number().min(0, 'No puede ser negativo'),
});

type BarrelForm = z.infer<typeof barrelSchema>;

const BarrelsPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Barrel | null>(null);
    const [discountDialog, setDiscountDialog] = useState<Barrel | null>(null);
    const [discountLiters, setDiscountLiters] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<Barrel | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['barrels'],
        queryFn: () => barrelService.getAll(),
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<BarrelForm>({
        resolver: zodResolver(barrelSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: BarrelForm) => barrelService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Barril creado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BarrelForm }) => barrelService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Barril actualizado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const discountMutation = useMutation({
        mutationFn: ({ id, liters }: { id: number; liters: number }) => barrelService.discount(id, { liters }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Descuento aplicado');
            setDiscountDialog(null);
            setDiscountLiters('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => barrelService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Barril eliminado');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset({ name: '', capacity_liters: 0, available_liters: 0 });
        setOpenForm(true);
    };

    const handleOpenEdit = (barrel: Barrel) => {
        setEditing(barrel);
        reset({ name: barrel.name, capacity_liters: barrel.capacity_liters, available_liters: barrel.available_liters });
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditing(null);
    };

    const onSubmit = (formData: BarrelForm) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const getBarrelColor = (percentage: number) => {
        if (percentage > 50) return 'bg-emerald-500';
        if (percentage > 20) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getBarrelTextColor = (percentage: number) => {
        if (percentage > 50) return 'text-emerald-400';
        if (percentage > 20) return 'text-amber-400';
        return 'text-red-400';
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Barriles</h1>
                <Button color="primary" className="cursor-pointer font-medium" onPress={handleOpenCreate}>
                    + Nuevo
                </Button>
            </div>

            {/* Barrel Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.items.map((barrel) => (
                    <Card key={barrel.id} className={`border-none shadow-none ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <CardContent className="p-5">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🍺</span>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{barrel.name}</span>
                                </div>
                                <Chip size="sm" variant="flat" color={barrel.is_empty ? 'danger' : 'success'}>
                                    {barrel.is_empty ? 'Vacío' : 'Activo'}
                                </Chip>
                            </div>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between mb-1.5">
                                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {barrel.available_liters.toFixed(1)}L / {barrel.capacity_liters.toLocaleString()}L
                                    </span>
                                    <span className={`text-xs font-semibold ${getBarrelTextColor(barrel.percentage_remaining)}`}>
                                        {barrel.percentage_remaining.toFixed(0)}%
                                    </span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                    <div
                                        className={`h-full rounded-full transition-all ${getBarrelColor(barrel.percentage_remaining)}`}
                                        style={{ width: `${Math.min(barrel.percentage_remaining, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    className="cursor-pointer"
                                    isDisabled={barrel.is_empty}
                                    onPress={() => setDiscountDialog(barrel)}
                                >
                                    🍺 Descontar
                                </Button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(barrel)}
                                        className={`cursor-pointer p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(barrel)}
                                        className="cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {(!data?.items || data.items.length === 0) && (
                    <div className={`col-span-full text-center py-12 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        No hay barriles registrados
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {openForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={handleCloseForm}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">{editing ? '✏️' : '🍺'}</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {editing ? 'Editar Barril' : 'Nuevo Barril'}
                        </h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {editing ? 'Modifica los datos del barril' : 'Registra un nuevo barril'}
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nombre</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder="Nombre del barril"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Capacidad (L)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('capacity_liters', { valueAsNumber: true })}
                                        placeholder="0"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                    {errors.capacity_liters && <p className="text-red-400 text-xs mt-1">{errors.capacity_liters.message}</p>}
                                </div>
                                <div>
                                    <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Disponibles (L)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        {...register('available_liters', { valueAsNumber: true })}
                                        placeholder="0"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                    />
                                    {errors.available_liters && <p className="text-red-400 text-xs mt-1">{errors.available_liters.message}</p>}
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

            {/* Discount Modal */}
            {discountDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDiscountDialog(null)}>
                    <div className={`rounded-3xl border w-full max-w-sm mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">🍺</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Descontar Litros</h2>
                        <p className={`text-sm text-center mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{discountDialog.name}</p>
                        <p className={`text-xs text-center mb-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Disponible: {discountDialog.available_liters.toFixed(1)}L
                        </p>

                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Litros a descontar</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={discountLiters}
                            onChange={(e) => setDiscountLiters(e.target.value.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                        />

                        <div className="flex gap-3 mt-6">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setDiscountDialog(null)}>Cancelar</Button>
                            <Button
                                size="lg"
                                color="warning"
                                className="flex-1 cursor-pointer font-semibold"
                                isLoading={discountMutation.isPending}
                                isDisabled={!discountLiters || Number(discountLiters) <= 0}
                                onPress={() => discountMutation.mutate({ id: discountDialog.id, liters: Number(discountLiters) })}
                            >
                                Descontar
                            </Button>
                        </div>
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
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Eliminar Barril</h2>
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

export default BarrelsPage;
