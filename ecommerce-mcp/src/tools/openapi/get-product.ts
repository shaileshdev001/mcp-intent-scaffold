import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Get product details by ID
 * 
 * OpenAPI: GET /products/{id}
 */
const getProductSchema = z.object({
    id: z.string().uuid()
  });

export const getProductTool = {
  name: 'get-product',
  description: 'Get product details by ID',
  parameters: getProductSchema,
  execute: async (args: z.infer<typeof getProductSchema>) => {
    try {
      const response = await apiClient.get(`/products/${args.id}`);
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
