import { FastMCP } from 'fastmcp';
import { z } from 'zod';

import { createAuthRegisterTool } from './tools/openapi/create-auth-register.js';
import { createAuthLoginTool } from './tools/openapi/create-auth-login.js';
import { listProductsTool } from './tools/openapi/list-products.js';
import { getProductTool } from './tools/openapi/get-product.js';
import { listCartTool } from './tools/openapi/list-cart.js';
import { createCartItemsTool } from './tools/openapi/create-cart-items.js';
import { createCheckoutTool } from './tools/openapi/create-checkout.js';
import { listOrdersTool } from './tools/openapi/list-orders.js';
import { getOrderTool } from './tools/openapi/get-order.js';
import { listAddressesTool } from './tools/openapi/list-addresses.js';
import { createAddressesTool } from './tools/openapi/create-addresses.js';

const server = new FastMCP({
  name: 'E-commerce API',
  version: '1.0.0',
});

// Register OpenAPI-generated tools
server.addTool(createAuthRegisterTool);
server.addTool(createAuthLoginTool);
server.addTool(listProductsTool);
server.addTool(getProductTool);
server.addTool(listCartTool);
server.addTool(createCartItemsTool);
server.addTool(createCheckoutTool);
server.addTool(listOrdersTool);
server.addTool(getOrderTool);
server.addTool(listAddressesTool);
server.addTool(createAddressesTool);

// Start server
server.start({ transportType: 'stdio' });
