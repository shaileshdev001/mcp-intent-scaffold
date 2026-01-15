import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

export interface ParsedSpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers: OpenAPIV3.ServerObject[];
    paths: Map<string, OpenAPIV3.PathItemObject>;
    components?: OpenAPIV3.ComponentsObject;
    security?: OpenAPIV3.SecurityRequirementObject[];
}

export interface Endpoint {
    path: string;
    method: string;
    operationId?: string;
    summary?: string;
    description?: string;
    parameters: OpenAPIV3.ParameterObject[];
    requestBody?: OpenAPIV3.RequestBodyObject;
    responses: OpenAPIV3.ResponsesObject;
    security?: OpenAPIV3.SecurityRequirementObject[];
    tags?: string[];
}

export class OpenAPIParser {
    async parse(specInput: string): Promise<ParsedSpec> {
        try {
            // Parse and dereference the OpenAPI spec
            const api = await SwaggerParser.dereference(specInput) as OpenAPIV3.Document;

            // Validate it's OpenAPI 3.x
            if (!api.openapi || !api.openapi.startsWith('3.')) {
                throw new Error(`Unsupported OpenAPI version: ${api.openapi}. Only OpenAPI 3.x is supported.`);
            }

            // Convert paths object to Map for easier iteration
            const paths = new Map<string, OpenAPIV3.PathItemObject>();
            if (api.paths) {
                Object.entries(api.paths).forEach(([path, pathItem]) => {
                    if (pathItem) {
                        paths.set(path, pathItem);
                    }
                });
            }

            return {
                openapi: api.openapi,
                info: {
                    title: api.info.title,
                    version: api.info.version,
                    description: api.info.description,
                },
                servers: api.servers || [],
                paths,
                components: api.components,
                security: api.security,
            };
        } catch (error: any) {
            throw new Error(`Failed to parse OpenAPI spec: ${error.message}`);
        }
    }

    extractEndpoints(spec: ParsedSpec): Endpoint[] {
        const endpoints: Endpoint[] = [];

        for (const [path, pathItem] of spec.paths) {
            // Iterate through HTTP methods
            const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

            for (const method of methods) {
                const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;

                if (operation) {
                    const endpoint: Endpoint = {
                        path,
                        method: method.toUpperCase(),
                        operationId: operation.operationId,
                        summary: operation.summary,
                        description: operation.description,
                        parameters: this.extractParameters(operation, pathItem),
                        requestBody: operation.requestBody as OpenAPIV3.RequestBodyObject | undefined,
                        responses: operation.responses,
                        security: operation.security,
                        tags: operation.tags,
                    };

                    endpoints.push(endpoint);
                }
            }
        }

        return endpoints;
    }

    private extractParameters(
        operation: OpenAPIV3.OperationObject,
        pathItem: OpenAPIV3.PathItemObject
    ): OpenAPIV3.ParameterObject[] {
        const parameters: OpenAPIV3.ParameterObject[] = [];

        // Path-level parameters
        if (pathItem.parameters) {
            parameters.push(...(pathItem.parameters as OpenAPIV3.ParameterObject[]));
        }

        // Operation-level parameters
        if (operation.parameters) {
            parameters.push(...(operation.parameters as OpenAPIV3.ParameterObject[]));
        }

        return parameters;
    }

    getBaseUrl(spec: ParsedSpec): string {
        if (spec.servers && spec.servers.length > 0) {
            return spec.servers[0].url;
        }
        return 'https://api.example.com'; // Fallback
    }

    getSecuritySchemes(spec: ParsedSpec): Map<string, OpenAPIV3.SecuritySchemeObject> {
        const schemes = new Map<string, OpenAPIV3.SecuritySchemeObject>();

        if (spec.components?.securitySchemes) {
            Object.entries(spec.components.securitySchemes).forEach(([name, scheme]) => {
                schemes.set(name, scheme as OpenAPIV3.SecuritySchemeObject);
            });
        }

        return schemes;
    }
}
