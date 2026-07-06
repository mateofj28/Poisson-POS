import { useState } from 'react';
import { Button, Chip, Spinner, Select, Label, ListBox } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '../services/sale.service';
import { orderService } from '../services/order.service';
import { Sale, PaymentCreate, PaymentMethod, OrderStatus } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const paymentMethodLabel: Record<PaymentMethod, string> = {
    [PaymentMethod.EFECTIVO]: 'Efectivo',
    [PaymentMethod.NEQUI]: 'Nequi',
    [PaymentMethod.DAVIPLATA]: 'Daviplata',
    [PaymentMethod.TRANSFERENCIA]: 'Transferencia',
    [PaymentMethod.TARJETA]: 'Tarjeta',
};

const paymentMethodIcon: Record<PaymentMethod, string> = {
    [PaymentMethod.EFECTIVO]: '💵',
    [PaymentMethod.NEQUI]: '📱',
    [PaymentMethod.DAVIPLATA]: '📲',
    [PaymentMethod.TRANSFERENCIA]: '🏦',
    [PaymentMethod.TARJETA]: '💳',
};

const SalesPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailDialog, setDetailDialog] = useState<Sale | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<number>(0);
    const [payments, setPayments] = useState<PaymentCreate[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [saleNotes, setSaleNotes] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [viewMode, setViewMode] = useState<'today' | 'all'>('today');

    const { data, isLoading } = useQuery({
        queryKey: ['sales', page, viewMode],
        queryFn: () => saleService.getAll({ skip: (page - 1) * pageSize, limit: pageSize, today_only: viewMode === 'today' }),
    });

    const { data: orders } = useQuery({
        queryKey: ['orders-for-sale'],
        queryFn: () => orderService.getAll({ limit: 50 }),
    });

    // Filter orders that haven't been sold yet (not ENTREGADO or CANCELADO)
    const availableOrders = orders?.items.filter(
        (o) => o.status !== OrderStatus.ENTREGADO && o.status !== OrderStatus.CANCELADO
    ) || [];

    const createMutation = useMutation({
        mutationFn: () => saleService.create({
            order_id: selectedOrder,
            payments,
            notes: saleNotes || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Venta registrada');
            handleCloseDrawer();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al registrar venta'),
    });

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedOrder(0);
        setPayments([]);
        setPaymentMethod(PaymentMethod.EFECTIVO);
        setPaymentAmount('');
        setPaymentRef('');
        setSaleNotes('');
    };

    const handleAddPayment = () => {
        const amount = Number(paymentAmount);
        if (amount <= 0) return;
        setPayments([...payments, { payment_method: paymentMethod, amount, reference: paymentRef || undefined }]);
        setPaymentAmount('');
        setPaymentRef('');
    };

    const handlePayFull = () => {
        if (!selectedOrderData) return;
        const remaining = selectedOrderData.total - totalPayments;
        if (remaining <= 0) return;
        setPayments([...payments, { payment_method: paymentMethod, amount: remaining, reference: paymentRef || undefined }]);
        setPaymentAmount('');
        setPaymentRef('');
    };

    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const selectedOrderData = availableOrders.find((o) => o.id === selectedOrder);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const isPaymentComplete = selectedOrderData ? totalPayments >= selectedOrderData.total : false;

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Ventas</h1>
                    <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                        <button onClick={() => { setViewMode('today'); setPage(1); }} className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${viewMode === 'today' ? (isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white') : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>Hoy</button>
                        <button onClick={() => { setViewMode('all'); setPage(1); }} className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${viewMode === 'all' ? (isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white') : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>Historial</button>
                    </div>
                </div>
                <Button color="primary" className="cursor-pointer" onPress={() => {
                    if (availableOrders.length === 0) {
                        toast.error('No hay pedidos disponibles para cobrar');
                        return;
                    }
                    setDrawerOpen(true);
                }}>
                    + Nueva Venta
                </Button>
            </div>

            {/* Table with horizontal scroll */}
            <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <table className="w-full min-w-[800px]">
                    <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                        <tr>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>#</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Pedido</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Mesa</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Empleado</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Métodos</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Fecha</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {data?.items.map((sale) => (
                            <tr key={sale.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>{sale.id}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>#{sale.order_id}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Mesa {sale.table_number}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{sale.employee_name || '-'}</td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>${sale.total.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {sale.payments.map((p) => (
                                            <Chip key={p.id} size="sm" variant="flat">{paymentMethodIcon[p.payment_method]} {paymentMethodLabel[p.payment_method]}</Chip>
                                        ))}
                                    </div>
                                </td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(sale.sale_date).toLocaleString('es-CO')}</td>
                                <td className="px-4 py-3 text-right">
                                    <Button size="sm" variant="flat" className="cursor-pointer" onPress={() => setDetailDialog(sale)}>Ver</Button>
                                </td>
                            </tr>
                        ))}
                        {(!data?.items || data.items.length === 0) && (
                            <tr>
                                <td colSpan={8} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay ventas registradas</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {/* Pagination */}
                {data && data.pages > 1 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.total)} de {data.total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
                            >
                                ← Anterior
                            </button>
                            <span className={`px-3 py-1.5 text-xs font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                {page} / {data.pages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                                disabled={page >= data.pages}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Drawer - Nueva Venta */}
            {drawerOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={handleCloseDrawer}></div>
                    <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col shadow-2xl border-l ${isDark ? 'bg-[#111113] border-zinc-800' : 'bg-[#fafafa] border-zinc-200'}`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nueva Venta</h2>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Registra el cobro de un pedido</p>
                            </div>
                            <button onClick={handleCloseDrawer} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Order Select */}
                            <Select
                                className="w-full"
                                placeholder="Seleccionar pedido..."
                                selectedKey={selectedOrder ? String(selectedOrder) : undefined}
                                onSelectionChange={(key) => {
                                    const val = typeof key === 'string' ? key : String(key);
                                    setSelectedOrder(Number(val) || 0);
                                }}
                            >
                                <Label>Pedido</Label>
                                <Select.Trigger>
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {availableOrders.map((o) => (
                                            <ListBox.Item key={o.id} id={String(o.id)} textValue={`Pedido #${o.id}`}>
                                                Pedido #{o.id} — Mesa {o.table_number} — ${o.total.toLocaleString()}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            {/* Order Summary */}
                            {selectedOrderData && (
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total a cobrar</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${selectedOrderData.total.toLocaleString()}</p>
                                </div>
                            )}

                            <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>

                            {/* Payment Method */}
                            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Agregar Pago</p>

                            <Select
                                className="w-full"
                                placeholder="Método..."
                                selectedKey={paymentMethod}
                                onSelectionChange={(key) => setPaymentMethod(key as PaymentMethod)}
                            >
                                <Label>Método de pago</Label>
                                <Select.Trigger>
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {Object.values(PaymentMethod).map((m) => (
                                            <ListBox.Item key={m} id={m} textValue={paymentMethodLabel[m]}>
                                                {paymentMethodIcon[m]} {paymentMethodLabel[m]}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={paymentAmount ? Number(paymentAmount).toLocaleString() : ''}
                                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Monto"
                                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [appearance:textfield] ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                <input
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    placeholder="Ref (opcional)"
                                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="flat" className="flex-1 cursor-pointer" onPress={handleAddPayment} isDisabled={!paymentAmount || Number(paymentAmount) <= 0}>
                                    + Agregar Pago
                                </Button>
                                {selectedOrderData && !isPaymentComplete && (
                                    <Button color="primary" className="flex-1 cursor-pointer" onPress={handlePayFull}>
                                        Pagar Todo (${(selectedOrderData.total - totalPayments).toLocaleString()})
                                    </Button>
                                )}
                            </div>

                            {/* Payments List */}
                            {payments.length > 0 && (
                                <div className="space-y-2">
                                    {payments.map((p, index) => (
                                        <div key={index} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{paymentMethodIcon[p.payment_method]}</span>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{paymentMethodLabel[p.payment_method]}</p>
                                                    {p.reference && <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Ref: {p.reference}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${p.amount.toLocaleString()}</span>
                                                <button onClick={() => handleRemovePayment(index)} className="text-red-400 hover:text-red-300 cursor-pointer">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Progress */}
                                    {selectedOrderData && (
                                        <div className={`p-3 rounded-xl ${isPaymentComplete ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200') : (isDark ? 'bg-zinc-900' : 'bg-zinc-100')}`}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Pagado</span>
                                                <span className={`font-semibold ${isPaymentComplete ? 'text-emerald-400' : (isDark ? 'text-white' : 'text-zinc-900')}`}>
                                                    ${totalPayments.toLocaleString()} / ${selectedOrderData.total.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                                <div className={`h-full rounded-full transition-all ${isPaymentComplete ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((totalPayments / selectedOrderData.total) * 100, 100)}%` }}></div>
                                            </div>
                                            {!isPaymentComplete && (
                                                <p className={`text-xs mt-1.5 font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    Faltan: ${(selectedOrderData.total - totalPayments).toLocaleString()}
                                                </p>
                                            )}
                                            {isPaymentComplete && totalPayments > selectedOrderData.total && (
                                                <div className={`mt-2 flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                                                    <span className="text-xs text-amber-400 font-medium">💰 Devolver al cliente:</span>
                                                    <span className="text-sm font-bold text-amber-400">${(totalPayments - selectedOrderData.total).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {isPaymentComplete && totalPayments === selectedOrderData.total && (
                                                <p className="text-xs text-emerald-400 mt-1.5 font-medium">✓ Pago exacto</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Clear all payments */}
                                    <button
                                        onClick={() => setPayments([])}
                                        className={`w-full text-center text-xs py-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                                    >
                                        🗑 Eliminar todos los pagos
                                    </button>
                                </div>
                            )}

                            {/* Notes */}
                            <input
                                value={saleNotes}
                                onChange={(e) => setSaleNotes(e.target.value)}
                                placeholder="Notas de la venta (opcional)"
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                            />
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-[#111113]' : 'border-zinc-200 bg-[#f4f4f5]'}`}>
                            <div className="flex gap-3">
                                <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={handleCloseDrawer}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="lg"
                                    color="primary"
                                    className="flex-1 cursor-pointer font-semibold"
                                    isLoading={createMutation.isPending}
                                    isDisabled={!selectedOrder || payments.length === 0 || !isPaymentComplete}
                                    onPress={() => createMutation.mutate()}
                                >
                                    Registrar Venta
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Detail Modal - Receipt Style */}
            {detailDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDetailDialog(null)}>
                    <div className="relative w-full max-w-[340px] mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
                            <div className="h-3 bg-white" style={{ backgroundImage: 'radial-gradient(circle, transparent 40%, white 40%)', backgroundSize: '12px 12px', backgroundPosition: '0 -6px' }}></div>
                            <div className="text-center px-6 pt-2 pb-4 border-b border-dashed border-zinc-300">
                                <p className="text-xl mb-0.5">🐟</p>
                                <h2 className="text-base font-bold text-zinc-900 tracking-tight">POISSON POS</h2>
                                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Venta #{String(detailDialog.id).padStart(4, '0')}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">{new Date(detailDialog.sale_date).toLocaleString('es-CO')}</p>
                            </div>
                            <div className="px-6 py-3 text-[11px] font-mono text-zinc-600 space-y-0.5 border-b border-dashed border-zinc-300">
                                <div className="flex justify-between"><span>Pedido:</span><span className="font-semibold text-zinc-900">#{detailDialog.order_id}</span></div>
                                <div className="flex justify-between"><span>Mesa:</span><span className="font-semibold text-zinc-900">{detailDialog.table_number || '-'}</span></div>
                                <div className="flex justify-between"><span>Empleado:</span><span className="font-semibold text-zinc-900">{detailDialog.employee_name || '-'}</span></div>
                            </div>
                            <div className="px-6 py-3 border-b border-dashed border-zinc-300">
                                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-2">Pagos</p>
                                {detailDialog.payments.map((p) => (
                                    <div key={p.id} className="flex justify-between text-[11px] font-mono mb-1">
                                        <span className="text-zinc-700">{paymentMethodIcon[p.payment_method]} {paymentMethodLabel[p.payment_method]}</span>
                                        <span className="font-semibold text-zinc-900">${p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider">Total</span>
                                    <span className="text-2xl font-bold text-zinc-900 font-mono">${detailDialog.total.toLocaleString()}</span>
                                </div>
                                {(() => {
                                    const totalPaid = detailDialog.payments.reduce((s, p) => s + p.amount, 0);
                                    const change = totalPaid - detailDialog.total;
                                    if (change > 0) {
                                        return (
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-200">
                                                <span className="text-[10px] font-mono text-amber-600 uppercase tracking-wider">Cambio devuelto</span>
                                                <span className="text-sm font-bold text-amber-600 font-mono">${change.toLocaleString()}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="px-6 py-3 text-center border-t border-dashed border-zinc-300">
                                <p className="text-[9px] font-mono text-zinc-400">¡Gracias por su compra!</p>
                            </div>
                            <div className="h-3 bg-white" style={{ backgroundImage: 'radial-gradient(circle, transparent 40%, white 40%)', backgroundSize: '12px 12px', backgroundPosition: '0 6px' }}></div>
                        </div>
                        <button onClick={() => setDetailDialog(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer text-white hover:bg-zinc-700 transition-colors shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesPage;
