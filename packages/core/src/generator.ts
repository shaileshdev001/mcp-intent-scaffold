export interface GeneratorOptions {
    projectName: string;
    authType: 'none' | 'api-key';
    transport: 'stdio' | 'http';
    includeExamples: boolean;
}

export class ProjectGenerator {
    constructor(private options: GeneratorOptions) { }

    async generate(): Promise<void> {
        // TODO: Implement project generation
        console.log('Generating project:', this.options.projectName);
    }
}
