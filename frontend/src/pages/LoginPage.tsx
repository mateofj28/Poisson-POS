import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@heroui/react';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
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
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
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
        <div className={`min-h-screen flex relative overflow-hidden ${isDark ? 'bg-[#09090b]' : 'bg-white'}`}>
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px] ${isDark ? 'bg-blue-600/8' : 'bg-blue-400/10'}`}></div>
                <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? 'bg-purple-600/6' : 'bg-purple-300/10'}`}></div>
                <div className={`absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full blur-[80px] ${isDark ? 'bg-cyan-600/5' : 'bg-cyan-300/8'}`}></div>
            </div>

            {/* Left Panel - Branding (hidden on mobile) */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <span className="text-lg">🐟</span>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Poisson</span>
                    </div>
                </div>

                <div className="max-w-md">
                    <h1 className={`text-4xl font-bold leading-tight mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        Gestiona tu negocio de forma inteligente
                    </h1>
                    <p className={`text-base leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Control total de mesas, pedidos, inventario y ventas. Diseñado para licoreras, bares y gastrobares.
                    </p>

                    {/* Features */}
                    <div className="mt-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            </div>
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Dashboard en tiempo real</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            </div>
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Pagos mixtos y caja automatizada</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            </div>
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Inventario con alertas inteligentes</span>
                        </div>
                    </div>
                </div>

                <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>© 2026 Poisson POS — Todos los derechos reservados</p>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <span className="text-lg">🐟</span>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Poisson POS</span>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Iniciar sesión</h2>
                        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Ingresa tus credenciales para acceder al sistema</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Correo electrónico</label>
                            <div className="relative">
                                <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                                </div>
                                <input
                                    type="email"
                                    {...register('email')}
                                    placeholder="tu@email.com"
                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Contraseña</label>
                            <div className="relative">
                                <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}`}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password.message}</p>}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full cursor-pointer font-semibold text-sm mt-2"
                        >
                            Iniciar sesión
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                        <p className={`text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            Sistema protegido — Acceso solo para personal autorizado
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
