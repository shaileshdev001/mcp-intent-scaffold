import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { OpenAPIParser, ParsedSpec, Endpoint } from './OpenAPIParser.js';
import { IntentAnalyzer, ToolIntent } from './IntentAnalyzer.js';
import { SchemaMapper } from './SchemaMapper.js';

export interface OpenAPIGeneratorOptions {
    specInput: string;           // URL or path to OpenAPI spec
    projectName?: string;        // Override project name
    outputDir?: string;          // Output directory
    baseUrl?: string;            // Override base URL
    authType?: 'none' | 'api-key' | 'bearer';
    filter?: string;             // Filter pattern for endpoints
    maxTools?: number;           // Limit number of tools
}

export interface GeneratedProject {
    projectPath: string;
    toolsGenerated: number;
    spec: ParsedSpec;
}

export class OpenAPIToolGenerator {
    private parser: OpenAPIParser;
    private analyzer: IntentAnalyzer;
    private schemaMapper: SchemaMapper;

    constructor() {
        this.parser = new OpenAPIParser();
        this.analyzer = new IntentAnalyzer();
        this.schemaMapper = new SchemaMapper();
    }

    async generate(options: OpenAPIGeneratorOptions): Promise<GeneratedProject> {
        // 1. Parse OpenAPI spec
        const spec = await this.parser.parse(options.specInput);

        // 2. Extract endpoints
        const allEndpoints = this.parser.extractEndpoints(spec);

        // 3. Filter endpoints if needed
        const endpoints = this.filterEndpoints(allEndpoints, options);

        // 4. Determine project details
        const projectName = options.projectName || this.sanitizeProjectName(spec.info.title);
        const projectPath = path.resolve(options.outputDir || process.cwd(), projectName);
        const baseUrl = options.baseUrl || this.parser.getBaseUrl(spec);

        // 5. Create project structure
        await this.createProjectStructure(projectPath);

        // 6. Generate package.json
        await this.generatePackageJson(projectPath, spec, projectName);

        // 7. Generate tsconfig.json
        await this.generateTsConfig(projectPath);

        // 8. Generate .gitignore
        await this.generateGitIgnore(projectPath);

        // 9. Generate API client
        await this.generateApiClient(projectPath, spec, baseUrl, options.authType || 'none');

        // 10. Generate .env.example
        await this.generateEnvExample(projectPath, baseUrl, options.authType || 'none');

        // 11. Generate tools from endpoints
        await this.generateTools(projectPath, endpoints, spec);

        // 12. Generate main server file
        await this.generateServerEntry(projectPath, spec, endpoints, options.authType || 'none');

        // 13. Generate README
        await this.generateReadme(projectPath, spec, projectName, endpoints.length);

        return {
            projectPath,
            toolsGenerated: endpoints.length,
            spec,
        };
    }

    private filterEndpoints(endpoints: Endpoint[], options: OpenAPIGeneratorOptions): Endpoint[] {
        let filtered = endpoints;

        // Apply filter pattern if provided
        if (options.filter) {
            const pattern = options.filter.toLowerCase();
            filtered = filtered.filter(e =>
                e.path.toLowerCase().includes(pattern) ||
                e.tags?.some(t => t.toLowerCase().includes(pattern))
            );
        }

        // Apply max tools limit
        if (options.maxTools && filtered.length > options.maxTools) {
            filtered = filtered.slice(0, options.maxTools);
        }

        return filtered;
    }

    private sanitizeProjectName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private async createProjectStructure(projectPath: string): Promise<void> {
        const dirs = [
            'src/tools/openapi',
            'src/api',
        ];

        for (const dir of dirs) {
            await fse.ensureDir(path.join(projectPath, dir));
        }
    }

    private async generatePackageJson(projectPath: string, spec: ParsedSpec, projectName: string): Promise<void> {
        const packageJson = {
            name: projectName,
            version: spec.info.version || '1.0.0',
            description: spec.info.description || `MCP server for ${spec.info.title}`,
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
                axios: '^1.6.0',
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
            path.join(projectPath, 'package.json'),
            JSON.stringify(packageJson, null, 2),
            'utf-8'
        );
    }

    private async generateTsConfig(projectPath: string): Promise<void> {
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
            path.join(projectPath, 'tsconfig.json'),
            JSON.stringify(tsConfig, null, 2),
            'utf-8'
        );
    }

    private async generateGitIgnore(projectPath: string): Promise<void> {
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

        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore, 'utf-8');
    }

    private async generateApiClient(
        projectPath: string,
        spec: ParsedSpec,
        baseUrl: string,
        authType: string
    ): Promise<void> {
        let clientCode = `import axios from 'axios';\n\n`;
        clientCode += `const baseURL = process.env.API_BASE_URL || '${baseUrl}';\n`;

        if (authType === 'api-key') {
            clientCode += `const apiKey = process.env.API_KEY;\n\n`;
        } else if (authType === 'bearer') {
            clientCode += `const bearerToken = process.env.BEARER_TOKEN;\n\n`;
        } else {
            clientCode += `\n`;
        }

        clientCode += `export const apiClient = axios.create({\n`;
        clientCode += `  baseURL,\n`;
        clientCode += `  headers: {\n`;
        clientCode += `    'Content-Type': 'application/json',\n`;

        if (authType === 'api-key') {
            // Detect common API key header patterns
            const securitySchemes = this.parser.getSecuritySchemes(spec);
            let headerName = 'X-API-Key';

            for (const [, scheme] of securitySchemes) {
                if (scheme.type === 'apiKey' && scheme.in === 'header') {
                    headerName = scheme.name;
                    break;
                }
            }

            clientCode += `    ...(apiKey && { '${headerName}': apiKey }),\n`;
        } else if (authType === 'bearer') {
            clientCode += `    ...(bearerToken && { 'Authorization': \`Bearer \${bearerToken}\` }),\n`;
        }

        clientCode += `  },\n`;
        clientCode += `});\n\n`;
        clientCode += `// Add interceptors for logging/retries if needed\n`;

        await fs.writeFile(
            path.join(projectPath, 'src/api/client.ts'),
            clientCode,
            'utf-8'
        );
    }

    private async generateEnvExample(projectPath: string, baseUrl: string, authType: string): Promise<void> {
        let envContent = `# API Configuration\n`;
        envContent += `API_BASE_URL=${baseUrl}\n\n`;

        if (authType === 'api-key') {
            envContent += `# API Key Authentication\n`;
            envContent += `API_KEY=your-api-key-here\n`;
        } else if (authType === 'bearer') {
            envContent += `# Bearer Token Authentication\n`;
            envContent += `BEARER_TOKEN=your-bearer-token-here\n`;
        }

        await fs.writeFile(
            path.join(projectPath, '.env.example'),
            envContent,
            'utf-8'
        );
    }

    private async generateTools(projectPath: string, endpoints: Endpoint[], _spec: ParsedSpec): Promise<void> {
        for (const endpoint of endpoints) {
            const intent = this.analyzer.analyzeEndpoint(endpoint);
            const toolCode = this.generateToolCode(endpoint, intent);
            const filename = `${intent.name}.ts`;

            await fs.writeFile(
                path.join(projectPath, 'src/tools/openapi', filename),
                toolCode,
                'utf-8'
            );
        }
    }

    private generateToolCode(endpoint: Endpoint, intent: ToolIntent): string {
        let code = `import { z } from 'zod';\n`;
        code += `import { apiClient } from '../../api/client.js';\n\n`;
        code += `/**\n`;
        code += ` * ${intent.description}\n`;
        code += ` * \n`;
        code += ` * OpenAPI: ${endpoint.method} ${endpoint.path}\n`;
        code += ` */\n`;
        code += `export const ${this.toCamelCase(intent.name)}Tool = {\n`;
        code += `  name: '${intent.name}',\n`;
        code += `  description: '${intent.description}',\n`;

        // Generate parameters schema
        if (intent.parameters.length > 0) {
            code += `  parameters: ${this.generateParametersSchema(intent.parameters)},\n`;
        } else {
            code += `  parameters: z.object({}),\n`;
        }

        // Generate execute function
        code += `  execute: async (args: ${this.generateArgsType(intent.parameters)}) => {\n`;
        code += `    try {\n`;
        code += this.generateApiCall(endpoint, intent);
        code += `      return JSON.stringify(response.data, null, 2);\n`;
        code += `    } catch (error: any) {\n`;
        code += `      if (error.response) {\n`;
        code += `        return JSON.stringify({\n`;
        code += `          error: true,\n`;
        code += `          status: error.response.status,\n`;
        code += `          message: error.response.data?.message || 'API error',\n`;
        code += `        }, null, 2);\n`;
        code += `      }\n`;
        code += `      throw error;\n`;
        code += `    }\n`;
        code += `  },\n`;
        code += `};\n`;

        return code;
    }

    private generateParametersSchema(parameters: any[]): string {
        const props: string[] = [];

        parameters.forEach(param => {
            if (param.schema) {
                let zodSchema = this.schemaMapper.toZodSchema(param.schema);

                if (param.description) {
                    zodSchema += `.describe('${param.description.replace(/'/g, "\\'")}')`;
                }

                if (!param.required) {
                    zodSchema += '.optional()';
                }

                props.push(`${param.name}: ${zodSchema}`);
            }
        });

        return `z.object({\n    ${props.join(',\n    ')}\n  })`;
    }

    private generateArgsType(parameters: any[]): string {
        if (parameters.length === 0) {
            return 'Record<string, never>';
        }

        const props = parameters.map(p => {
            const optional = !p.required ? '?' : '';
            const type = this.schemaMapper.toTypeScriptType(p.schema);
            return `${p.name}${optional}: ${type}`;
        });

        return `{\n    ${props.join(';\n    ')};\n  }`;
    }

    private generateApiCall(endpoint: Endpoint, intent: ToolIntent): string {
        const method = endpoint.method.toLowerCase();
        let url = endpoint.path;

        // Replace path parameters
        const pathParams = intent.parameters.filter(p =>
            endpoint.path.includes(`{${p.name}}`)
        );

        pathParams.forEach(param => {
            url = url.replace(`{${param.name}}`, `\${args.${param.name}}`);
        });

        let code = `      const response = await apiClient.${method}(\`${url}\``;

        // Add body for POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(method)) {
            const bodyParam = intent.parameters.find(p => p.name === 'body');
            if (bodyParam) {
                code += `, args.body`;
            }
        }

        code += `);\n`;
        return code;
    }

    private async generateServerEntry(
        projectPath: string,
        spec: ParsedSpec,
        endpoints: Endpoint[],
        _authType: string
    ): Promise<void> {
        let code = `import { FastMCP } from 'fastmcp';\n`;
        code += `import { z } from 'zod';\n\n`;

        // Import all tools
        endpoints.forEach(endpoint => {
            const intent = this.analyzer.analyzeEndpoint(endpoint);
            const camelName = this.toCamelCase(intent.name);
            code += `import { ${camelName}Tool } from './tools/openapi/${intent.name}.js';\n`;
        });

        code += `\n`;
        code += `const server = new FastMCP({\n`;
        code += `  name: '${spec.info.title}',\n`;
        code += `  version: '${spec.info.version}',\n`;
        code += `});\n\n`;

        // Register all tools
        code += `// Register OpenAPI-generated tools\n`;
        endpoints.forEach(endpoint => {
            const intent = this.analyzer.analyzeEndpoint(endpoint);
            const camelName = this.toCamelCase(intent.name);
            code += `server.addTool(${camelName}Tool);\n`;
        });

        code += `\n// Start server\n`;
        code += `server.start({ transportType: 'stdio' });\n`;

        await fs.writeFile(
            path.join(projectPath, 'src/index.ts'),
            code,
            'utf-8'
        );
    }

    private async generateReadme(
        projectPath: string,
        spec: ParsedSpec,
        projectName: string,
        toolCount: number
    ): Promise<void> {
        const readme = `# ${spec.info.title}

${spec.info.description || `MCP server generated from OpenAPI specification`}

**Version:** ${spec.info.version}  
**Generated Tools:** ${toolCount}

## Setup

\`\`\`bash
npm install
\`\`\`

## Configuration

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and set your API credentials.

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

## Generated from OpenAPI

This MCP server was automatically generated from an OpenAPI specification.

- **Tools:** ${toolCount} API endpoints exposed as MCP tools
- **Framework:** FastMCP
- **API Client:** Axios

## Usage with Claude Desktop

Add to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${projectName}": {
      "command": "node",
      "args": ["${path.resolve(projectPath, 'dist/index.js')}"]
    }
  }
}
\`\`\`

## Learn More

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Specification](https://modelcontextprotocol.io)
`;

        await fs.writeFile(
            path.join(projectPath, 'README.md'),
            readme,
            'utf-8'
        );
    }

    private toCamelCase(str: string): string {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
}
