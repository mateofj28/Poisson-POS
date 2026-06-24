import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Chip,
    IconButton,
} from '@mui/material';
import { Add, Edit, Delete, LocalDrink } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { barrelService } from '../services/barrel.service';
import { Barrel } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const barrelSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    capacity_liters: z.number().min(0.1, 'Debe ser mayor a 0'),
    available_liters: z.number().min(0, 'No puede ser negativo'),
});

type BarrelForm = z.infer<typeof barrelSchema>;

const BarrelsPage = () => {
    const queryClient = useQueryClient();
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
        if (percentage > 50) return 'success';
        if (percentage > 20) return 'warning';
        return 'error';
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Barriles</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Nuevo</Button>
            </Box>

            <Grid container spacing={3}>
                {data?.items.map((barrel) => (
                    <Grid item xs={12} sm={6} md={4} key={barrel.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocalDrink color="primary" />
                                        <Typography variant="h6">{barrel.name}</Typography>
                                    </Box>
                                    <Chip
                                        label={barrel.is_empty ? 'Vacío' : 'Activo'}
                                        size="small"
                                        color={barrel.is_empty ? 'error' : 'success'}
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {barrel.available_liters.toFixed(1)}L / {barrel.capacity_liters}L
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {barrel.percentage_remaining.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={barrel.percentage_remaining}
                                        color={getBarrelColor(barrel.percentage_remaining)}
                                        sx={{ height: 12, borderRadius: 6 }}
                                    />
                                </Box>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'space-between' }}>
                                <Button size="small" startIcon={<LocalDrink />} onClick={() => setDiscountDialog(barrel)} disabled={barrel.is_empty}>
                                    Descontar
                                </Button>
                                <Box>
                                    <IconButton size="small" onClick={() => handleOpenEdit(barrel)}><Edit /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(barrel)}><Delete /></IconButton>
                                </Box>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create/Edit Dialog */}
            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editing ? 'Editar Barril' : 'Nuevo Barril'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nombre" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Capacidad (litros)" type="number" inputProps={{ step: '0.1' }} {...register('capacity_liters', { valueAsNumber: true })} error={!!errors.capacity_liters} helperText={errors.capacity_liters?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Litros disponibles" type="number" inputProps={{ step: '0.1' }} {...register('available_liters', { valueAsNumber: true })} error={!!errors.available_liters} helperText={errors.available_liters?.message} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseForm}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editing ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Discount Dialog */}
            <Dialog open={!!discountDialog} onClose={() => setDiscountDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Descontar litros - {discountDialog?.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Disponible: {discountDialog?.available_liters.toFixed(1)}L
                    </Typography>
                    <TextField
                        fullWidth
                        label="Litros a descontar"
                        type="number"
                        inputProps={{ step: '0.1', min: '0.1' }}
                        value={discountLiters}
                        onChange={(e) => setDiscountLiters(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDiscountDialog(null)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => discountDialog && discountMutation.mutate({ id: discountDialog.id, liters: Number(discountLiters) })}
                        disabled={!discountLiters || Number(discountLiters) <= 0 || discountMutation.isPending}
                    >
                        Descontar
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Eliminar Barril"
                message={`¿Está seguro de eliminar ${deleteConfirm?.name}?`}
                onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default BarrelsPage;
