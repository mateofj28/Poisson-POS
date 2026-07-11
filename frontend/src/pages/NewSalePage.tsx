import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Select, Label, ListBox } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '../services/sale.service';
import { orderService } from '../services/order.service';
import { PaymentCreate, PaymentMethod, OrderStatus } from '../types';
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

const NewSalePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [selectedOrder, setSelectedOrder] = useState<number>(0);
    const [payments, setPayments] = useState<PaymentCreate[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [saleNotes, setSaleNotes] = useState('');

    const { data: orders } = useQuery({
        queryKey: ['orders-for-sale'],
        queryFn: () => orderService.getAll({ limit: 50, today_only: true }),
    });

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
            navigate('/sales');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al registrar venta'),
    });

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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/sales')} className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                </button>
                <div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Nueva Venta</h1>
                    <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Registra el cobro de un pedido</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Order + Payments */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Order Selection */}
                    <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        {availableOrders.length > 0 ? (
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
                                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
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
                        ) : (
                            <div className={`text-center py-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                <p className="text-sm">No hay pedidos disponibles para cobrar hoy</p>
                            </div>
                        )}

                        {selectedOrderData && (
                            <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total a cobrar</p>
                                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${selectedOrderData.total.toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Agregar Pago</p>

                        <Select
                            className="w-full mb-4"
                            placeholder="Método..."
                            selectedKey={paymentMethod}
                            onSelectionChange={(key) => setPaymentMethod(key as PaymentMethod)}
                        >
                            <Label>Método de pago</Label>
                            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <input
                                type="text" inputMode="numeric"
                                value={paymentAmount ? Number(paymentAmount).toLocaleString() : ''}
                                onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="Monto"
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
                            />
                            <input
                                value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)}
                                placeholder="Referencia (opcional)"
                                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
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
                    </div>

                    {/* Payments List */}
                    {payments.length > 0 && (
                        <div className="space-y-2">
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Pagos Agregados</p>
                            {payments.map((p, index) => (
                                <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{paymentMethodIcon[p.payment_method]}</span>
                                        <div>
                                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{paymentMethodLabel[p.payment_method]}</p>
                                            {p.reference && <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Ref: {p.reference}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${p.amount.toLocaleString()}</span>
                                        <button onClick={() => handleRemovePayment(index)} className="text-red-400 hover:text-red-300 cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button onClick={() => setPayments([])} className={`w-full text-center text-xs py-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
                                🗑 Eliminar todos los pagos
                            </button>
                        </div>
                    )}

                    {/* Notes */}
                    <input
                        value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)}
                        placeholder="Notas de la venta (opcional)"
                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
                    />
                </div>

                {/* Right - Summary */}
                <div className="lg:col-span-1">
                    <div className={`p-5 rounded-2xl sticky top-6 ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                        <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Resumen de Cobro</p>

                        {selectedOrderData && (
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-baseline">
                                    <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total pedido</span>
                                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>${selectedOrderData.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Pagado</span>
                                    <span className={`text-2xl font-bold ${isPaymentComplete ? 'text-emerald-400' : (isDark ? 'text-white' : 'text-zinc-900')}`}>${totalPayments.toLocaleString()}</span>
                                </div>

                                {/* Progress bar */}
                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                    <div className={`h-full rounded-full transition-all ${isPaymentComplete ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((totalPayments / selectedOrderData.total) * 100, 100)}%` }}></div>
                                </div>

                                {!isPaymentComplete && (
                                    <p className="text-base text-amber-400 font-bold">Faltan: ${(selectedOrderData.total - totalPayments).toLocaleString()}</p>
                                )}
                                {isPaymentComplete && totalPayments > selectedOrderData.total && (
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                        <p className="text-lg text-amber-400 font-bold">💰 Devolver: ${(totalPayments - selectedOrderData.total).toLocaleString()}</p>
                                    </div>
                                )}
                                {isPaymentComplete && totalPayments === selectedOrderData.total && (
                                    <p className="text-xs text-emerald-400 font-medium">✓ Pago exacto</p>
                                )}
                            </div>
                        )}

                        <Button
                            color="primary"
                            size="lg"
                            className="w-full cursor-pointer font-semibold"
                            isLoading={createMutation.isPending}
                            isDisabled={!selectedOrder || payments.length === 0 || !isPaymentComplete || createMutation.isPending}
                            onPress={() => { if (!createMutation.isPending) createMutation.mutate(); }}
                        >
                            Registrar Venta
                        </Button>

                        <Button variant="flat" size="lg" className="w-full cursor-pointer mt-2" onPress={() => navigate('/sales')}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewSalePage;
