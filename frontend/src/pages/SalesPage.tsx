import { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Stack,
    Alert,
    LinearProgress,
} from '@mui/material';
import { Add, Visibility, Delete, Payment, Receipt, AttachMoney } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '../services/sale.service';
import { orderService } from '../services/order.service';
import { Sale, PaymentCreate, PaymentMethod, OrderStatus } from '../types';
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
    const [createDialog, setCreateDialog] = useState(false);
    const [detailDialog, setDetailDialog] = useState<Sale | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<number>(0);
    const [payments, setPayments] = useState<PaymentCreate[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [saleNotes, setSaleNotes] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: () => saleService.getAll({ limit: 50 }),
    });

    const { data: orders } = useQuery({
        queryKey: ['orders-for-sale'],
        queryFn: () => orderService.getAll({ status: OrderStatus.LISTO, limit: 50 }),
    });

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
            toast.success('Venta registrada exitosamente');
            handleCloseCreate();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al registrar venta'),
    });

    const handleCloseCreate = () => {
        setCreateDialog(false);
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

    const handlePayFullAmount = () => {
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

    const selectedOrderData = orders?.items.find((o) => o.id === selectedOrder);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentProgress = selectedOrderData ? Math.min((totalPayments / selectedOrderData.total) * 100, 100) : 0;
    const isPaymentComplete = selectedOrderData ? totalPayments >= selectedOrderData.total : false;

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">Ventas</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
                    Nueva Venta
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Pedido</TableCell>
                            <TableCell>Mesa</TableCell>
                            <TableCell>Empleado</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>Métodos</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.items.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell>{sale.id}</TableCell>
                                <TableCell>#{sale.order_id}</TableCell>
                                <TableCell>Mesa {sale.table_number}</TableCell>
                                <TableCell>{sale.employee_name || '-'}</TableCell>
                                <TableCell align="right">${sale.total.toLocaleString()}</TableCell>
                                <TableCell>
                                    {sale.payments.map((p) => (
                                        <Chip key={p.id} label={paymentMethodLabel[p.payment_method]} size="small" sx={{ mr: 0.5 }} />
                                    ))}
                                </TableCell>
                                <TableCell>{new Date(sale.sale_date).toLocaleString('es-CO')}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => setDetailDialog(sale)}>
                                        <Visibility />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Sale Dialog */}
            <Dialog open={createDialog} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Receipt sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={700}>Nueva Venta</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Order Selection */}
                        <FormControl fullWidth>
                            <InputLabel>Seleccionar Pedido</InputLabel>
                            <Select
                                value={selectedOrder}
                                onChange={(e) => setSelectedOrder(Number(e.target.value))}
                                label="Seleccionar Pedido"
                            >
                                {orders?.items.map((o) => (
                                    <MenuItem key={o.id} value={o.id}>
                                        <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
                                            <Typography>Pedido #{o.id} — Mesa {o.table_number}</Typography>
                                            <Typography fontWeight={600} color="primary.main">${o.total.toLocaleString()}</Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Order Summary */}
                        {selectedOrderData && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderColor: 'primary.main',
                                    borderStyle: 'solid',
                                    background: 'rgba(10, 132, 255, 0.04)',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Total a cobrar</Typography>
                                        <Typography variant="h5" fontWeight={700}>${selectedOrderData.total.toLocaleString()}</Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="body2" color="text.secondary">Items</Typography>
                                        <Typography variant="h6" fontWeight={600}>{selectedOrderData.items.length}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        )}

                        <Divider />

                        {/* Payment Section */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <Payment sx={{ color: 'primary.main', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight={600}>Métodos de Pago</Typography>
                            </Stack>

                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel>Método</InputLabel>
                                        <Select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                            label="Método"
                                        >
                                            {Object.values(PaymentMethod).map((m) => (
                                                <MenuItem key={m} value={m}>
                                                    {paymentMethodIcon[m]} {paymentMethodLabel[m]}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        size="small"
                                        label="Monto"
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0"
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        size="small"
                                        label="Referencia"
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        placeholder="Opcional"
                                        sx={{ flex: 1 }}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddPayment}
                                        disabled={!paymentAmount || Number(paymentAmount) <= 0}
                                        startIcon={<Add />}
                                        sx={{ flex: 1 }}
                                    >
                                        Agregar Pago
                                    </Button>
                                    {selectedOrderData && !isPaymentComplete && (
                                        <Button
                                            variant="contained"
                                            onClick={handlePayFullAmount}
                                            startIcon={<AttachMoney />}
                                            size="small"
                                            sx={{ whiteSpace: 'nowrap' }}
                                        >
                                            Pagar restante (${(selectedOrderData.total - totalPayments).toLocaleString()})
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Payments List */}
                        {payments.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <List dense disablePadding>
                                    {payments.map((p, index) => (
                                        <ListItem key={index} sx={{ px: 1 }}>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="body2">{paymentMethodIcon[p.payment_method]}</Typography>
                                                        <Typography variant="body1" fontWeight={500}>
                                                            {paymentMethodLabel[p.payment_method]}
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={700} color="primary.main">
                                                            ${p.amount.toLocaleString()}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                secondary={p.reference ? `Ref: ${p.reference}` : undefined}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" size="small" onClick={() => handleRemovePayment(index)}>
                                                    <Delete fontSize="small" color="error" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>

                                <Divider sx={{ my: 1.5 }} />

                                {/* Payment Progress */}
                                <Box sx={{ px: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Progreso de pago</Typography>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color={isPaymentComplete ? 'success.main' : 'warning.main'}
                                        >
                                            ${totalPayments.toLocaleString()} / ${selectedOrderData?.total.toLocaleString() || '0'}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={paymentProgress}
                                        color={isPaymentComplete ? 'success' : 'primary'}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>

                                {isPaymentComplete && (
                                    <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
                                        Pago completo ✓
                                    </Alert>
                                )}
                            </Paper>
                        )}

                        {/* Notes */}
                        <TextField
                            fullWidth
                            label="Notas de la venta"
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                            placeholder="Observaciones opcionales..."
                            multiline
                            rows={2}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={handleCloseCreate}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => createMutation.mutate()}
                        disabled={!selectedOrder || payments.length === 0 || !isPaymentComplete || createMutation.isPending}
                        startIcon={<Receipt />}
                    >
                        {createMutation.isPending ? 'Registrando...' : 'Registrar Venta'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Receipt sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={700}>Venta #{detailDialog?.id}</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={0.5}>
                                <Typography variant="body2" color="text.secondary">Pedido: #{detailDialog?.order_id}</Typography>
                                <Typography variant="body2" color="text.secondary">Mesa: {detailDialog?.table_number}</Typography>
                                <Typography variant="body2" color="text.secondary">Empleado: {detailDialog?.employee_name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Fecha: {detailDialog && new Date(detailDialog.sale_date).toLocaleString('es-CO')}
                                </Typography>
                            </Stack>
                        </Paper>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }} fontWeight={600}>Pagos realizados:</Typography>
                            <List dense disablePadding>
                                {detailDialog?.payments.map((p) => (
                                    <ListItem key={p.id} sx={{ px: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography>{paymentMethodIcon[p.payment_method]}</Typography>
                                                    <Typography fontWeight={500}>{paymentMethodLabel[p.payment_method]}</Typography>
                                                </Stack>
                                            }
                                            secondary={p.reference ? `Ref: ${p.reference}` : undefined}
                                        />
                                        <Typography variant="body1" fontWeight={600}>${p.amount.toLocaleString()}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        <Divider />

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight={700}>Total</Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                ${detailDialog?.total.toLocaleString()}
                            </Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDetailDialog(null)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalesPage;
