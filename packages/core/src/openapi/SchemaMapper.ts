
export class SchemaMapper {
    /**
     * Convert OpenAPI schema to Zod schema code
     */
    toZodSchema(schema: any): string {
        if (!schema) {
            return 'z.any()';
        }

        const type = schema.type;

        switch (type) {
            case 'string':
                return this.mapString(schema);
            case 'number':
            case 'integer':
                return this.mapNumber(schema);
            case 'boolean':
                return 'z.boolean()';
            case 'array':
                return this.mapArray(schema);
            case 'object':
                return this.mapObject(schema);
            default:
                // Handle enums
                if (schema.enum) {
                    return this.mapEnum(schema);
                }
                return 'z.any()';
        }
    }

    private mapString(schema: any): string {
        let zod = 'z.string()';

        if (schema.format === 'email') {
            zod += '.email()';
        } else if (schema.format === 'uri' || schema.format === 'url') {
            zod += '.url()';
        } else if (schema.format === 'uuid') {
            zod += '.uuid()';
        }

        if (schema.minLength !== undefined) {
            zod += `.min(${schema.minLength})`;
        }

        if (schema.maxLength !== undefined) {
            zod += `.max(${schema.maxLength})`;
        }

        if (schema.pattern) {
            // Escape regex for code generation
            const pattern = schema.pattern.replace(/\\/g, '\\\\');
            zod += `.regex(/${pattern}/)`;
        }

        return zod;
    }

    private mapNumber(schema: any): string {
        let zod = 'z.number()';

        if (schema.type === 'integer') {
            zod += '.int()';
        }

        if (schema.minimum !== undefined) {
            zod += `.min(${schema.minimum})`;
        }

        if (schema.maximum !== undefined) {
            zod += `.max(${schema.maximum})`;
        }

        return zod;
    }

    private mapArray(schema: any): string {
        const items = schema.items || {};
        const itemSchema = this.toZodSchema(items);

        let zod = `z.array(${itemSchema})`;

        if (schema.minItems !== undefined) {
            zod += `.min(${schema.minItems})`;
        }

        if (schema.maxItems !== undefined) {
            zod += `.max(${schema.maxItems})`;
        }

        return zod;
    }

    private mapObject(schema: any): string {
        if (!schema.properties) {
            return 'z.object({})';
        }

        const properties: string[] = [];
        const required = schema.required || [];

        Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
            const zodSchema = this.toZodSchema(propSchema);
            const isRequired = required.includes(key);

            let prop = `${key}: ${zodSchema}`;

            if (propSchema.description) {
                prop += `.describe('${this.escapeString(propSchema.description)}')`;
            }

            if (!isRequired) {
                prop += '.optional()';
            }

            properties.push(prop);
        });

        return `z.object({\n    ${properties.join(',\n    ')}\n  })`;
    }

    private mapEnum(schema: any): string {
        const values = schema.enum.map((v: any) =>
            typeof v === 'string' ? `'${v}'` : v
        );
        return `z.enum([${values.join(', ')}])`;
    }

    private escapeString(str: string): string {
        return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
    }

    /**
     * Generate TypeScript type from schema for function parameters
     */
    toTypeScriptType(schema: any): string {
        if (!schema) {
            return 'any';
        }

        const type = schema.type;

        switch (type) {
            case 'string':
                if (schema.enum) {
                    return schema.enum.map((v: string) => `'${v}'`).join(' | ');
                }
                return 'string';
            case 'number':
            case 'integer':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                const itemType = this.toTypeScriptType(schema.items || {});
                return `${itemType}[]`;
            case 'object':
                if (!schema.properties) {
                    return 'Record<string, any>';
                }
                const props = Object.entries(schema.properties).map(([key, propSchema]: [string, any]) => {
                    const required = schema.required || [];
                    const optional = !required.includes(key) ? '?' : '';
                    return `${key}${optional}: ${this.toTypeScriptType(propSchema)}`;
                });
                return `{ ${props.join('; ')} }`;
            default:
                return 'any';
        }
    }
}
