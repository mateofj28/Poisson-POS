import api from './api';
import { Category, CategoryCreate, CategoryUpdate, CategoryListResponse } from '../types';

export const categoryService = {
    getAll: async (): Promise<CategoryListResponse> => {
        const response = await api.get<CategoryListResponse>('/categories');
        return response.data;
    },

    getById: async (id: number): Promise<Category> => {
        const response = await api.get<Category>(`/categories/${id}`);
        return response.data;
    },

    create: async (data: CategoryCreate): Promise<Category> => {
        const response = await api.post<Category>('/categories', data);
        return response.data;
    },

    update: async (id: number, data: CategoryUpdate): Promise<Category> => {
        const response = await api.put<Category>(`/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },
};
