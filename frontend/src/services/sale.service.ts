import api from './api';
import { Sale, SaleCreate, SaleListResponse } from '../types';

export const saleService = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
        employee_id?: number;
    }): Promise<SaleListResponse> => {
        const response = await api.get<SaleListResponse>('/sales', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Sale> => {
        const response = await api.get<Sale>(`/sales/${id}`);
        return response.data;
    },

    create: async (data: SaleCreate): Promise<Sale> => {
        const response = await api.post<Sale>('/sales', data);
        return response.data;
    },
};
