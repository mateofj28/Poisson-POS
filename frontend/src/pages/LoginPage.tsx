import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, Label, Input, FieldError } from '@heroui/react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated, setAuth } = useAuthStore();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const tokenResponse = await authService.login(data);
            localStorage.setItem('access_token', tokenResponse.access_token);
            const me = await authService.getMe();
            setAuth(tokenResponse.access_token, me);
            toast.success(`Bienvenido, ${me.first_name}!`);
            navigate('/dashboard');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Credenciales inválidas';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black p-4">
            <div className="w-full max-w-md rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center gap-2 pt-8 pb-2 px-8">
                    <span className="text-5xl">🐟</span>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Poisson POS</h1>
                    <p className="text-sm text-zinc-400">Sistema de Punto de Venta</p>
                </div>

                {/* Form */}
                <div className="px-8 pb-8 pt-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                        {/* Email */}
                        <TextField
                            isRequired
                            isInvalid={!!errors.email}
                            className="w-full"
                            name="email"
                            type="email"
                        >
                            <Label>Correo electrónico</Label>
                            <Input
                                placeholder="tu@email.com"
                                {...register('email')}
                            />
                            {errors.email && <FieldError>{errors.email.message}</FieldError>}
                        </TextField>

                        {/* Password */}
                        <TextField
                            isRequired
                            isInvalid={!!errors.password}
                            className="w-full"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                        >
                            <Label>Contraseña</Label>
                            <Input
                                placeholder="••••••••"
                                {...register('password')}
                            />
                            {errors.password && <FieldError>{errors.password.message}</FieldError>}
                        </TextField>

                        {/* Toggle password visibility */}
                        <button
                            type="button"
                            className="-mt-12 self-end mr-3 text-zinc-400 hover:text-white transition-colors z-10"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full mt-2"
                        >
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
