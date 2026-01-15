import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * List all products with filters
 * 
 * OpenAPI: GET /products
 */
const listProductsSchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    min_price: z.number().optional(),
    max_price: z.number().optional()
  });

export const listProductsTool = {
  name: 'list-products',
  description: 'List all products with filters',
  parameters: listProductsSchema,
  execute: async (args: z.infer<typeof listProductsSchema>) => {
    try {
      const response = await apiClient.get(`/products`);
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
