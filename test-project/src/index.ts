import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { apiKeyAuth } from './auth/api-key.js';

const server = new FastMCP({
  name: 'Test Project',
  version: '1.0.0',
  authenticate: apiKeyAuth,
});

// Start server
server.start({ transportType: 'stdio' });
