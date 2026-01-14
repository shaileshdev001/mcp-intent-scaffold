# Test Fastmcp Server

MCP server built with [FastMCP](https://github.com/punkpeye/fastmcp)

## Setup

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Set your API key in `.env`:
```
API_KEY=your-secret-api-key
```


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


## stdio Transport

This server uses stdio transport for local MCP clients like Claude Desktop.

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "test-fastmcp-server": {
      "command": "node",
      "args": ["/Users/shailesh/Documents/mcp-intent-scaffold/test-fastmcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```


## Project Structure

```
test-fastmcp-server/
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/            # MCP tools
│   ├── resources/        # MCP resources
│   └── prompts/          # MCP prompts
├── package.json
├── tsconfig.json
└── .env.example
```

## Adding Tools

Add tools by calling `server.addTool()` in `src/index.ts`:

```typescript
server.addTool({
  name: 'my-tool',
  description: 'My custom tool',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async (args) => {
    return `You said: ${args.input}`;
  },
});
```

## Learn More

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
