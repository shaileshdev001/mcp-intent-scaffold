import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const server = new FastMCP({
  name: 'Test Fastmcp Server',
  version: '1.0.0',
  authenticate: async (request) => {
    const apiKey = request.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new Response(null, {
        status: 401,
        statusText: 'Unauthorized - Invalid API Key',
      });
    }
    
    return { authenticated: true, apiKey };
  },
});

// Import example tools
import { echoTool } from './tools/echo';

// Register example tools
server.addTool(echoTool);

// Start server
server.start({ transportType: 'stdio' });
