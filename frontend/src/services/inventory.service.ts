import api from './api';
import {
    InventoryMovement,
    InventoryMovementCreate,
    InventoryMovementListResponse,
    LowStockProduct,
    MovementType,
} from '../types';

export const inventoryService = {
    getMovements: async (params?: {
        skip?: number;
        limit?: number;
        product_id?: number;
        movement_type?: MovementType;
    }): Promise<InventoryMovementListResponse> => {
        const response = await api.get<InventoryMovementListResponse>('/inventory', { params });
        return response.data;
    },

    createMovement: async (data: InventoryMovementCreate): Promise<InventoryMovement> => {
        const response = await api.post<InventoryMovement>('/inventory', data);
        return response.data;
    },

    getLowStock: async (): Promise<LowStockProduct[]> => {
        const response = await api.get<LowStockProduct[]>('/inventory/low-stock');
        return response.data;
    },
};
