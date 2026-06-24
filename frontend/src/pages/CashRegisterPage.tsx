import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Stack,
    Alert,
} from '@mui/material';
import {
    PointOfSale,
    LockOpen,
    Lock,
    AccessTime,
    Person,
    AttachMoney,
    CreditCard,
    TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '../services/cash-register.service';
import toast from 'react-hot-toast';

const CashRegisterPage = () => {
    const queryClient = useQueryClient();
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
            toast.success('Caja abierta exitosamente');
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
            toast.success('Caja cerrada exitosamente');
            setCloseDialog(false);
            setClosingAmount('');
            setNotes('');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al cerrar caja'),
    });

    if (loadingActive || loadingHistory) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Caja Registradora</Typography>

            {/* Active Register Status */}
            <Card sx={{ mb: 4, overflow: 'visible' }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: activeRegister
                                        ? 'linear-gradient(135deg, rgba(48, 209, 88, 0.2), rgba(48, 209, 88, 0.05))'
                                        : 'linear-gradient(135deg, rgba(255, 69, 58, 0.2), rgba(255, 69, 58, 0.05))',
                                    border: `1px solid ${activeRegister ? 'rgba(48, 209, 88, 0.3)' : 'rgba(255, 69, 58, 0.3)'}`,
                                }}
                            >
                                <PointOfSale sx={{ color: activeRegister ? 'success.main' : 'error.main' }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Estado de caja</Typography>
                                <Chip
                                    label={activeRegister ? 'Abierta' : 'Cerrada'}
                                    color={activeRegister ? 'success' : 'error'}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                />
                            </Box>
                        </Stack>

                        {!activeRegister ? (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<LockOpen />}
                                onClick={() => setOpenDialog(true)}
                                sx={{ borderRadius: 3, px: 3 }}
                            >
                                Abrir Caja
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<Lock />}
                                onClick={() => setCloseDialog(true)}
                                sx={{ borderRadius: 3, px: 3 }}
                            >
                                Cerrar Caja
                            </Button>
                        )}
                    </Stack>

                    {activeRegister ? (
                        <>
                            {/* Stats Grid */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                    gap: 2,
                                    mb: 3,
                                }}
                            >
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        background: 'rgba(10, 132, 255, 0.04)',
                                        borderColor: 'rgba(10, 132, 255, 0.2)',
                                    }}
                                >
                                    <AttachMoney sx={{ color: 'primary.main', fontSize: 28, mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Monto Apertura</Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        ${activeRegister.opening_amount.toLocaleString()}
                                    </Typography>
                                </Paper>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        background: 'rgba(48, 209, 88, 0.04)',
                                        borderColor: 'rgba(48, 209, 88, 0.2)',
                                    }}
                                >
                                    <TrendingUp sx={{ color: 'success.main', fontSize: 28, mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Ventas Totales</Typography>
                                    <Typography variant="h6" fontWeight={700} color="success.main">
                                        ${activeRegister.total_sales.toLocaleString()}
                                    </Typography>
                                </Paper>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        background: 'rgba(48, 209, 88, 0.04)',
                                        borderColor: 'rgba(48, 209, 88, 0.15)',
                                    }}
                                >
                                    <AttachMoney sx={{ color: 'success.light', fontSize: 28, mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Ventas Efectivo</Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        ${activeRegister.total_cash_sales.toLocaleString()}
                                    </Typography>
                                </Paper>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        background: 'rgba(94, 92, 230, 0.04)',
                                        borderColor: 'rgba(94, 92, 230, 0.2)',
                                    }}
                                >
                                    <CreditCard sx={{ color: 'secondary.main', fontSize: 28, mb: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Ventas Digitales</Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        ${activeRegister.total_digital_sales.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Box>

                            {/* Meta info */}
                            <Divider sx={{ mb: 2 }} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Apertura: {new Date(activeRegister.opened_at).toLocaleString('es-CO')}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {activeRegister.employee_name || 'Sin asignar'}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </>
                    ) : (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                            No hay caja abierta actualmente. Abre una caja para comenzar a registrar ventas.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Typography variant="h5" sx={{ mb: 2 }} fontWeight={600}>Historial</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Empleado</TableCell>
                            <TableCell align="right">Apertura</TableCell>
                            <TableCell align="right">Cierre</TableCell>
                            <TableCell align="right">Ventas</TableCell>
                            <TableCell align="right">Diferencia</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Fecha</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history?.items.map((reg) => (
                            <TableRow key={reg.id}>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="body2">{reg.employee_name || '-'}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={500}>${reg.opening_amount.toLocaleString()}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={500}>
                                        {reg.closing_amount !== null ? `$${reg.closing_amount.toLocaleString()}` : '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        ${reg.total_sales.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    {reg.difference !== null ? (
                                        <Chip
                                            label={`${reg.difference >= 0 ? '+' : ''}$${reg.difference.toLocaleString()}`}
                                            size="small"
                                            color={reg.difference >= 0 ? 'success' : 'error'}
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={reg.is_open ? 'Abierta' : 'Cerrada'}
                                        size="small"
                                        color={reg.is_open ? 'success' : 'default'}
                                        variant={reg.is_open ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(reg.opened_at).toLocaleString('es-CO')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Open Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.2), rgba(48, 209, 88, 0.05))',
                                border: '1px solid rgba(48, 209, 88, 0.3)',
                            }}
                        >
                            <LockOpen sx={{ color: 'success.main', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700}>Abrir Caja</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1.5 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Ingresa el monto inicial de efectivo en la caja.
                        </Alert>
                        <TextField
                            fullWidth
                            label="Monto de apertura"
                            type="number"
                            value={openingAmount}
                            onChange={(e) => setOpeningAmount(e.target.value)}
                            placeholder="0"
                            slotProps={{ htmlInput: { min: 0 } }}
                        />
                        <TextField
                            fullWidth
                            label="Notas (opcional)"
                            multiline
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => openMutation.mutate()}
                        disabled={!openingAmount || openMutation.isPending}
                        startIcon={<LockOpen />}
                    >
                        {openMutation.isPending ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Close Dialog */}
            <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, rgba(255, 69, 58, 0.2), rgba(255, 69, 58, 0.05))',
                                border: '1px solid rgba(255, 69, 58, 0.3)',
                            }}
                        >
                            <Lock sx={{ color: 'error.main', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700}>Cerrar Caja</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1.5 }}>
                        {activeRegister && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderColor: 'rgba(10, 132, 255, 0.2)',
                                    background: 'rgba(10, 132, 255, 0.04)',
                                }}
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Apertura</Typography>
                                        <Typography variant="body2" fontWeight={600}>${activeRegister.opening_amount.toLocaleString()}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Ventas en efectivo</Typography>
                                        <Typography variant="body2" fontWeight={600}>${activeRegister.total_cash_sales.toLocaleString()}</Typography>
                                    </Stack>
                                    <Divider />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" fontWeight={600}>Efectivo esperado</Typography>
                                        <Typography variant="body1" fontWeight={700} color="primary.main">
                                            ${(activeRegister.opening_amount + activeRegister.total_cash_sales).toLocaleString()}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>
                        )}
                        <TextField
                            fullWidth
                            label="Conteo de efectivo real"
                            type="number"
                            value={closingAmount}
                            onChange={(e) => setClosingAmount(e.target.value)}
                            placeholder="Cuenta el efectivo en caja"
                            slotProps={{ htmlInput: { min: 0 } }}
                        />
                        {closingAmount && activeRegister && (
                            <Alert
                                severity={
                                    Number(closingAmount) === (activeRegister.opening_amount + activeRegister.total_cash_sales)
                                        ? 'success'
                                        : Number(closingAmount) > (activeRegister.opening_amount + activeRegister.total_cash_sales)
                                            ? 'info'
                                            : 'warning'
                                }
                                sx={{ borderRadius: 2 }}
                            >
                                {(() => {
                                    const expected = activeRegister.opening_amount + activeRegister.total_cash_sales;
                                    const diff = Number(closingAmount) - expected;
                                    if (diff === 0) return 'El conteo coincide con lo esperado ✓';
                                    if (diff > 0) return `Sobrante de $${diff.toLocaleString()}`;
                                    return `Faltante de $${Math.abs(diff).toLocaleString()}`;
                                })()}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            label="Notas de cierre (opcional)"
                            multiline
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones del cierre..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCloseDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => closeMutation.mutate()}
                        disabled={!closingAmount || closeMutation.isPending}
                        startIcon={<Lock />}
                    >
                        {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Caja'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CashRegisterPage;
