import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { LoginRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useAuth = () => {
    const { token, employee, isAuthenticated, setAuth, setEmployee, logout: storeLogout } = useAuthStore();
    const navigate = useNavigate();

    const login = async (data: LoginRequest) => {
        try {
            const response = await authService.login(data);
            const me = await authService.getMe();
            setAuth(response.access_token, me);
            toast.success(`Bienvenido, ${me.first_name}!`);
            navigate('/dashboard');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Error al iniciar sesión';
            toast.error(msg);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        storeLogout();
        navigate('/login');
        toast.success('Sesión cerrada');
    };

    const fetchMe = async () => {
        try {
            const me = await authService.getMe();
            setEmployee(me);
        } catch {
            storeLogout();
        }
    };

    return { token, employee, isAuthenticated, login, logout, fetchMe };
};
