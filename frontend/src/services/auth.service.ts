import api from './api';
import { LoginRequest, TokenResponse, MeResponse } from '../types';

export const authService = {
    login: async (data: LoginRequest): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/login', data);
        return response.data;
    },

    getMe: async (): Promise<MeResponse> => {
        const response = await api.get<MeResponse>('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
    },
};
