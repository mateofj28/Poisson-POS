import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Spinner } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/table.service';
import { employeeService } from '../services/employee.service';
import { Table, TableStatus } from '../types';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string; border: string }> = {
    [TableStatus.LIBRE]: { label: 'Libre', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    [TableStatus.OCUPADA]: { label: 'Ocupada', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    [TableStatus.EN_PAGO]: { label: 'En Pago', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

const TablesPage = () => {
    const queryClient = useQueryClient();
    const { employee } = useAuthStore();
    const [openDialog, setOpenDialog] = useState(false);
    const [createDialog, setCreateDialog] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [waiterId, setWaiterId] = useState<number>(0);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<Table | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: () => tableService.getAll(),
    });

    const { data: waiters } = useQuery({
        queryKey: ['employees-waiters'],
        queryFn: () => employeeService.getAll({ role: 'mesero', is_active: true, limit: 100 }),
    });

    const openMutation = useMutation({
        mutationFn: ({ id, waiter_id }: { id: number; waiter_id: number }) => tableService.open(id, { waiter_id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Mesa abierta');
            setOpenDialog(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al abrir mesa'),
    });

    const closeMutation = useMutation({
        mutationFn: (id: number) => tableService.close(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Mesa cerrada');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al cerrar mesa'),
    });

    const createMutation = useMutation({
        mutationFn: (number: number) => tableService.create({ number }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Mesa creada');
            setCreateDialog(false);
            setNewTableNumber('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear mesa'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => tableService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Mesa eliminada');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al eliminar'),
    });

    const handleTableClick = (table: Table) => {
        if (table.status === TableStatus.LIBRE) {
            setSelectedTable(table);
            setWaiterId(employee?.id || 0);
            setOpenDialog(true);
        } else if (table.status === TableStatus.OCUPADA || table.status === TableStatus.EN_PAGO) {
            closeMutation.mutate(table.id);
        }
    };

    const libre = data?.items.filter((t) => t.status === TableStatus.LIBRE) || [];
    const ocupada = data?.items.filter((t) => t.status === TableStatus.OCUPADA) || [];
    const enPago = data?.items.filter((t) => t.status === TableStatus.EN_PAGO) || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Mesas</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">{data?.items.length} mesas en total</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status summary */}
                    <div className="flex items-center gap-2 mr-4">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            {libre.length} libres
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            {ocupada.length} ocupadas
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            {enPago.length} en pago
                        </span>
                    </div>
                    {employee?.role === 'admin' && (
                        <Button
                            color="primary"
                            size="sm"
                            onPress={() => setCreateDialog(true)}
                            className="font-medium"
                        >
                            + Nueva Mesa
                        </Button>
                    )}
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data?.items.map((table) => {
                    const config = statusConfig[table.status];
                    return (
                        <div
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className={`relative group cursor-pointer rounded-2xl border ${config.border} ${config.bg} p-4 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg`}
                        >
                            {/* Delete button (admin only) */}
                            {employee?.role === 'admin' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(table); }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Table Number */}
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white mb-2">{table.number}</p>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${config.color} ${config.bg} border ${config.border}`}>
                                    {config.label}
                                </span>
                            </div>

                            {/* Waiter & Time */}
                            {(table.waiter_name || table.occupation_time) && (
                                <div className="mt-3 pt-2 border-t border-zinc-800/50 text-center space-y-0.5">
                                    {table.waiter_name && (
                                        <p className="text-[11px] text-zinc-400 truncate">{table.waiter_name}</p>
                                    )}
                                    {table.occupation_time && (
                                        <p className="text-[10px] text-zinc-500">⏱ {table.occupation_time}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Open Table Modal */}
            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpenDialog(false)}>
                    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 w-full max-w-sm mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-white mb-1">Abrir Mesa {selectedTable?.number}</h2>
                        <p className="text-sm text-zinc-500 mb-5">Selecciona el mesero asignado</p>

                        <select
                            value={waiterId}
                            onChange={(e) => setWaiterId(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value={0}>Seleccionar mesero...</option>
                            {waiters?.items.map((w) => (
                                <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
                            ))}
                        </select>

                        <div className="flex gap-2 mt-5">
                            <Button size="sm" variant="flat" className="flex-1" onPress={() => setOpenDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                className="flex-1"
                                isLoading={openMutation.isPending}
                                isDisabled={!waiterId}
                                onPress={() => selectedTable && openMutation.mutate({ id: selectedTable.id, waiter_id: waiterId })}
                            >
                                Abrir Mesa
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Table Modal */}
            {createDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCreateDialog(false)}>
                    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 w-full max-w-sm mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-white mb-1">Crear Mesa</h2>
                        <p className="text-sm text-zinc-500 mb-5">Ingresa el número de la nueva mesa</p>

                        <input
                            type="number"
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(e.target.value)}
                            placeholder="Número de mesa"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white text-sm placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                        />

                        <div className="flex gap-2 mt-5">
                            <Button size="sm" variant="flat" className="flex-1" onPress={() => setCreateDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                className="flex-1"
                                isLoading={createMutation.isPending}
                                isDisabled={!newTableNumber}
                                onPress={() => createMutation.mutate(Number(newTableNumber))}
                            >
                                Crear
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 w-full max-w-sm mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-white mb-1">Eliminar Mesa</h2>
                        <p className="text-sm text-zinc-400 mb-5">¿Estás seguro de eliminar la mesa <span className="text-white font-medium">{deleteConfirm.number}</span>? Esta acción no se puede deshacer.</p>

                        <div className="flex gap-2">
                            <Button size="sm" variant="flat" className="flex-1" onPress={() => setDeleteConfirm(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                color="danger"
                                className="flex-1"
                                isLoading={deleteMutation.isPending}
                                onPress={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPage;
