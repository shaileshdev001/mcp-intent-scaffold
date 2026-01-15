import { z } from 'zod';
import { apiClient } from '../../api/client.js';

/**
 * Login and get access token
 * 
 * OpenAPI: POST /auth/login
 */
const createAuthLoginSchema = z.object({
    body: z.object({
    email: z.string(),
    password: z.string()
  }).describe('Request body')
  });

export const createAuthLoginTool = {
  name: 'create-auth-login',
  description: 'Login and get access token',
  parameters: createAuthLoginSchema,
  execute: async (args: z.infer<typeof createAuthLoginSchema>) => {
    try {
      const response = await apiClient.post(`/auth/login`, args.body);
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
