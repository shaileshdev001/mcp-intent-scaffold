# E-commerce API

This is an e-commerce API spec for a storefront. 
It includes authentication, product browsing, cart, and checkout operations.
Auth is token-based. Explore, test, and mock this API freely.


**Version:** 1.0.0  
**Generated Tools:** 11

## Setup

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` and set your API credentials.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Generated from OpenAPI

This MCP server was automatically generated from an OpenAPI specification.

- **Tools:** 11 API endpoints exposed as MCP tools
- **Framework:** FastMCP
- **API Client:** Axios

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ecommerce-mcp": {
      "command": "node",
      "args": ["/Users/shailesh/Documents/mcp-intent-scaffold/ecommerce-mcp/dist/index.js"]
    }
  }
}
```

## Learn More

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
