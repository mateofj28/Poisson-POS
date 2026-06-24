import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    IconButton,
    Fab,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/table.service';
import { employeeService } from '../services/employee.service';
import { Table, TableStatus } from '../types';
import { useAuthStore } from '../store/auth.store';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const statusColor: Record<TableStatus, string> = {
    [TableStatus.LIBRE]: '#4CAF50',
    [TableStatus.OCUPADA]: '#F44336',
    [TableStatus.EN_PAGO]: '#FFC107',
};

const statusLabel: Record<TableStatus, string> = {
    [TableStatus.LIBRE]: 'Libre',
    [TableStatus.OCUPADA]: 'Ocupada',
    [TableStatus.EN_PAGO]: 'En Pago',
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
        mutationFn: ({ id, waiter_id }: { id: number; waiter_id: number }) =>
            tableService.open(id, { waiter_id }),
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

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Mesas</Typography>
                {employee?.role === 'admin' && (
                    <Fab color="primary" size="small" onClick={() => setCreateDialog(true)}>
                        <Add />
                    </Fab>
                )}
            </Box>

            <Grid container spacing={2}>
                {data?.items.map((table) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: `3px solid ${statusColor[table.status]}`,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' },
                                position: 'relative',
                            }}
                            onClick={() => handleTableClick(table)}
                        >
                            {employee?.role === 'admin' && (
                                <IconButton
                                    size="small"
                                    sx={{ position: 'absolute', top: 4, right: 4 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm(table);
                                    }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            )}
                            <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {table.number}
                                </Typography>
                                <Chip
                                    label={statusLabel[table.status]}
                                    size="small"
                                    sx={{ backgroundColor: statusColor[table.status], color: '#fff', mt: 1 }}
                                />
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                                {table.waiter_name && (
                                    <Typography variant="caption" color="text.secondary">
                                        {table.waiter_name}
                                    </Typography>
                                )}
                                {table.occupation_time && (
                                    <Typography variant="caption" color="text.secondary">
                                        {table.occupation_time}
                                    </Typography>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Open Table Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Abrir Mesa {selectedTable?.number}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Mesero</InputLabel>
                        <Select value={waiterId} onChange={(e) => setWaiterId(Number(e.target.value))} label="Mesero">
                            {waiters?.items.map((w) => (
                                <MenuItem key={w.id} value={w.id}>
                                    {w.first_name} {w.last_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => selectedTable && openMutation.mutate({ id: selectedTable.id, waiter_id: waiterId })}
                        disabled={!waiterId || openMutation.isPending}
                    >
                        Abrir Mesa
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Table Dialog */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Crear Mesa</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Número de mesa"
                        type="number"
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => createMutation.mutate(Number(newTableNumber))}
                        disabled={!newTableNumber || createMutation.isPending}
                    >
                        Crear
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Eliminar Mesa"
                message={`¿Está seguro de eliminar la mesa ${deleteConfirm?.number}?`}
                onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default TablesPage;
