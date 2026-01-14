import { promises as fs } from 'fs';
import path from 'path';
import fse from 'fs-extra';

export interface PromptGeneratorOptions {
    name: string;
    description?: string;
    register?: boolean;
}

export class PromptGenerator {
    private projectDir: string;

    constructor(projectDir: string) {
        this.projectDir = projectDir;
    }

    async generate(options: PromptGeneratorOptions): Promise<void> {
        // Validate prompt name
        this.validateName(options.name);

        // Check if prompt already exists
        const promptPath = path.join(this.projectDir, 'src/prompts', `${options.name}.ts`);
        if (await fse.pathExists(promptPath)) {
            throw new Error(`Prompt '${options.name}' already exists at ${promptPath}`);
        }

        // Generate prompt file
        const promptCode = this.generatePromptCode(options);
        await fse.ensureDir(path.dirname(promptPath));
        await fs.writeFile(promptPath, promptCode, 'utf-8');

        // Auto-register if requested
        if (options.register !== false) {
            await this.registerPrompt(options.name);
        }
    }

    private validateName(name: string): void {
        if (!/^[a-z0-9-]+$/.test(name)) {
            throw new Error(
                `Invalid prompt name '${name}'. Must be lowercase letters, numbers, and hyphens only.`
            );
        }
    }

    private toCamelCase(str: string): string {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    private generatePromptCode(options: PromptGeneratorOptions): string {
        const camelName = this.toCamelCase(options.name);
        const description = options.description || `${options.name} prompt`;

        let code = `/**\n * ${description}\n */\n`;
        code += `export const ${camelName}Prompt = {\n`;
        code += `  name: '${options.name}',\n`;
        code += `  description: '${description}',\n\n`;
        code += `  async load(args?: { input?: string }) {\n`;
        code += `    const input = args?.input || 'Default prompt for ${options.name}';\n`;
        code += `    return \`\${input}\`;\n`;
        code += `  },\n`;
        code += `};\n`;

        return code;
    }

    private async registerPrompt(name: string): Promise<void> {
        const indexPath = path.join(this.projectDir, 'src/index.ts');

        if (!(await fse.pathExists(indexPath))) {
            return;
        }

        const content = await fs.readFile(indexPath, 'utf-8');
        const camelName = this.toCamelCase(name);

        if (content.includes(`from './prompts/${name}`)) {
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

        lines.splice(importInsertIndex, 0, `import { ${camelName}Prompt } from './prompts/${name}.js';`);
        registerInsertIndex++;
        lines.splice(registerInsertIndex, 0, `server.addPrompt(${camelName}Prompt);`);

        await fs.writeFile(indexPath, lines.join('\n'), 'utf-8');
    }
}
