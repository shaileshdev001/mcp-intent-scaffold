import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';

export interface ToolGeneratorOptions {
    name: string;
    description?: string;
    parameters?: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        description?: string;
        optional?: boolean;
    }>;
    register?: boolean;
}

export class ToolGenerator {
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
    }

    async generate(options: ToolGeneratorOptions): Promise<void> {
        // Validate tool name
        this.validateName(options.name);

        // Check if tool already exists
        const toolPath = path.join(this.projectDir, 'src/tools', `${options.name}.ts`);
        if (await fse.pathExists(toolPath)) {
            throw new Error(`Tool '${options.name}' already exists at ${toolPath}`);
        }

        // Generate tool file
        const toolCode = this.generateToolCode(options);
        await fse.ensureDir(path.dirname(toolPath));
        await fs.writeFile(toolPath, toolCode, 'utf-8');

        // Auto-register if requested
        if (options.register !== false) {
            await this.registerTool(options.name);
        }
    }

    private validateName(name: string): void {
        // Must be lowercase, alphanumeric, hyphens only
        if (!/^[a-z0-9-]+$/.test(name)) {
            throw new Error(
                `Invalid tool name '${name}'. Must be lowercase letters, numbers, and hyphens only.`
            );
        }
    }

    private toCamelCase(str: string): string {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    private generateToolCode(options: ToolGeneratorOptions): string {
        const camelName = this.toCamelCase(options.name);
        const description = options.description || `${options.name} tool`;

        let code = `import { z } from 'zod';\n\n`;
        code += `/**\n * ${description}\n */\n`;
        code += `export const ${camelName}Tool = {\n`;
        code += `  name: '${options.name}',\n`;
        code += `  description: '${description}',\n`;

        // Generate parameters
        if (options.parameters && options.parameters.length > 0) {
            code += `  parameters: z.object({\n`;
            options.parameters.forEach((param) => {
                const zodType = param.type === 'string' ? 'string' : param.type === 'number' ? 'number' : 'boolean';
                let paramLine = `    ${param.name}: z.${zodType}()`;

                if (param.description) {
                    paramLine += `.describe('${param.description}')`;
                }

                if (param.optional) {
                    paramLine += `.optional()`;
                }

                code += paramLine + `,\n`;
            });
            code += `  }),\n`;
        } else {
            // No parameters - add empty object to avoid 'any' type
            code += `  parameters: z.object({}),\n`;
        }

        // Generate execute function
        code += `  execute: async (args`;
        if (options.parameters && options.parameters.length > 0) {
            code += `: {\n`;
            options.parameters.forEach((param) => {
                const tsType = param.type === 'string' ? 'string' : param.type === 'number' ? 'number' : 'boolean';
                code += `    ${param.name}${param.optional ? '?' : ''}: ${tsType};\n`;
            });
            code += `  }`;
        } else {
            code += `: Record<string, never>`;  // Empty object type instead of 'any'
        }
        code += `) => {\n`;
        code += `    // TODO: Implement ${options.name} logic\n`;
        code += `    return 'Result from ${options.name}';\n`;
        code += `  },\n`;
        code += `};\n`;

        return code;
    }

    private async registerTool(name: string): Promise<void> {
        const indexPath = path.join(this.projectDir, 'src/index.ts');

        if (!(await fse.pathExists(indexPath))) {
            return; // Can't register if no index.ts
        }

        const content = await fs.readFile(indexPath, 'utf-8');
        const camelName = this.toCamelCase(name);

        // Check if already registered
        if (content.includes(`from './tools/${name}`)) {
            return; // Already imported
        }

        // Find the import section end
        const lines = content.split('\n');
        let importInsertIndex = 0;
        let registerInsertIndex = lines.length;

        // Find where to insert import (after other imports)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                importInsertIndex = i + 1;
            }
            if (lines[i].includes('// Start server')) {
                registerInsertIndex = i;
                break;
            }
        }

        // Insert import
        lines.splice(importInsertIndex, 0, `import { ${camelName}Tool } from './tools/${name}.js';`);
        registerInsertIndex++; // Adjust for inserted line

        // Insert registration
        lines.splice(registerInsertIndex, 0, `server.addTool(${camelName}Tool);`);

        await fs.writeFile(indexPath, lines.join('\n'), 'utf-8');
    }
}
