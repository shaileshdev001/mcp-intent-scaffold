import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Get your saved addresses
 * 
 * OpenAPI: GET /addresses
 */
const listAddressesSchema = z.object({});

export const listAddressesTool = {
  name: 'list-addresses',
  description: 'Get your saved addresses',
  parameters: listAddressesSchema,
  execute: async (args: z.infer<typeof listAddressesSchema>) => {
    try {
      const response = await apiClient.get(`/addresses`);
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
