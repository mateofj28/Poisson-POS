import api from './api';
import { Employee, EmployeeCreate, EmployeeUpdate, EmployeeListResponse } from '../types';

export const employeeService = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
        search?: string;
        role?: string;
        is_active?: boolean;
    }): Promise<EmployeeListResponse> => {
        const response = await api.get<EmployeeListResponse>('/employees', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Employee> => {
        const response = await api.get<Employee>(`/employees/${id}`);
        return response.data;
    },

    create: async (data: EmployeeCreate): Promise<Employee> => {
        const response = await api.post<Employee>('/employees', data);
        return response.data;
    },

    update: async (id: number, data: EmployeeUpdate): Promise<Employee> => {
        const response = await api.put<Employee>(`/employees/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/employees/${id}`);
    },
};
