import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Checkout and place order
 * 
 * OpenAPI: POST /checkout
 */
const createCheckoutSchema = z.object({
    body: z.object({
    address_id: z.string(),
    payment_method_id: z.string()
  }).describe('Request body')
  });

export const createCheckoutTool = {
  name: 'create-checkout',
  description: 'Checkout and place order',
  parameters: createCheckoutSchema,
  execute: async (args: z.infer<typeof createCheckoutSchema>) => {
    try {
      const response = await apiClient.post(`/checkout`, args.body);
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
