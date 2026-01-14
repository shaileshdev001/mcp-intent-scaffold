# MCP Intent Scaffold

> Generate production-ready Model Context Protocol (MCP) servers with intent-driven tool design

[![npm version](https://img.shields.io/npm/v/@mcp-intent/scaffold.svg)](https://www.npmjs.com/package/@mcp-intent/scaffold)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## 🎯 What is This?

MCP Intent Scaffold is a CLI tool that generates MCP servers using [FastMCP](https://github.com/punkpeye/fastmcp) with a focus on:

- **Intent-first design** - Workflow-oriented tools, not 1:1 API endpoint mapping
- **Production-ready** - Built-in auth, sessions, error handling
- **Type-safe** - Full TypeScript support with Zod/Valibot/ArkType schemas
- **Evolution-friendly** - Safe regeneration preserves your customizations

##  Quick Start

```bash
# Create a new MCP server (greenfield mode - default)
npx @mcp-intent/scaffold init my-server

# With authentication
npx @mcp-intent/scaffold init my-server --auth api-key

# With examples
npx @mcp-intent/scaffold init my-server --with-examples
```

## 📦 Installation

```bash
# Global installation
npm install -g @mcp-intent/scaffold

# Or use directly with npx
npx @mcp-intent/scaffold init <project-name>
```

## 🚀 Features

### Greenfield Mode (Default)
Start fresh with best-practice MCP server structure:
- FastMCP server with TypeScript
- Example tools, resources, and prompts
- Authentication templates (none, API key)
- Development and testing setup

### Commands

```bash
# Initialize new project
mcp-intent-scaffold init <name> [options]

# Add components
mcp-intent-scaffold add tool <name>
mcp-intent-scaffold add resource <name>
mcp-intent-scaffold add prompt <name>
mcp-intent-scaffold add auth-provider <name>

# Development
mcp-intent-scaffold dev        # Start dev server
mcp-intent-scaffold lint       # Lint your project
mcp-intent-scaffold test       # Run tests
```

## 🏗️ Project Structure (Generated)

```
my-mcp-server/
├── src/
│   ├── tools/           # MCP tools
│   ├── resources/       # MCP resources
│   ├── prompts/         # MCP prompts
│   ├── auth/            # Authentication
│   ├── config/          # Configuration
│   └── index.ts         # Server entry (FastMCP)
├── package.json
├── tsconfig.json
└── README.md
```

## 📚 Documentation

- [Getting Started](docs/getting-started.md) (coming soon)
- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)

## 🛠️ Development Status

**Current Version**: 0.1.0 (Early Development)

✅ **Completed:**
- CLI skeleton with Commander.js
- Basic project structure
- Package configuration

🚧 **In Progress:**
- Project generation logic
- Template system
- Authentication setup

📋 **Planned:**
- OpenAPI conversion mode
- Quality linting
- Deployment helpers

## 🤝 Contributing

Contributions are welcome! This project is in early development.

## 📄 License

Apache 2.0 © 2026

## 🔗 Links

- [FastMCP (TypeScript)](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
- [Official MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
