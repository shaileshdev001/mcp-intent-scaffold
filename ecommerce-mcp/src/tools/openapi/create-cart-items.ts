import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Add item to cart
 * 
 * OpenAPI: POST /cart/items
 */
const createCartItemsSchema = z.object({
    body: z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1)
  }).describe('Request body')
  });

export const createCartItemsTool = {
  name: 'create-cart-items',
  description: 'Add item to cart',
  parameters: createCartItemsSchema,
  execute: async (args: z.infer<typeof createCartItemsSchema>) => {
    try {
      const response = await apiClient.post(`/cart/items`, args.body);
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
