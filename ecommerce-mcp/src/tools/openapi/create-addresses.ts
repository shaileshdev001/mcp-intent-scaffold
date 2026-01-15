import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Add a new address
 * 
 * OpenAPI: POST /addresses
 */
const createAddressesSchema = z.object({
    body: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  }).describe('Request body')
  });

export const createAddressesTool = {
  name: 'create-addresses',
  description: 'Add a new address',
  parameters: createAddressesSchema,
  execute: async (args: z.infer<typeof createAddressesSchema>) => {
    try {
      const response = await apiClient.post(`/addresses`, args.body);
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
