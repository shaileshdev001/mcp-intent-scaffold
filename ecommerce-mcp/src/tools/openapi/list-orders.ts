import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * List your past orders
 * 
 * OpenAPI: GET /orders
 */
const listOrdersSchema = z.object({});

export const listOrdersTool = {
  name: 'list-orders',
  description: 'List your past orders',
  parameters: listOrdersSchema,
  execute: async (args: z.infer<typeof listOrdersSchema>) => {
    try {
      const response = await apiClient.get(`/orders`);
      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      if (error.response) {
        return JSON.stringify({
          error: true,
          status: error.response.status,
          message: error.response.data?.message || 'API error',
        }, null, 2);
      }
      throw error;
    }
  },
};
