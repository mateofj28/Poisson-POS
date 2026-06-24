import api from './api';
import { CashRegister, CashRegisterOpen, CashRegisterClose, CashRegisterListResponse } from '../types';

export const cashRegisterService = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
        is_open?: boolean;
    }): Promise<CashRegisterListResponse> => {
        const response = await api.get<CashRegisterListResponse>('/cash-register', { params });
        return response.data;
    },

    getActive: async (): Promise<CashRegister | null> => {
        const response = await api.get<CashRegister | null>('/cash-register/active');
        return response.data;
    },

    getById: async (id: number): Promise<CashRegister> => {
        const response = await api.get<CashRegister>(`/cash-register/${id}`);
        return response.data;
    },

    open: async (data: CashRegisterOpen): Promise<CashRegister> => {
        const response = await api.post<CashRegister>('/cash-register/open', data);
        return response.data;
    },

    close: async (id: number, data: CashRegisterClose): Promise<CashRegister> => {
        const response = await api.post<CashRegister>(`/cash-register/${id}/close`, data);
        return response.data;
    },
};
