import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';

export interface GeneratorOptions {
    projectName: string;
    authType: 'none' | 'api-key';
    transport: 'stdio' | 'http';
    includeExamples: boolean;
}

export class ProjectGenerator {
    private options: GeneratorOptions;
    private projectDir: string;

    constructor(options: GeneratorOptions) {
        this.options = options;
        this.projectDir = path.resolve(process.cwd(), options.projectName);
    }

    async generate(): Promise<void> {
        // Validate project name
        await this.validateProjectName();

        // Create project directory
        await this.createProjectDirectory();

        // Create directory structure FIRST
        await this.createDirectoryStructure();

        // Generate auth files if needed
        if (this.options.authType !== 'none') {
            await this.generateAuthFiles();
        }

        // Generate files
        await this.generatePackageJson();
        await this.generateTsConfig();
        await this.generateGitIgnore();
        await this.generateEnvExample();
        await this.generateServerEntryPoint();
        await this.generateReadme();

        // Generate example files if requested
        if (this.options.includeExamples) {
            await this.generateExamples();
        }
    }

    private async validateProjectName(): Promise<void> {
        // Check if directory already exists
        const exists = await fse.pathExists(this.projectDir);
        if (exists) {
            throw new Error(`Directory ${this.options.projectName} already exists`);
        }

        // Validate npm package name
        const validNamePattern = /^[a-z0-9-_]+$/;
        if (!validNamePattern.test(this.options.projectName)) {
            throw new Error(
                'Project name must contain only lowercase letters, numbers, hyphens, and underscores'
            );
        }
    }

    private async createProjectDirectory(): Promise<void> {
        await fse.ensureDir(this.projectDir);
    }

    private async createDirectoryStructure(): Promise<void> {
        const dirs = ['src/tools', 'src/resources', 'src/prompts', 'src/auth'];

        for (const dir of dirs) {
            await fse.ensureDir(path.join(this.projectDir, dir));
        }
    }

    private getTemplateData() {
        return {
            projectName: this.options.projectName,
            serverName: this.options.projectName
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            authType: this.options.authType,
            transport: this.options.transport,
            hasAuth: this.options.authType !== 'none',
            authApiKey: this.options.authType === 'api-key',
            port: this.options.transport === 'http' ? 3000 : undefined,
        };
    }

    private async generatePackageJson(): Promise<void> {
        const data = this.getTemplateData();
        const packageJson = {
            name: this.options.projectName,
            version: '1.0.0',
            description: `MCP server: ${data.serverName}`,
            type: 'module',
            main: './dist/index.js',
            scripts: {
                build: 'tsc',
                dev: 'tsx src/index.ts',
                start: 'node dist/index.js',
                lint: 'tsc --noEmit',
            },
            dependencies: {
                fastmcp: '^1.27.4',
                zod: '^3.24.3',
            },
            devDependencies: {
                '@types/node': '^20.10.0',
                typescript: '^5.3.3',
                tsx: '^4.7.0',
            },
            engines: {
                node: '>=18.0.0',
            },
        };

        await fs.writeFile(
            path.join(this.projectDir, 'package.json'),
            JSON.stringify(packageJson, null, 2),
            'utf-8'
        );
    }

    private async generateTsConfig(): Promise<void> {
        const tsConfig = {
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                lib: ['ES2022'],
                moduleResolution: 'bundler',
                rootDir: './src',
                outDir: './dist',
                declaration: true,
                declarationMap: true,
                sourceMap: true,
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                strict: true,
                skipLibCheck: true,
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist'],
        };

        await fs.writeFile(
            path.join(this.projectDir, 'tsconfig.json'),
            JSON.stringify(tsConfig, null, 2),
            'utf-8'
        );
    }

    private async generateGitIgnore(): Promise<void> {
        const gitignore = `# Dependencies
node_modules/

# Build outputs
dist/
*.tsbuildinfo

# Environment files
.env
.env.local

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

        await fs.writeFile(path.join(this.projectDir, '.gitignore'), gitignore, 'utf-8');
    }

    private async generateEnvExample(): Promise<void> {
        const data = this.getTemplateData();
        let envContent = `# ${data.serverName} Environment Variables\n\n`;

        if (data.authApiKey) {
            envContent += `# API Key Authentication\nAPI_KEY=your-secret-api-key-here\n\n`;
        }

        if (data.transport === 'http') {
            envContent += `# HTTP Server Configuration\nPORT=3000\n`;
        }

        await fs.writeFile(path.join(this.projectDir, '.env.example'), envContent, 'utf-8');
    }

    private async generateAuthFiles(): Promise<void> {
        if (this.options.authType === 'api-key') {
            const authCode = `import type { IncomingMessage } from 'http';

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
`;

            await fs.writeFile(
                path.join(this.projectDir, 'src/auth/api-key.ts'),
                authCode,
                'utf-8'
            );
        }
    }

    private async generateServerEntryPoint(): Promise<void> {
        const data = this.getTemplateData();

        let serverCode = '';

        // Import statements
        serverCode += `import { FastMCP } from 'fastmcp';\nimport { z } from 'zod';\n`;

        // Add auth import if needed
        if (data.authApiKey) {
            serverCode += `import { apiKeyAuth } from './auth/api-key.js';\n`;
        }

        serverCode += `\n`;

        // Create server with or without auth
        if (data.authApiKey) {
            serverCode += `const server = new FastMCP({\n  name: '${data.serverName}',\n  version: '1.0.0',\n  authenticate: apiKeyAuth,\n});\n`;
        } else {
            serverCode += `const server = new FastMCP({\n  name: '${data.serverName}',\n  version: '1.0.0',\n});\n`;
        }

        // Add start configuration
        serverCode += `\n// Start server\n`;

        if (data.transport === 'stdio') {
            serverCode += `server.start({ transportType: 'stdio' });\n`;
        } else {
            serverCode += `const port = parseInt(process.env.PORT || '3000');\n\nserver.start({\n  transportType: 'httpStream',\n  httpStream: {\n    port: port,\n  },\n});\n\nconsole.log(\`🚀 MCP server running on http://localhost:\${port}/mcp\`);\n`;
        }

        await fs.writeFile(
            path.join(this.projectDir, 'src/index.ts'),
            serverCode,
            'utf-8'
        );
    }

    private async generateReadme(): Promise<void> {
        const data = this.getTemplateData();

        const readme = `# ${data.serverName}

MCP server built with [FastMCP](https://github.com/punkpeye/fastmcp)

## Setup

\`\`\`bash
npm install
\`\`\`

${data.hasAuth ? `## Configuration

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
cp .env.example .env
\`\`\`
${data.authApiKey ? `
Set your API key in \`.env\`:
\`\`\`
API_KEY=your-secret-api-key
\`\`\`
` : ''}
` : ''}
## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Run

\`\`\`bash
npm start
\`\`\`

${data.transport === 'http' ? `
## HTTP Transport

The server runs on \`http://localhost:3000/mcp\`

You can test it with:
\`\`\`bash
curl http://localhost:3000/mcp
\`\`\`
` : `
## stdio Transport

This server uses stdio transport for local MCP clients like Claude Desktop.

Add to your Claude Desktop config (\`claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${this.options.projectName}": {
      "command": "node",
      "args": ["${path.resolve(this.projectDir, 'dist/index.js')}"]${data.authApiKey ? `,
      "env": {
        "API_KEY": "your-api-key-here"
      }` : ''}
    }
  }
}
\`\`\`
`}

## Project Structure

\`\`\`
${this.options.projectName}/
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/            # MCP tools
│   ├── resources/        # MCP resources
│   └── prompts/          # MCP prompts
├── package.json
├── tsconfig.json
└── .env.example
\`\`\`

## Adding Tools

Add tools by calling \`server.addTool()\` in \`src/index.ts\`:

\`\`\`typescript
server.addTool({
  name: 'my-tool',
  description: 'My custom tool',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async (args) => {
    return \`You said: \${args.input}\`;
  },
});
\`\`\`

## Learn More

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
`;

        await fs.writeFile(path.join(this.projectDir, 'README.md'), readme, 'utf-8');
    }

    private async generateExamples(): Promise<void> {
        // Generate example tool
        const exampleTool = `import { z } from 'zod';

export const echoTool = {
  name: 'echo',
  description: 'Echo back the input message',
  parameters: z.object({
    message: z.string().describe('The message to echo back'),
  }),
  execute: async (args: { message: string }) => {
    return \`Echo: \${args.message}\`;
  },
};
`;

        await fs.writeFile(
            path.join(this.projectDir, 'src/tools/echo.ts'),
            exampleTool,
            'utf-8'
        );

        // Update main index.ts to import and use the example
        const indexPath = path.join(this.projectDir, 'src/index.ts');
        const indexContent = await fs.readFile(indexPath, 'utf-8');

        const updatedIndex = indexContent.replace(
            '// Start server',
            `// Import example tools
import { echoTool } from './tools/echo';

// Register example tools
server.addTool(echoTool);

// Start server`
        );

        await fs.writeFile(indexPath, updatedIndex, 'utf-8');
    }

    getProjectPath(): string {
        return this.projectDir;
    }
}
