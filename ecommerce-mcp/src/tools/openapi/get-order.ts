import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Get order details
 * 
 * OpenAPI: GET /orders/{orderId}
 */
const getOrderSchema = z.object({
    orderId: z.string().uuid()
  });

export const getOrderTool = {
  name: 'get-order',
  description: 'Get order details',
  parameters: getOrderSchema,
  execute: async (args: z.infer<typeof getOrderSchema>) => {
    try {
      const response = await apiClient.get(`/orders/${args.orderId}`);
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
