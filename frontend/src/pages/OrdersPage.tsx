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
    Autocomplete,
    Stack,
} from '@mui/material';
import { Add, Delete, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { tableService } from '../services/table.service';
import { productService } from '../services/product.service';
import { Order, OrderStatus, OrderItemCreate, TableStatus, Product } from '../types';
import toast from 'react-hot-toast';

const statusLabel: Record<OrderStatus, string> = {
    [OrderStatus.PENDIENTE]: 'Pendiente',
    [OrderStatus.EN_PREPARACION]: 'En Preparación',
    [OrderStatus.LISTO]: 'Listo',
    [OrderStatus.ENTREGADO]: 'Entregado',
    [OrderStatus.CANCELADO]: 'Cancelado',
};

const statusColor: Record<OrderStatus, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
    [OrderStatus.PENDIENTE]: 'warning',
    [OrderStatus.EN_PREPARACION]: 'info',
    [OrderStatus.LISTO]: 'success',
    [OrderStatus.ENTREGADO]: 'default',
    [OrderStatus.CANCELADO]: 'error',
};

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [createDialog, setCreateDialog] = useState(false);
    const [detailDialog, setDetailDialog] = useState<Order | null>(null);
    const [selectedTable, setSelectedTable] = useState<number>(0);
    const [orderItems, setOrderItems] = useState<OrderItemCreate[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number>(0);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['orders', statusFilter],
        queryFn: () => orderService.getAll({ limit: 50, status: statusFilter || undefined }),
    });

    const { data: tables } = useQuery({
        queryKey: ['tables-occupied'],
        queryFn: () => tableService.getAll(),
    });

    const { data: products } = useQuery({
        queryKey: ['products-active'],
        queryFn: () => productService.getAll({ limit: 100, is_active: true }),
    });

    const createMutation = useMutation({
        mutationFn: () => orderService.create({ table_id: selectedTable, items: orderItems, notes: notes || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            toast.success('Pedido creado');
            handleCloseCreate();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear pedido'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => orderService.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Estado actualizado');
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleCloseCreate = () => {
        setCreateDialog(false);
        setSelectedTable(0);
        setOrderItems([]);
        setSelectedProduct(0);
        setQuantity(1);
        setNotes('');
    };

    const handleAddItem = () => {
        if (!selectedProduct || quantity < 1) return;
        const existing = orderItems.find((i) => i.product_id === selectedProduct);
        if (existing) {
            setOrderItems(orderItems.map((i) => i.product_id === selectedProduct ? { ...i, quantity: i.quantity + quantity } : i));
        } else {
            setOrderItems([...orderItems, { product_id: selectedProduct, quantity }]);
        }
        setSelectedProduct(0);
        setQuantity(1);
    };

    const handleRemoveItem = (productId: number) => {
        setOrderItems(orderItems.filter((i) => i.product_id !== productId));
    };

    const getProductName = (productId: number) => {
        return products?.items.find((p) => p.id === productId)?.name || `Producto #${productId}`;
    };

    const occupiedTables = tables?.items.filter((t) => t.status === TableStatus.OCUPADA) || [];

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">Pedidos</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')} label="Estado">
                            <MenuItem value="">Todos</MenuItem>
                            {Object.values(OrderStatus).map((s) => (
                                <MenuItem key={s} value={s}>{statusLabel[s]}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
                        Nuevo Pedido
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Mesa</TableCell>
                            <TableCell>Empleado</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.items.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>Mesa {order.table_number}</TableCell>
                                <TableCell>{order.employee_name || '-'}</TableCell>
                                <TableCell>
                                    <FormControl size="small" sx={{ minWidth: 130 }}>
                                        <Select
                                            value={order.status}
                                            onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value as OrderStatus })}
                                            size="small"
                                        >
                                            {Object.values(OrderStatus).map((s) => (
                                                <MenuItem key={s} value={s}>{statusLabel[s]}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell align="right">${order.total.toLocaleString()}</TableCell>
                                <TableCell>{new Date(order.order_date).toLocaleString('es-CO')}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => setDetailDialog(order)}>
                                        <Visibility />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Order Dialog */}
            <Dialog open={createDialog} onClose={handleCloseCreate} maxWidth="md" fullWidth>
                <DialogTitle>Nuevo Pedido</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Mesa</InputLabel>
                                <Select value={selectedTable} onChange={(e) => setSelectedTable(Number(e.target.value))} label="Mesa">
                                    {occupiedTables.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>Mesa {t.number} - {t.waiter_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </Stack>

                        <Divider />
                        <Typography variant="subtitle1" fontWeight="bold">Agregar productos</Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                            <Autocomplete
                                fullWidth
                                openOnFocus
                                options={products?.items || []}
                                filterOptions={(options, { inputValue }) => {
                                    if (!inputValue) return options;
                                    const lower = inputValue.toLowerCase();
                                    return options.filter((o) => o.name.toLowerCase().includes(lower));
                                }}
                                getOptionLabel={(option: Product) => `${option.name} - $${option.sale_price.toLocaleString()}`}
                                value={products?.items.find((p) => p.id === selectedProduct) || null}
                                onChange={(_e, newValue) => setSelectedProduct(newValue?.id || 0)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Buscar producto" size="small" placeholder="Escribe para buscar..." />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                noOptionsText="No se encontraron productos"
                                sx={{ flexGrow: 1 }}
                            />
                            <TextField
                                label="Cantidad"
                                type="number"
                                size="small"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                slotProps={{ htmlInput: { min: 1 } }}
                                sx={{ width: { xs: '100%', sm: 120 } }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddItem}
                                disabled={!selectedProduct}
                                sx={{ minWidth: 100, height: 40 }}
                            >
                                Agregar
                            </Button>
                        </Stack>

                        {orderItems.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 1 }}>
                                <List dense>
                                    {orderItems.map((item) => {
                                        const product = products?.items.find((p) => p.id === item.product_id);
                                        const subtotal = (product?.sale_price || 0) * item.quantity;
                                        return (
                                            <ListItem key={item.product_id}>
                                                <ListItemText
                                                    primary={getProductName(item.product_id)}
                                                    secondary={`${item.quantity} x $${(product?.sale_price || 0).toLocaleString()} = $${subtotal.toLocaleString()}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" size="small" onClick={() => handleRemoveItem(item.product_id)}>
                                                        <Delete color="error" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Total estimado: ${orderItems.reduce((acc, item) => {
                                            const product = products?.items.find((p) => p.id === item.product_id);
                                            return acc + (product?.sale_price || 0) * item.quantity;
                                        }, 0).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreate}>Cancelar</Button>
                    <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!selectedTable || orderItems.length === 0 || createMutation.isPending}>
                        Crear Pedido
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Pedido #{detailDialog?.id}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">Mesa: {detailDialog?.table_number}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Empleado: {detailDialog?.employee_name}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                        {detailDialog?.items.map((item) => (
                            <ListItem key={item.id}>
                                <ListItemText
                                    primary={item.product_name}
                                    secondary={`${item.quantity} x $${item.unit_price.toLocaleString()}`}
                                />
                                <Typography variant="body2">${item.subtotal.toLocaleString()}</Typography>
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total</Typography>
                        <Typography variant="h6">${detailDialog?.total.toLocaleString()}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialog(null)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrdersPage;
