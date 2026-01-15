import { Endpoint } from './OpenAPIParser.js';

export interface ToolIntent {
    name: string;
    description: string;
    category?: string;
    intent: 'read' | 'write' | 'delete' | 'search' | 'other';
    parameters: ToolParameter[];
    returnDescription: string;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    required: boolean;
    schema?: any;
}

export class IntentAnalyzer {
    analyzeEndpoint(endpoint: Endpoint): ToolIntent {
        const name = this.generateToolName(endpoint);
        const description = this.generateDescription(endpoint);
        const intent = this.detectIntent(endpoint);
        const parameters = this.extractToolParameters(endpoint);
        const returnDescription = this.generateReturnDescription(endpoint);

        return {
            name,
            description,
            category: endpoint.tags?.[0],
            intent,
            parameters,
            returnDescription,
        };
    }

    private generateToolName(endpoint: Endpoint): string {
        // Prefer operationId if available
        if (endpoint.operationId) {
            return this.kebabCase(endpoint.operationId);
        }

        // Generate from method and path
        const method = endpoint.method.toLowerCase();

        // Check if this is a single-item GET (has path parameter)
        const hasPathParam = endpoint.path.includes('{');

        // Extract meaningful path parts (excluding parameters)
        const pathParts = endpoint.path
            .split('/')
            .filter(p => p && !p.startsWith('{'))
            .join('-');

        // Smart naming based on method and path structure
        if (method === 'get') {
            // GET /products → list-products
            // GET /products/{id} → get-product (singular!)
            if (hasPathParam) {
                // Remove plural 's' for single item endpoints
                const singular = pathParts.endsWith('s') ? pathParts.slice(0, -1) : pathParts;
                return `get-${singular}`;
            } else {
                return `list-${pathParts}`;
            }
        }

        const actionMap: Record<string, string> = {
            post: 'create',
            put: 'update',
            patch: 'update',
            delete: 'delete',
        };

        const action = actionMap[method] || method;
        return `${action}-${pathParts}`.replace(/--+/g, '-');
    }

    private generateDescription(endpoint: Endpoint): string {
        // Prefer summary, then description, then generate from path
        if (endpoint.summary) {
            return endpoint.summary;
        }

        if (endpoint.description) {
            // Take first sentence
            const firstSentence = endpoint.description.split('.')[0];
            return firstSentence + (firstSentence.endsWith('.') ? '' : '.');
        }

        // Generate from method and path
        const method = endpoint.method;
        const resource = endpoint.path
            .split('/')
            .filter(p => p && !p.startsWith('{'))
            .pop() || 'resource';

        const actionMap: Record<string, string> = {
            GET: 'Get',
            POST: 'Create',
            PUT: 'Update',
            PATCH: 'Update',
            DELETE: 'Delete',
        };

        return `${actionMap[method] || method} ${resource}`;
    }

    private detectIntent(endpoint: Endpoint): ToolIntent['intent'] {
        const method = endpoint.method.toUpperCase();

        // Check for search/query parameters
        const hasSearchParams = endpoint.parameters.some(p =>
            p.name.toLowerCase().includes('search') ||
            p.name.toLowerCase().includes('query') ||
            p.name.toLowerCase().includes('filter')
        );

        if (hasSearchParams) {
            return 'search';
        }

        // Map HTTP method to intent
        switch (method) {
            case 'GET':
                return 'read';
            case 'POST':
            case 'PUT':
            case 'PATCH':
                return 'write';
            case 'DELETE':
                return 'delete';
            default:
                return 'other';
        }
    }

    private extractToolParameters(endpoint: Endpoint): ToolParameter[] {
        const params: ToolParameter[] = [];

        // Extract from OpenAPI parameters
        endpoint.parameters.forEach(param => {
            if (param.schema) {
                params.push({
                    name: param.name,
                    type: this.mapSchemaType(param.schema),
                    description: param.description,
                    required: param.required || false,
                    schema: param.schema,
                });
            }
        });

        // Extract from request body if present
        if (endpoint.requestBody && 'content' in endpoint.requestBody) {
            const content = endpoint.requestBody.content;
            const jsonContent = content['application/json'];

            if (jsonContent?.schema) {
                // For POST/PUT with body, add a 'body' parameter
                params.push({
                    name: 'body',
                    type: 'object',
                    description: endpoint.requestBody.description || 'Request body',
                    required: endpoint.requestBody.required || false,
                    schema: jsonContent.schema,
                });
            }
        }

        return params;
    }

    private mapSchemaType(schema: any): ToolParameter['type'] {
        const type = schema.type;

        switch (type) {
            case 'string':
                return 'string';
            case 'integer':
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'array';
            case 'object':
                return 'object';
            default:
                return 'string';
        }
    }

    private generateReturnDescription(endpoint: Endpoint): string {
        // Look at successful response (200, 201, etc.)
        const successResponse = endpoint.responses['200'] || endpoint.responses['201'] || endpoint.responses['default'];

        if (successResponse && 'description' in successResponse) {
            return successResponse.description;
        }

        return `Returns the result of the ${endpoint.method} operation`;
    }

    private kebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
}
