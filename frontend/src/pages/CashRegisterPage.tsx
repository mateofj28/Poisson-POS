import { useState } from 'react';
import { Button, Chip, Spinner, Card, CardContent } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '../services/cash-register.service';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const CashRegisterPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [openDialog, setOpenDialog] = useState(false);
    const [closeDialog, setCloseDialog] = useState(false);
    const [openingAmount, setOpeningAmount] = useState('');
    const [closingAmount, setClosingAmount] = useState('');
    const [notes, setNotes] = useState('');

    const { data: activeRegister, isLoading: loadingActive } = useQuery({
        queryKey: ['cash-register-active'],
        queryFn: () => cashRegisterService.getActive(),
    });

    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ['cash-register-history'],
        queryFn: () => cashRegisterService.getAll({ limit: 20 }),
    });

    const openMutation = useMutation({
        mutationFn: () => cashRegisterService.open({ opening_amount: Number(openingAmount), notes: notes || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cash-register-active'] });
            queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
            toast.success('Caja abierta');
            setOpenDialog(false);
            setOpeningAmount('');
            setNotes('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al abrir caja'),
    });

    const closeMutation = useMutation({
        mutationFn: () => {
            if (!activeRegister) throw new Error('No hay caja activa');
            return cashRegisterService.close(activeRegister.id, { closing_amount: Number(closingAmount), notes: notes || undefined });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cash-register-active'] });
            queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
            toast.success('Caja cerrada');
            setCloseDialog(false);
            setClosingAmount('');
            setNotes('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al cerrar caja'),
    });

    if (loadingActive || loadingHistory) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    const exportReport = (reg: any) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Cierre - Poisson POS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px dashed #333; padding-bottom: 12px; }
        .header h1 { font-size: 18px; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #666; }
        .section { margin: 12px 0; padding: 8px 0; border-bottom: 1px dashed #ccc; }
        .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
        .row .label { color: #666; }
        .row .value { font-weight: bold; }
        .total { font-size: 16px; font-weight: bold; text-align: center; margin: 16px 0; padding: 12px; border: 2px solid #333; }
        .diff { text-align: center; margin: 8px 0; font-size: 14px; }
        .diff.positive { color: green; }
        .diff.negative { color: red; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; border-top: 2px dashed #333; padding-top: 12px; }
        @media print { body { padding: 10px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐟 POISSON POS</h1>
        <p>REPORTE DE CIERRE DE CAJA</p>
        <p>${new Date(reg.opened_at).toLocaleDateString('es-CO')}</p>
    </div>

    <div class="section">
        <div class="row"><span class="label">Empleado:</span><span class="value">${reg.employee_name || '-'}</span></div>
        <div class="row"><span class="label">Apertura:</span><span class="value">${new Date(reg.opened_at).toLocaleString('es-CO')}</span></div>
        <div class="row"><span class="label">Cierre:</span><span class="value">${reg.closed_at ? new Date(reg.closed_at).toLocaleString('es-CO') : '-'}</span></div>
    </div>

    <div class="section">
        <div class="row"><span class="label">Monto apertura:</span><span class="value">$${reg.opening_amount.toLocaleString()}</span></div>
        <div class="row"><span class="label">Ventas totales:</span><span class="value">$${reg.total_sales.toLocaleString()}</span></div>
        <div class="row"><span class="label">Ventas efectivo:</span><span class="value">$${reg.total_cash_sales.toLocaleString()}</span></div>
        <div class="row"><span class="label">Ventas digitales:</span><span class="value">$${reg.total_digital_sales.toLocaleString()}</span></div>
    </div>

    <div class="section">
        <div class="row"><span class="label">Efectivo esperado:</span><span class="value">$${reg.expected_amount !== null ? reg.expected_amount.toLocaleString() : '-'}</span></div>
        <div class="row"><span class="label">Efectivo contado:</span><span class="value">$${reg.closing_amount !== null ? reg.closing_amount.toLocaleString() : '-'}</span></div>
    </div>

    ${reg.difference !== null ? `
    <div class="diff ${reg.difference >= 0 ? 'positive' : 'negative'}">
        ${reg.difference >= 0 ? 'SOBRANTE' : 'FALTANTE'}: $${Math.abs(reg.difference).toLocaleString()}
    </div>` : ''}

    <div class="total">
        TOTAL VENTAS: $${reg.total_sales.toLocaleString()}
    </div>

    <div class="footer">
        <p>Poisson POS - Sistema de Punto de Venta</p>
        <p>Generado: ${new Date().toLocaleString('es-CO')}</p>
    </div>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <div className="space-y-6">
            <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Caja Registradora</h1>

            {/* Active Register Card */}
            <Card className={`border-none shadow-none ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                <CardContent className="p-5 sm:p-6">
                    {/* Status Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeRegister ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                {activeRegister ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                )}
                            </div>
                            <div>
                                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Estado de caja</p>
                                <Chip color={activeRegister ? 'success' : 'danger'} size="sm" variant="flat">{activeRegister ? 'Abierta' : 'Cerrada'}</Chip>
                            </div>
                        </div>
                        {!activeRegister ? (
                            <Button color="success" className="cursor-pointer font-medium" onPress={() => setOpenDialog(true)}>
                                🔓 Abrir Caja
                            </Button>
                        ) : (
                                <Button color="danger" className="cursor-pointer font-medium" onPress={() => setCloseDialog(true)}>
                                    🔒 Cerrar Caja
                            </Button>
                        )}
                    </div>

                    {activeRegister ? (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-white'}`}>
                                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Apertura</p>
                                    <p className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>${activeRegister.opening_amount.toLocaleString()}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-white'}`}>
                                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Ventas</p>
                                    <p className="text-lg font-bold mt-0.5 text-emerald-400">${activeRegister.total_sales.toLocaleString()}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-white'}`}>
                                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Efectivo</p>
                                    <p className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>${activeRegister.total_cash_sales.toLocaleString()}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800/60' : 'bg-white'}`}>
                                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Digital</p>
                                    <p className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>${activeRegister.total_digital_sales.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className={`flex flex-wrap gap-4 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                <span>⏱ {new Date(activeRegister.opened_at).toLocaleString('es-CO')}</span>
                                <span>👤 {activeRegister.employee_name || '-'}</span>
                            </div>
                        </>
                    ) : (
                            <div className={`p-4 rounded-xl text-sm ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                                ℹ️ No hay caja abierta. Abre una caja para comenzar a registrar ventas.
                            </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Historial</h2>
            <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <table className="w-full min-w-[700px]">
                    <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                        <tr>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Empleado</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Apertura</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Cierre</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ventas</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Diferencia</th>
                            <th className={`text-center px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Estado</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Fecha</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Reporte</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {history?.items.map((reg) => (
                            <tr key={reg.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>{reg.employee_name || '-'}</td>
                                <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-white' : 'text-zinc-900'}`}>${reg.opening_amount.toLocaleString()}</td>
                                <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{reg.closing_amount !== null ? `$${reg.closing_amount.toLocaleString()}` : '-'}</td>
                                <td className="px-4 py-3 text-sm text-right text-emerald-400 font-medium">${reg.total_sales.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    {reg.difference !== null ? (
                                        <Chip color={reg.difference >= 0 ? 'success' : 'danger'} size="sm" variant="flat">
                                            {reg.difference >= 0 ? '+' : ''}${reg.difference.toLocaleString()}
                                        </Chip>
                                    ) : <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>-</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Chip color={reg.is_open ? 'success' : 'default'} size="sm" variant={reg.is_open ? 'flat' : 'flat'}>
                                        {reg.is_open ? 'Abierta' : 'Cerrada'}
                                    </Chip>
                                </td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(reg.opened_at).toLocaleString('es-CO')}</td>
                                <td className="px-4 py-3 text-right">
                                    {!reg.is_open && (
                                        <button
                                            onClick={() => exportReport(reg)}
                                            className={`cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                            title="Exportar reporte"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!history?.items || history.items.length === 0) && (
                            <tr><td colSpan={8} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay registros</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Open Dialog */}
            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setOpenDialog(false)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Abrir Caja</h2>
                        <p className={`text-sm text-center mb-8 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ingresa el monto inicial de efectivo</p>

                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Monto de apertura</label>
                        <input
                            type="text" inputMode="numeric"
                            value={openingAmount ? Number(openingAmount).toLocaleString() : ''}
                            onChange={(e) => setOpeningAmount(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="$0"
                            className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all mb-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                        />
                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Notas (opcional)</label>
                        <input
                            value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones..."
                            className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                        />
                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setOpenDialog(false)}>Cancelar</Button>
                            <Button size="lg" color="success" className="flex-1 cursor-pointer font-semibold" isLoading={openMutation.isPending} isDisabled={!openingAmount} onPress={() => openMutation.mutate()}>Abrir Caja</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Dialog */}
            {closeDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setCloseDialog(false)}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Cerrar Caja</h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ingresa el conteo de efectivo real</p>

                        {activeRegister && (
                            <div className={`p-3 rounded-xl mb-5 space-y-1.5 text-xs font-mono ${isDark ? 'bg-zinc-800/60 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                                <div className="flex justify-between"><span>Apertura:</span><span className="font-semibold">${activeRegister.opening_amount.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Ventas efectivo:</span><span className="font-semibold">${activeRegister.total_cash_sales.toLocaleString()}</span></div>
                                <div className={`flex justify-between pt-1.5 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}><span className="font-bold">Esperado:</span><span className="font-bold text-blue-400">${(activeRegister.opening_amount + activeRegister.total_cash_sales).toLocaleString()}</span></div>
                            </div>
                        )}

                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Conteo real de efectivo</label>
                        <input
                            type="text" inputMode="numeric"
                            value={closingAmount ? Number(closingAmount).toLocaleString() : ''}
                            onChange={(e) => setClosingAmount(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="$0"
                            className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all mb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                        />

                        {closingAmount && activeRegister && (() => {
                            const expected = activeRegister.opening_amount + activeRegister.total_cash_sales;
                            const diff = Number(closingAmount) - expected;
                            return (
                                <div className={`p-3 rounded-xl text-sm mb-4 ${diff === 0 ? 'bg-emerald-500/10 text-emerald-400' : diff > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {diff === 0 && '✓ El conteo coincide con lo esperado'}
                                    {diff > 0 && `↑ Sobrante de $${diff.toLocaleString()}`}
                                    {diff < 0 && `↓ Faltante de $${Math.abs(diff).toLocaleString()}`}
                                </div>
                            );
                        })()}

                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Notas (opcional)</label>
                        <input
                            value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones..."
                            className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                        />
                        <div className="flex gap-3 mt-8">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setCloseDialog(false)}>Cancelar</Button>
                            <Button size="lg" color="danger" className="flex-1 cursor-pointer font-semibold" isLoading={closeMutation.isPending} isDisabled={!closingAmount} onPress={() => closeMutation.mutate()}>Cerrar Caja</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashRegisterPage;
