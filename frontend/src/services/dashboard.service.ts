import api from './api';
import { DashboardResponse } from '../types';

export const dashboardService = {
    getDashboard: async (): Promise<DashboardResponse> => {
        const response = await api.get<DashboardResponse>('/dashboard');
        return response.data;
    },
};
