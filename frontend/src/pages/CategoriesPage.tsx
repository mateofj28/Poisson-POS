import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoryService } from '../services/category.service';
import { Category } from '../types';
import { useThemeStore } from '../store/theme.store';
import toast from 'react-hot-toast';

const categorySchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

const CategoriesPage = () => {
    const queryClient = useQueryClient();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>({
        resolver: zodResolver(categorySchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: CategoryForm) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categoría creada');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: CategoryForm }) => categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categoría actualizada');
            handleCloseForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categoría eliminada');
            setDeleteConfirm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error'),
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset({ name: '', description: '' });
        setOpenForm(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditing(cat);
        reset({ name: cat.name, description: cat.description || '' });
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditing(null);
    };

    const onSubmit = (formData: CategoryForm) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Categorías</h1>
                <Button color="primary" className="cursor-pointer font-medium" onPress={handleOpenCreate}>
                    + Nueva
                </Button>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <table className="w-full min-w-[500px]">
                    <thead className={isDark ? 'bg-zinc-900' : 'bg-zinc-50'}>
                        <tr>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre</th>
                            <th className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Descripción</th>
                            <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {data?.items.map((cat) => (
                            <tr key={cat.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                                <td className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{cat.name}</td>
                                <td className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{cat.description || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleOpenEdit(cat)}
                                            className={`cursor-pointer p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(cat)}
                                            className="cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!data?.items || data.items.length === 0) && (
                            <tr><td colSpan={3} className={`px-4 py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No hay categorías</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {openForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={handleCloseForm}>
                    <div className={`rounded-3xl border w-full max-w-md mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">{editing ? '✏️' : '📂'}</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {editing ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {editing ? 'Modifica los datos de la categoría' : 'Agrega una nueva categoría de productos'}
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nombre</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder="Nombre de la categoría"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Descripción</label>
                                <textarea
                                    {...register('description')}
                                    rows={3}
                                    placeholder="Descripción opcional..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none ${isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={handleCloseForm}>Cancelar</Button>
                                <Button size="lg" color="primary" className="flex-1 cursor-pointer font-semibold" type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                                    {editing ? 'Actualizar' : 'Crear'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
                    <div className={`rounded-3xl border w-full max-w-sm mx-4 p-8 shadow-2xl ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <h2 className={`text-xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Eliminar Categoría</h2>
                        <p className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            ¿Está seguro de eliminar <span className="font-semibold">{deleteConfirm.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <Button size="lg" variant="flat" className="flex-1 cursor-pointer" onPress={() => setDeleteConfirm(null)}>Cancelar</Button>
                            <Button size="lg" color="danger" className="flex-1 cursor-pointer font-semibold" isLoading={deleteMutation.isPending} onPress={() => deleteMutation.mutate(deleteConfirm.id)}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
