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
    Tabs,
    Tab,
    Stack,
    Autocomplete,
    Alert,
} from '@mui/material';
import { Add, Inventory2, TrendingUp, TrendingDown, SwapVert, Warning, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service';
import { productService } from '../services/product.service';
import { MovementType, Product } from '../types';
import toast from 'react-hot-toast';

const movementTypeLabel: Record<MovementType, string> = {
    [MovementType.ENTRADA]: 'Entrada',
    [MovementType.SALIDA]: 'Salida',
    [MovementType.AJUSTE]: 'Ajuste',
    [MovementType.PERDIDA]: 'Pérdida',
    [MovementType.DESPERDICIO]: 'Desperdicio',
    [MovementType.VENTA]: 'Venta',
};

const movementTypeIcon: Record<MovementType, string> = {
    [MovementType.ENTRADA]: '📦',
    [MovementType.SALIDA]: '📤',
    [MovementType.AJUSTE]: '🔄',
    [MovementType.PERDIDA]: '⚠️',
    [MovementType.DESPERDICIO]: '🗑️',
    [MovementType.VENTA]: '🛒',
};

const movementTypeColor: Record<MovementType, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    [MovementType.ENTRADA]: 'success',
    [MovementType.SALIDA]: 'error',
    [MovementType.AJUSTE]: 'info',
    [MovementType.PERDIDA]: 'error',
    [MovementType.DESPERDICIO]: 'warning',
    [MovementType.VENTA]: 'default',
};

const movementSchema = z.object({
    product_id: z.number().min(1, 'Seleccione un producto'),
    movement_type: z.nativeEnum(MovementType),
    quantity: z.number().min(1, 'Debe ser al menos 1'),
    reason: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

const InventoryPage = () => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState(0);
    const [createDialog, setCreateDialog] = useState(false);

    const { data: movements, isLoading } = useQuery({
        queryKey: ['inventory-movements'],
        queryFn: () => inventoryService.getMovements({ limit: 50 }),
    });

    const { data: lowStock } = useQuery({
        queryKey: ['low-stock'],
        queryFn: () => inventoryService.getLowStock(),
    });

    const { data: products } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productService.getAll({ limit: 100 }),
    });

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<MovementForm>({
        resolver: zodResolver(movementSchema),
        defaultValues: { product_id: 0, movement_type: MovementType.ENTRADA, quantity: 1, reason: '' },
    });

    const watchProductId = watch('product_id');
    const watchMovementType = watch('movement_type');
    const selectedProduct = products?.items.find((p) => p.id === watchProductId);

    const createMutation = useMutation({
        mutationFn: (data: MovementForm) => inventoryService.createMovement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Movimiento registrado exitosamente');
            setCreateDialog(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const onSubmit = (data: MovementForm) => {
        createMutation.mutate(data);
    };

    const getMovementIcon = (type: MovementType) => {
        switch (type) {
            case MovementType.ENTRADA: return <TrendingUp fontSize="small" color="success" />;
            case MovementType.SALIDA: return <TrendingDown fontSize="small" color="error" />;
            case MovementType.AJUSTE: return <SwapVert fontSize="small" color="info" />;
            case MovementType.PERDIDA: return <Warning fontSize="small" color="error" />;
            case MovementType.DESPERDICIO: return <DeleteIcon fontSize="small" color="warning" />;
            default: return <Inventory2 fontSize="small" />;
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">Inventario</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
                    Nuevo Movimiento
                </Button>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Movimientos" />
                <Tab label={`Bajo Stock (${lowStock?.length || 0})`} />
            </Tabs>

            {tab === 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Stock Anterior</TableCell>
                                <TableCell align="right">Stock Nuevo</TableCell>
                                <TableCell>Razón</TableCell>
                                <TableCell>Fecha</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movements?.items.map((mov) => (
                                <TableRow key={mov.id}>
                                    <TableCell>{mov.product_name || `#${mov.product_id}`}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getMovementIcon(mov.movement_type)}
                                            label={movementTypeLabel[mov.movement_type]}
                                            size="small"
                                            color={movementTypeColor[mov.movement_type]}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight={600}>
                                            {mov.movement_type === MovementType.ENTRADA ? '+' : '-'}{mov.quantity}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{mov.previous_stock}</TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight={600} color={mov.new_stock <= 0 ? 'error.main' : 'text.primary'}>
                                            {mov.new_stock}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{mov.reason || '-'}</TableCell>
                                    <TableCell>{new Date(mov.created_at).toLocaleString('es-CO')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {tab === 1 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell align="right">Stock Actual</TableCell>
                                <TableCell align="right">Stock Mínimo</TableCell>
                                <TableCell>Estado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lowStock?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.category_name || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight={600} color={product.stock <= 0 ? 'error.main' : 'warning.main'}>
                                            {product.stock}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{product.min_stock}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={product.stock <= 0 ? 'Agotado' : 'Bajo Stock'}
                                            size="small"
                                            color={product.stock <= 0 ? 'error' : 'warning'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create Movement Dialog */}
            <Dialog open={createDialog} onClose={() => { setCreateDialog(false); reset(); }} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle sx={{ pb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Inventory2 sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={700}>Nuevo Movimiento de Inventario</Typography>
                        </Stack>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            {/* Product Search */}
                            <Controller
                                name="product_id"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        fullWidth
                                        openOnFocus
                                        options={products?.items || []}
                                        getOptionLabel={(option: Product) => `${option.name} (Stock: ${option.stock})`}
                                        value={products?.items.find((p) => p.id === field.value) || null}
                                        onChange={(_e, newValue) => field.onChange(newValue?.id || 0)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Buscar producto"
                                                placeholder="Escribe para buscar..."
                                                error={!!errors.product_id}
                                                helperText={errors.product_id?.message}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
                                                    <Typography>{option.name}</Typography>
                                                    <Chip
                                                        label={`Stock: ${option.stock}`}
                                                        size="small"
                                                        color={option.stock <= option.min_stock ? 'warning' : 'default'}
                                                        variant="outlined"
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Stack>
                                            </li>
                                        )}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        noOptionsText="No se encontraron productos"
                                        filterOptions={(options, { inputValue }) => {
                                            if (!inputValue) return options;
                                            const lower = inputValue.toLowerCase();
                                            return options.filter((o) => o.name.toLowerCase().includes(lower));
                                        }}
                                    />
                                )}
                            />

                            {/* Selected Product Info */}
                            {selectedProduct && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderColor: selectedProduct.stock <= selectedProduct.min_stock ? 'warning.main' : 'divider',
                                        background: selectedProduct.stock <= selectedProduct.min_stock
                                            ? 'rgba(255, 214, 10, 0.04)'
                                            : 'rgba(10, 132, 255, 0.04)',
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Producto seleccionado</Typography>
                                            <Typography variant="subtitle1" fontWeight={600}>{selectedProduct.name}</Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="body2" color="text.secondary">Stock actual</Typography>
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                color={selectedProduct.stock <= selectedProduct.min_stock ? 'warning.main' : 'success.main'}
                                            >
                                                {selectedProduct.stock}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            )}

                            {/* Type and Quantity */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Controller
                                    name="movement_type"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo de Movimiento</InputLabel>
                                            <Select {...field} label="Tipo de Movimiento">
                                                {Object.values(MovementType).filter((t) => t !== MovementType.VENTA).map((t) => (
                                                    <MenuItem key={t} value={t}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography>{movementTypeIcon[t]}</Typography>
                                                            <Typography>{movementTypeLabel[t]}</Typography>
                                                        </Stack>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                                <TextField
                                    fullWidth
                                    label="Cantidad"
                                    type="number"
                                    {...register('quantity', { valueAsNumber: true })}
                                    error={!!errors.quantity}
                                    helperText={errors.quantity?.message}
                                    slotProps={{ htmlInput: { min: 1 } }}
                                />
                            </Stack>

                            {/* Info alert based on type */}
                            {watchMovementType && watchMovementType !== MovementType.ENTRADA && selectedProduct && (
                                <Alert
                                    severity={watchMovementType === MovementType.AJUSTE ? 'info' : 'warning'}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {watchMovementType === MovementType.SALIDA && 'Se restará del stock actual del producto.'}
                                    {watchMovementType === MovementType.PERDIDA && 'Se registrará como pérdida y se restará del stock.'}
                                    {watchMovementType === MovementType.DESPERDICIO && 'Se registrará como desperdicio y se restará del stock.'}
                                    {watchMovementType === MovementType.AJUSTE && 'Se ajustará el stock del producto.'}
                                </Alert>
                            )}

                            {/* Reason */}
                            <TextField
                                fullWidth
                                label="Razón del movimiento"
                                multiline
                                rows={3}
                                {...register('reason')}
                                placeholder="Describe el motivo del movimiento..."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => { setCreateDialog(false); reset(); }}>Cancelar</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createMutation.isPending}
                            startIcon={<Inventory2 />}
                        >
                            {createMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default InventoryPage;
