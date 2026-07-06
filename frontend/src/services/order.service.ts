import api from './api';
import { Order, OrderCreate, OrderUpdate, OrderAddItem, OrderListResponse, OrderStatus } from '../types';

export const orderService = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
        table_id?: number;
        status?: OrderStatus;
        today_only?: boolean;
    }): Promise<OrderListResponse> => {
        const response = await api.get<OrderListResponse>('/orders', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Order> => {
        const response = await api.get<Order>(`/orders/${id}`);
        return response.data;
    },

    create: async (data: OrderCreate): Promise<Order> => {
        const response = await api.post<Order>('/orders', data);
        return response.data;
    },

    update: async (id: number, data: OrderUpdate): Promise<Order> => {
        const response = await api.put<Order>(`/orders/${id}`, data);
        return response.data;
    },

    addItems: async (id: number, data: OrderAddItem): Promise<Order> => {
        const response = await api.post<Order>(`/orders/${id}/items`, data);
        return response.data;
    },

    removeItem: async (orderId: number, itemId: number): Promise<Order> => {
        const response = await api.delete<Order>(`/orders/${orderId}/items/${itemId}`);
        return response.data;
    },
};
