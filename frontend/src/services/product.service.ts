import api from './api';
import { Product, ProductCreate, ProductUpdate, ProductListResponse } from '../types';

export const productService = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
        category_id?: number;
        is_active?: boolean;
    }): Promise<ProductListResponse> => {
        const response = await api.get<ProductListResponse>('/products', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    create: async (data: ProductCreate): Promise<Product> => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    update: async (id: number, data: ProductUpdate): Promise<Product> => {
        const response = await api.put<Product>(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};
