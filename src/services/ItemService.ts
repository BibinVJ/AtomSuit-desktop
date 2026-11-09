
import api from './api';

import { Item, ItemApiResponse } from '../types';

export const getItems = async (page = 1, limit = 10, sortCol = 'created_at', sortDir = 'desc', unpaginated = false): Promise<ItemApiResponse> => {
  const url = unpaginated ? '/item?unpaginated=1' : `/item?perPage=${limit}&page=${page}&sort_by=${sortCol}&sort_direction=${sortDir}`;
  const response = await api.get(url);
  return response.data;
};

export const getItem = async (id: string): Promise<Item> => {
    const response = await api.get(`/item/${id}`);
    return response.data.data;
};

export const addItem = async (item: { sku: string; name: string; category_id: string; unit_id: string; description: string; type: string; }) => {
    const response = await api.post('/item', item);
    return response.data;
};

export const updateItem = async (id: number, item: { sku: string; name: string; category_id: string; unit_id: string; description: string; type: string; }) => {
    const response = await api.put(`/item/${id}`, item);
    return response.data;
};

export const deleteItem = async (id: number) => {
    const response = await api.delete(`/item/${id}`);
    return response.data;
};
