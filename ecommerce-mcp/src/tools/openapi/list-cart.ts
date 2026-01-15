import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Get current user's cart
 * 
 * OpenAPI: GET /cart
 */
const listCartSchema = z.object({});

export const listCartTool = {
  name: 'list-cart',
  description: 'Get current user\'s cart',
  parameters: listCartSchema,
  execute: async (args: z.infer<typeof listCartSchema>) => {
    try {
      const response = await apiClient.get(`/cart`);
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
