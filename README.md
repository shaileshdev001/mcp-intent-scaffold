# MCP Intent Scaffold

> Generate production-ready Model Context Protocol (MCP) servers from OpenAPI specs or start from scratch

[![npm version](https://img.shields.io/npm/v/@mcp-intent/scaffold.svg)](https://www.npmjs.com/package/@mcp-intent/scaffold)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## 🎯 What is This?

MCP Intent Scaffold is a CLI tool that generates MCP servers using [FastMCP](https://github.com/punkpeye/fastmcp) with two main modes:

1. **OpenAPI Mode** - Convert existing APIs to MCP servers automatically
2. **Greenfield Mode** - Start fresh with best-practice templates

## ⚡ Quick Start

### Generate from OpenAPI Spec

```bash
# From a URL
mcp-intent-scaffold generate https://petstore3.swagger.io/api/v3/openapi.json

# From a local file
mcp-intent-scaffold generate ./my-api-spec.yaml

# With options
mcp-intent-scaffold generate ./spec.json \
  --name my-api-server \
  --max-tools 10 \
  --auth api-key
```

### Start from Scratch (Greenfield)

```bash
# Create a new MCP server
mcp-intent-scaffold init my-server

# With authentication
mcp-intent-scaffold init my-server --auth api-key

# With examples
mcp-intent-scaffold init my-server --with-examples
```

## 📦 Installation

```bash
# Global installation
npm install -g mcp-intent-scaffold

# Or use directly with npx
npx mcp-intent-scaffold generate <openapi-spec>
```

## 🚀 Features

### ✅ OpenAPI Mode (NEW!)
Transform OpenAPI 3.x specifications into working MCP servers:
- **Automatic tool generation** from API endpoints
- **Smart naming** (GET /users/{id} → get-user)
- **Zod validation** from OpenAPI schemas
- **API client** generation with auth support
- **Type-safe** TypeScript throughout
- **Filter endpoints** by tag or pattern
- **Limit tools** for optimal LLM performance

### ✅ Greenfield Mode
Start fresh with best-practice MCP server structure:
- FastMCP server with TypeScript
- Example tools, resources, and prompts
- Authentication templates (none, API key)
- Development and testing setup

## 📖 Usage

### OpenAPI Generation

```bash
# How to provide OpenAPI spec:

# 1. From a URL
mcp-intent-scaffold generate https://api.example.com/openapi.json

# 2. From a local file (JSON)
mcp-intent-scaffold generate ./specs/my-api.json

# 3. From a local file (YAML)
mcp-intent-scaffold generate ./specs/my-api.yaml

# With options:
mcp-intent-scaffold generate <spec> \
  --name my-custom-name \        # Project name (default: from spec title)
  --output ./projects \           # Output directory
  --base-url https://api.com \    # Override API base URL
  --auth api-key \                # Auth type: none, api-key, bearer
  --filter "/users/*" \           # Filter endpoints by path pattern
  --max-tools 20                  # Limit number of tools (default: 30)
```

**What you get:**
```
my-api-server/
├── src/
│   ├── index.ts                # FastMCP server entry
│   ├── api/
│   │   └── client.ts          # Axios client with auth
│   └── tools/openapi/          # Generated tools
│       ├── get-user.ts
│       ├── create-order.ts
│       └── ...
├── package.json                # With fastmcp, axios, zod
├── tsconfig.json
├── .env.example                # API credentials template
└── README.md

cd my-api-server
npm install
cp .env.example .env            # Add your API key
npm run dev                     # Start MCP server
```

### Commands

```bash
# Initialize new project (greenfield)
mcp-intent-scaffold init <name> [options]

# Generate from OpenAPI (main feature!)
mcp-intent-scaffold generate <spec> [options]

# Add components to existing project
mcp-intent-scaffold add tool <name>
mcp-intent-scaffold add resource <name>
mcp-intent-scaffold add prompt <name>
```

## 🏗️ Project Structure (Generated)

```
my-mcp-server/
├── src/
│   ├── tools/           # MCP tools
│   │   └── openapi/    # Auto-generated from OpenAPI
│   ├── resources/       # MCP resources
│   ├── prompts/         # MCP prompts
│   ├── auth/            # Authentication
│   ├── api/             # API client (OpenAPI mode)
│   └── index.ts         # Server entry (FastMCP)
├── package.json
├── tsconfig.json
└── README.md
```

## 📚 Examples

### Example 1: Stripe API

```bash
# Generate MCP server for Stripe API
mcp-intent-scaffold generate \
  https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json \
  --name stripe-mcp \
  --auth bearer \
  --filter "/v1/customers/*" \
  --max-tools 15
```

### Example 2: GitHub API

```bash
mcp-intent-scaffold generate \
  https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json \
  --name github-mcp \
  --auth bearer
```

### Example 3: Internal API

```bash
# Your company's internal API
mcp-intent-scaffold generate ./company-api-spec.yaml \
  --name company-api-mcp \
  --base-url https://internal-api.company.com \
  --auth api-key
```

## 🛠️ Development Status

**Current Version**: 0.1.0 (Early Development)

✅ **Phase 1 Complete:**
- ✅ CLI framework with Commander.js
- ✅ Project initialization (greenfield mode)
- ✅ Add tool/resource/prompt commands
- ✅ Interactive mode with Inquirer
- ✅ Modular authentication patterns

✅ **Phase 2 Complete:**
- ✅ OpenAPI 3.x parser
- ✅ Endpoint → Tool conversion
- ✅ Smart naming and intent analysis
- ✅ Zod schema generation
- ✅ API client generation
- ✅ `generate` command
- ✅ Enum parameter support

📋 **Coming Soon:**
- Hybrid mode (OpenAPI + custom tools)
- `analyze` command (preview before generation)
- OAuth 2.1 support
- Deployment helpers

## 🤝 Contributing

Contributions are welcome! This project is in active development.

## 📄 License

Apache 2.0 © 2026

## 🔗 Links

- [FastMCP (TypeScript)](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
- [Official MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
