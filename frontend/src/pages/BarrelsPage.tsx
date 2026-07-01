import { useState } from 'react';
import { Button, Chip, Spinner, Card, CardContent } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barrelService } from '../services/barrel.service';
import { Barrel } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const BarrelsPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [createDialog, setCreateDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<Barrel | null>(null);
    const [name, setName] = useState('');
    const [shotPrice, setShotPrice] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['barrels'],
        queryFn: () => barrelService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: () => barrelService.create({ name, shot_price: Number(shotPrice) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Botella registrada');
            setCreateDialog(false);
            setName('');
            setShotPrice('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: () => barrelService.update(editDialog!.id, { name: name || undefined, shot_price: Number(shotPrice) || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Actualizado');
            setEditDialog(null);
            setName('');
            setShotPrice('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const shotMutation = useMutation({
        mutationFn: (id: number) => barrelService.addShot(id, 1),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barrels'] }),
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const resetMutation = useMutation({
        mutationFn: (id: number) => barrelService.resetShots(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Conteo reiniciado');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => barrelService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['barrels'] });
            toast.success('Eliminado');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenEdit = (barrel: Barrel) => {
        setEditDialog(barrel);
        setName(barrel.name);
        setShotPrice(String(barrel.shot_price));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    const totalRevenue = data?.items.reduce((acc, b) => acc + b.revenue_today, 0) || 0;
    const totalShots = data?.items.reduce((acc, b) => acc + b.shots_sold_today, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Shots del Día</h1>
                    <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {totalShots} shots vendidos · ${totalRevenue.toLocaleString()} recaudado
                    </p>
                </div>
                <Button color="primary" className="cursor-pointer" onPress={() => setCreateDialog(true)}>
                    + Nueva Botella
                </Button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.items.map((barrel) => (
                    <Card key={barrel.id} className={`border-none shadow-none ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <CardContent className="p-5">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{barrel.name}</p>
                                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>${barrel.shot_price.toLocaleString()} / shot</p>
                                </div>
                                <Chip color={barrel.is_active ? 'success' : 'default'} size="sm" variant="flat">
                                    {barrel.is_active ? 'Activa' : 'Inactiva'}
                                </Chip>
                            </div>

                            {/* Stats */}
                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{barrel.shots_sold_today}</p>
                                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>shots hoy</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-emerald-400">${barrel.revenue_today.toLocaleString()}</p>
                                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>recaudado</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    size="sm"
                                    className="flex-1 cursor-pointer font-semibold"
                                    onPress={() => shotMutation.mutate(barrel.id)}
                                    isDisabled={!barrel.is_active}
                                >
                                    +1 Shot 🥃
                                </Button>
                                <button
                                    onClick={() => handleOpenEdit(barrel)}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-500'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                </button>
                                <button
                                    onClick={() => resetMutation.mutate(barrel.id)}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-500'}`}
                                    title="Reiniciar conteo"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(barrel.id)}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/10 text-red-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Modal */}
            {createDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setCreateDialog(false)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                <span className="text-lg">🍾</span>
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nueva Botella</h2>
                                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Registra una nueva botella o barril</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nombre</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Buchanan's 12 años" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
                            </div>
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Precio por shot</label>
                                <input type="text" inputMode="numeric" value={shotPrice ? Number(shotPrice).toLocaleString() : ''} onChange={(e) => setShotPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ej: 12.500" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setCreateDialog(false)}>Cancelar</Button>
                            <Button size="lg" color="primary" className="flex-1 cursor-pointer font-semibold" isDisabled={!name || !shotPrice} isLoading={createMutation.isPending} onPress={() => createMutation.mutate()}>Crear</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setEditDialog(null)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Editar Botella</h2>
                                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{editDialog.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nombre</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
                            </div>
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Precio por shot</label>
                                <input type="text" inputMode="numeric" value={shotPrice ? Number(shotPrice).toLocaleString() : ''} onChange={(e) => setShotPrice(e.target.value.replace(/[^0-9]/g, ''))} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setEditDialog(null)}>Cancelar</Button>
                            <Button size="lg" color="primary" className="flex-1 cursor-pointer font-semibold" isLoading={updateMutation.isPending} onPress={() => updateMutation.mutate()}>Actualizar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarrelsPage;
