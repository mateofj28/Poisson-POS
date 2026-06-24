import api from './api';
import { Table, TableCreate, TableUpdate, TableListResponse, TableOpenRequest, TableStatus } from '../types';

export const tableService = {
    getAll: async (status?: TableStatus): Promise<TableListResponse> => {
        const params = status ? { status } : {};
        const response = await api.get<TableListResponse>('/tables', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Table> => {
        const response = await api.get<Table>(`/tables/${id}`);
        return response.data;
    },

    create: async (data: TableCreate): Promise<Table> => {
        const response = await api.post<Table>('/tables', data);
        return response.data;
    },

    update: async (id: number, data: TableUpdate): Promise<Table> => {
        const response = await api.put<Table>(`/tables/${id}`, data);
        return response.data;
    },

    open: async (id: number, data: TableOpenRequest): Promise<Table> => {
        const response = await api.post<Table>(`/tables/${id}/open`, data);
        return response.data;
    },

    close: async (id: number): Promise<Table> => {
        const response = await api.post<Table>(`/tables/${id}/close`);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tables/${id}`);
    },
};
