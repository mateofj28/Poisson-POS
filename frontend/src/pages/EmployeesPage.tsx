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
    InputAdornment,
    Grid,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeeService } from '../services/employee.service';
import { Employee, RoleEnum } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const employeeSchema = z.object({
    first_name: z.string().min(2, 'Mínimo 2 caracteres'),
    last_name: z.string().min(2, 'Mínimo 2 caracteres'),
    document: z.string().min(5, 'Mínimo 5 caracteres'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido'),
    role: z.nativeEnum(RoleEnum),
    password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

const roleLabels: Record<RoleEnum, string> = {
    [RoleEnum.ADMIN]: 'Administrador',
    [RoleEnum.CAJERO]: 'Cajero',
    [RoleEnum.MESERO]: 'Mesero',
    [RoleEnum.BARTENDER]: 'Bartender',
};

const EmployeesPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['employees', search],
        queryFn: () => employeeService.getAll({ search: search || undefined, limit: 100 }),
    });

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeForm>({
        resolver: zodResolver(employeeSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: EmployeeForm) => {
            const payload = { ...data, password: data.password || '' };
            return employeeService.create(payload as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Empleado creado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: EmployeeForm }) => {
            const payload: any = { ...data };
            if (!payload.password) delete payload.password;
            return employeeService.update(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Empleado actualizado');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => employeeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Empleado eliminado');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset({ first_name: '', last_name: '', document: '', phone: '', email: '', role: RoleEnum.MESERO, password: '' });
        setOpenForm(true);
    };

    const handleOpenEdit = (emp: Employee) => {
        setEditing(emp);
        reset({ first_name: emp.first_name, last_name: emp.last_name, document: emp.document, phone: emp.phone || '', email: emp.email, role: emp.role, password: '' });
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditing(null);
    };

    const onSubmit = (formData: EmployeeForm) => {
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
                <Typography variant="h4">Empleados</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                    />
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                        Nuevo
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Documento</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.items.map((emp) => (
                            <TableRow key={emp.id}>
                                <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                                <TableCell>{emp.document}</TableCell>
                                <TableCell>{emp.email}</TableCell>
                                <TableCell><Chip label={roleLabels[emp.role]} size="small" /></TableCell>
                                <TableCell>
                                    <Chip label={emp.is_active ? 'Activo' : 'Inactivo'} size="small" color={emp.is_active ? 'success' : 'default'} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenEdit(emp)}><Edit /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(emp)}><Delete /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Form Dialog */}
            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Nombre" {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Apellido" {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Documento" {...register('document')} error={!!errors.document} helperText={errors.document?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Teléfono" {...register('phone')} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <Controller
                                    name="role"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>Rol</InputLabel>
                                            <Select {...field} label="Rol">
                                                {Object.values(RoleEnum).map((r) => (
                                                    <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'} type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
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
                title="Eliminar Empleado"
                message={`¿Está seguro de eliminar a ${deleteConfirm?.first_name} ${deleteConfirm?.last_name}?`}
                onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default EmployeesPage;
