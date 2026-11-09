
import api from './api';

import { CustomerApiResponse } from '../types';

export const getCustomers = async (page = 1, limit = 10, sortCol = 'created_at', sortDir = 'desc', unpaginated = false): Promise<CustomerApiResponse> => {
  const url = unpaginated ? '/customer?unpaginated=1' : `/customer?perPage=${limit}&page=${page}&sort_by=${sortCol}&sort_direction=${sortDir}`;
  const response = await api.get(url);
  return response.data;
};

export const addCustomer = async (customer: { name: string; email: string; phone: string; address: string; }) => {
    const response = await api.post('/customer', customer);
    return response.data;
};

export const updateCustomer = async (id: number, customer: { name: string; email: string; phone: string; address: string; }) => {
    const response = await api.put(`/customer/${id}`, customer);
    return response.data;
};

export const deleteCustomer = async (id: number) => {
    const response = await api.delete(`/customer/${id}`);
    return response.data;
};
