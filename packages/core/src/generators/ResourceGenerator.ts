import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';

export interface ResourceGeneratorOptions {
    name: string;
    description?: string;
    uri?: string;
    mimeType?: string;
    register?: boolean;
}

export class ResourceGenerator {
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
    }

    async generate(options: ResourceGeneratorOptions): Promise<void> {
        // Validate resource name
        this.validateName(options.name);

        // Check if resource already exists
        const resourcePath = path.join(this.projectDir, 'src/resources', `${options.name}.ts`);
        if (await fse.pathExists(resourcePath)) {
            throw new Error(`Resource '${options.name}' already exists at ${resourcePath}`);
        }

        // Generate resource file
        const resourceCode = this.generateResourceCode(options);
        await fse.ensureDir(path.dirname(resourcePath));
        await fs.writeFile(resourcePath, resourceCode, 'utf-8');

        // Auto-register if requested
        if (options.register !== false) {
            await this.registerResource(options.name);
        }
    }

    private validateName(name: string): void {
        if (!/^[a-z0-9-]+$/.test(name)) {
            throw new Error(
                `Invalid resource name '${name}'. Must be lowercase letters, numbers, and hyphens only.`
            );
        }
    }

    private toCamelCase(str: string): string {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    private generateResourceCode(options: ResourceGeneratorOptions): string {
        const camelName = this.toCamelCase(options.name);
        const description = options.description || `${options.name} resource`;
        const uri = options.uri || `resource:///${options.name}`;
        const mimeType = options.mimeType || 'text/plain';

        let code = `/**\n * ${description}\n */\n`;
        code += `export const ${camelName}Resource = {\n`;
        code += `  uri: '${uri}',\n`;
        code += `  name: '${options.name}',\n`;
        code += `  description: '${description}',\n`;
        code += `  mimeType: '${mimeType}',\n\n`;
        code += `  async load() {\n`;
        code += `    // TODO: Implement ${options.name} resource logic\n`;
        code += `    return {\n`;
        code += `      uri: this.uri,\n`;
        code += `      mimeType: this.mimeType,\n`;
        code += `      text: 'Resource content for ${options.name}',\n`;
        code += `    };\n`;
        code += `  },\n`;
        code += `};\n`;

        return code;
    }

    private async registerResource(name: string): Promise<void> {
        const indexPath = path.join(this.projectDir, 'src/index.ts');

        if (!(await fse.pathExists(indexPath))) {
            return;
        }

        const content = await fs.readFile(indexPath, 'utf-8');
        const camelName = this.toCamelCase(name);

        if (content.includes(`from './resources/${name}`)) {
            return;
        }

        const lines = content.split('\n');
        let importInsertIndex = 0;
        let registerInsertIndex = lines.length;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                importInsertIndex = i + 1;
            }
            if (lines[i].includes('// Start server')) {
                registerInsertIndex = i;
                break;
            }
        }

        lines.splice(importInsertIndex, 0, `import { ${camelName}Resource } from './resources/${name}.js';`);
        registerInsertIndex++;
        lines.splice(registerInsertIndex, 0, `server.addResource(${camelName}Resource);`);

        await fs.writeFile(indexPath, lines.join('\n'), 'utf-8');
    }
}
