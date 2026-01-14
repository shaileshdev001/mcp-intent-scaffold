import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';

export interface TemplateData {
    projectName: string;
    serverName: string;
    authType: string;
    transport: string;
    hasAuth: boolean;
    authApiKey: boolean;
    port?: number;
    [key: string]: any;
}

export class TemplateEngine {
    private handlebars: typeof Handlebars;

    constructor() {
        this.handlebars = Handlebars.create();
        this.registerHelpers();
    }

    private registerHelpers(): void {
        // Helper for conditional rendering
        this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);

        // Helper for camelCase conversion
        this.handlebars.registerHelper('camelCase', (str: string) => {
            return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        });

        // Helper for PascalCase conversion
        this.handlebars.registerHelper('pascalCase', (str: string) => {
            const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            return camel.charAt(0).toUpperCase() + camel.slice(1);
        });
    }

    /**
     * Render a template string with data
     */
    render(templateContent: string, data: TemplateData): string {
        const template = this.handlebars.compile(templateContent);
        return template(data);
    }

    /**
     * Render a template file and write to output
     */
    async renderFile(
        templatePath: string,
        outputPath: string,
        data: TemplateData
    ): Promise<void> {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const rendered = this.render(templateContent, data);

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        // Write rendered content
        await fs.writeFile(outputPath, rendered, 'utf-8');
    }
}
