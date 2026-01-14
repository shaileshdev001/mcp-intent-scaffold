export interface TemplateData {
    projectName: string;
    serverName: string;
    authType: string;
    [key: string]: any;
}

export class TemplateEngine {
    render(template: string, _data: TemplateData): string {
        // TODO: Implement Handlebars template rendering
        return template;
    }
}
