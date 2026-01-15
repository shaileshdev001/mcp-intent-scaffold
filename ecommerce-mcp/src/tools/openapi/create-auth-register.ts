import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Create a new user account
 * 
 * OpenAPI: POST /auth/register
 */
const createAuthRegisterSchema = z.object({
    body: z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string().optional()
  }).describe('Request body')
  });

export const createAuthRegisterTool = {
  name: 'create-auth-register',
  description: 'Create a new user account',
  parameters: createAuthRegisterSchema,
  execute: async (args: z.infer<typeof createAuthRegisterSchema>) => {
    try {
      const response = await apiClient.post(`/auth/register`, args.body);
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
