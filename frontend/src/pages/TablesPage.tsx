import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Spinner, Select, Label, ListBox } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/table.service';
import { employeeService } from '../services/employee.service';
import { Table, TableStatus } from '../types';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string; border: string }> = {
    [TableStatus.LIBRE]: { label: 'Libre', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    [TableStatus.OCUPADA]: { label: 'Ocupada', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    [TableStatus.EN_PAGO]: { label: 'En Pago', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

const TablesPage = () => {
    const queryClient = useQueryClient();
    const { employee } = useAuthStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
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
                    <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Mesas</h1>
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
                                <p className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{table.number}</p>
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
                                        <p className="text-[10px] text-zinc-500">â± {table.occupation_time}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Open Table Modal */}
            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setOpenDialog(false)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? "bg-[#18181b] border-zinc-800" : "bg-white border-zinc-200"}`} onClick={(e) => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>

                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? "text-white" : "text-zinc-900"}`}>Abrir Mesa {selectedTable?.number}</h2>
                        <p className={`text-sm text-center mb-8 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Selecciona el mesero que atenderÃ¡ esta mesa</p>

                        <Select
                            className="w-full"
                            placeholder="Seleccionar mesero..."
                            selectedKey={waiterId ? String(waiterId) : undefined}
                            onSelectionChange={(key) => setWaiterId(Number(key))}
                        >
                            <Label>Mesero asignado</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {(waiters?.items || []).map((w) => (
                                        <ListBox.Item key={w.id} id={String(w.id)} textValue={`${w.first_name} ${w.last_name}`}>
                                            {w.first_name} {w.last_name}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>

                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 text-base" onPress={() => setOpenDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary"
                                className="flex-1 text-base font-semibold"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setCreateDialog(false)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? "bg-[#18181b] border-zinc-800" : "bg-white border-zinc-200"}`} onClick={(e) => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-emerald-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>

                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? "text-white" : "text-zinc-900"}`}>Crear Mesa</h2>
                        <p className={`text-sm text-center mb-8 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Ingresa el nÃºmero para la nueva mesa</p>

                        <label className={`text-sm font-medium mb-2 block ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>NÃºmero de mesa</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={newTableNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setNewTableNumber(val);
                            }}
                            placeholder="Ej: 13"
                            className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? "bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500" : "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400"}`}
                        />

                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 text-base" onPress={() => setCreateDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary"
                                className="flex-1 text-base font-semibold"
                                isLoading={createMutation.isPending}
                                isDisabled={!newTableNumber}
                                onPress={() => createMutation.mutate(Number(newTableNumber))}
                            >
                                Crear Mesa
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? "bg-[#18181b] border-zinc-800" : "bg-white border-zinc-200"}`} onClick={(e) => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </div>

                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? "text-white" : "text-zinc-900"}`}>Eliminar Mesa {deleteConfirm.number}</h2>
                        <p className={`text-sm text-center mb-8 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>¿Estás seguro? Esta acción no se puede deshacer y se perderán los datos asociados a esta mesa.</p>

                        <div className="flex gap-3">
                            <Button size="lg" variant="flat" className="flex-1 text-base" onPress={() => setDeleteConfirm(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="danger"
                                className="flex-1 text-base font-semibold"
                                isLoading={deleteMutation.isPending}
                                onPress={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                            >
                                SÃ­, eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPage;

