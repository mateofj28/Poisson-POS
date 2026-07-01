import api from './api';
import { Barrel, BarrelCreate, BarrelUpdate, BarrelListResponse, BarrelShotRequest } from '../types';

export const barrelService = {
    getAll: async (is_active?: boolean): Promise<BarrelListResponse> => {
        const params = is_active !== undefined ? { is_active } : {};
        const response = await api.get<BarrelListResponse>('/barrels', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Barrel> => {
        const response = await api.get<Barrel>(`/barrels/${id}`);
        return response.data;
    },

    create: async (data: BarrelCreate): Promise<Barrel> => {
        const response = await api.post<Barrel>('/barrels', data);
        return response.data;
    },

    update: async (id: number, data: BarrelUpdate): Promise<Barrel> => {
        const response = await api.put<Barrel>(`/barrels/${id}`, data);
        return response.data;
    },

    addShot: async (id: number, shots: number = 1): Promise<Barrel> => {
        const response = await api.post<Barrel>(`/barrels/${id}/shot`, { shots });
        return response.data;
    },

    resetShots: async (id: number): Promise<Barrel> => {
        const response = await api.post<Barrel>(`/barrels/${id}/reset`);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/barrels/${id}`);
    },
};
