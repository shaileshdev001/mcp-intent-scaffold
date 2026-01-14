import type { IncomingMessage } from 'http';

/**
 * API Key Authentication Middleware
 * 
 * This function validates API keys from the x-api-key header.
 * The API key should be set in your .env file as API_KEY.
 */
export async function apiKeyAuth(request: IncomingMessage) {
  const apiKey = request.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new Response(null, {
      status: 401,
      statusText: 'Unauthorized - Invalid API Key',
    });
  }
  
  // Return authentication context
  // This will be available in tools as context.session
  return {
    authenticated: true,
    apiKey: apiKey,
  };
}
