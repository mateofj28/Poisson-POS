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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Grid,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { Product } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const productSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    category_id: z.number().min(1, 'Seleccione una categoría'),
    sale_price: z.number().min(0.01, 'Debe ser mayor a 0'),
    stock: z.number().min(0).optional(),
    min_stock: z.number().min(0).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const ProductsPage = () => {
    const queryClient = useQueryClient();
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['products', categoryFilter],
        queryFn: () => productService.getAll({ limit: 100, category_id: categoryFilter || undefined }),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
    });

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProductForm>({
        resolver: zodResolver(productSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: ProductForm) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProductForm }) => productService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto actualizado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto eliminado');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset({ name: '', category_id: 0, sale_price: 0, stock: 0, min_stock: 5 });
        setOpenForm(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditing(product);
        reset({ name: product.name, category_id: product.category_id, sale_price: product.sale_price, stock: product.stock, min_stock: product.min_stock });
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditing(null);
    };

    const onSubmit = (formData: ProductForm) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">Productos</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as number | '')} label="Categoría">
                            <MenuItem value="">Todas</MenuItem>
                            {categories?.items.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Nuevo</Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell align="right">Precio</TableCell>
                            <TableCell align="right">Stock</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.items.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.category_name || '-'}</TableCell>
                                <TableCell align="right">${product.sale_price.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={product.stock}
                                        size="small"
                                        color={product.stock <= 0 ? 'error' : product.stock <= product.min_stock ? 'warning' : 'success'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip label={product.is_active ? 'Activo' : 'Inactivo'} size="small" color={product.is_active ? 'success' : 'default'} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenEdit(product)}><Edit /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(product)}><Delete /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nombre" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <Controller
                                    name="category_id"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.category_id}>
                                            <InputLabel>Categoría</InputLabel>
                                            <Select {...field} label="Categoría">
                                                {categories?.items.map((cat) => (
                                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Precio de venta" type="number" inputProps={{ step: '0.01' }} {...register('sale_price', { valueAsNumber: true })} error={!!errors.sale_price} helperText={errors.sale_price?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Stock" type="number" {...register('stock', { valueAsNumber: true })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Stock mínimo" type="number" {...register('min_stock', { valueAsNumber: true })} />
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

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Eliminar Producto"
                message={`¿Está seguro de eliminar ${deleteConfirm?.name}?`}
                onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default ProductsPage;
