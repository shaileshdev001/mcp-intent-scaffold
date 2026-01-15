#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
    .name('mcp-intent-scaffold')
    .description('Generate production-ready MCP servers with intent-driven tool design')
    .version('0.1.0');

program
    .command('init <project-name>')
    .description('Initialize a new MCP server project (greenfield mode by default)')
    .option('--auth <type>', 'Authentication type: none, api-key (default: none)', 'none')
    .option('--transport <type>', 'Transport type: stdio, http (default: stdio)', 'stdio')
    .option('--with-examples', 'Include example tools (default: false)', false)
    .action(async (projectName, options) => {
        // Validate auth type
        const validAuthTypes = ['none', 'api-key'];
        if (!validAuthTypes.includes(options.auth)) {
            console.error(chalk.red(`❌ Invalid auth type: ${options.auth}`));
            console.error(chalk.gray(`   Valid options: ${validAuthTypes.join(', ')}`));
            process.exit(1);
        }

        // Validate transport type
        const validTransports = ['stdio', 'http'];
        if (!validTransports.includes(options.transport)) {
            console.error(chalk.red(`❌ Invalid transport type: ${options.transport}`));
            console.error(chalk.gray(`   Valid options: ${validTransports.join(', ')}`));
            process.exit(1);
        }

        // Import ora dynamically
        const ora = (await import('ora')).default;
        const { ProjectGenerator } = await import('@mcp-intent/core');

        const spinner = ora('Creating MCP server...').start();

        try {
            const generator = new ProjectGenerator({
                projectName,
                authType: options.auth,
                transport: options.transport,
                includeExamples: options.withExamples,
            });

            await generator.generate();

            spinner.succeed(chalk.green('✅ Project created successfully!'));

            console.log(chalk.blue('\n📦 Next steps:'));
            console.log(chalk.gray(`  cd ${projectName}`));
            console.log(chalk.gray('  npm install'));
            console.log(chalk.gray('  npm run dev'));

            if (options.auth === 'api-key') {
                console.log(chalk.yellow('\n🔑 Don\'t forget to:'));
                console.log(chalk.gray('  cp .env.example .env'));
                console.log(chalk.gray('  # Then edit .env and set your API_KEY'));
            }
        } catch (error: any) {
            spinner.fail(chalk.red('❌ Failed to create project'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('add <type> <name>')
    .description('Add a new component (tool, resource, prompt)')
    .option('-i, --interactive', 'Interactive mode with prompts')
    .option('-d, --description <text>', 'Component description')
    .option('--no-register', 'Skip auto-registration in src/index.ts')
    .action(async (type, name, options) => {
        const validTypes = ['tool', 'resource', 'prompt'];

        if (!validTypes.includes(type)) {
            console.error(chalk.red(`❌ Invalid type: ${type}`));
            console.error(chalk.gray(`   Valid types: ${validTypes.join(', ')}`));
            process.exit(1);
        }

        // Check if we're in an MCP project
        const projectDir = process.cwd();
        const indexPath = `${projectDir}/src/index.ts`;
        const fs = await import('fs/promises');

        try {
            await fs.access(indexPath);
        } catch {
            console.error(chalk.red('❌ Not in an MCP project directory'));
            console.error(chalk.gray('   Run this command from your MCP project root (where src/index.ts exists)'));
            process.exit(1);
        }

        const ora = (await import('ora')).default;
        const inquirer = (await import('inquirer')).default;
        const { ToolGenerator, ResourceGenerator, PromptGenerator } = await import('@mcp-intent/core');

        try {
            if (type === 'tool') {
                let toolOptions: any = {
                    name,
                    description: options.description,
                    register: options.register,
                };

                // Interactive mode for tools
                if (options.interactive) {
                    const answers = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'description',
                            message: 'Tool description:',
                            default: options.description || `${name} tool`,
                        },
                        {
                            type: 'confirm',
                            name: 'addParams',
                            message: 'Add parameters?',
                            default: false,
                        },
                    ]);

                    toolOptions.description = answers.description;
                    toolOptions.parameters = [];

                    if (answers.addParams) {
                        let addMore = true;
                        while (addMore) {
                            const param = await inquirer.prompt([
                                {
                                    type: 'input',
                                    name: 'name',
                                    message: 'Parameter name:',
                                    validate: (input) => input.length > 0 || 'Name is required',
                                },
                                {
                                    type: 'list',
                                    name: 'type',
                                    message: 'Parameter type:',
                                    choices: ['string', 'number', 'boolean'],
                                    default: 'string',
                                },
                                {
                                    type: 'input',
                                    name: 'description',
                                    message: 'Parameter description (optional):',
                                },
                                {
                                    type: 'confirm',
                                    name: 'optional',
                                    message: 'Is this parameter optional?',
                                    default: false,
                                },
                            ]);

                            toolOptions.parameters.push(param);

                            const { continue: cont } = await inquirer.prompt([
                                {
                                    type: 'confirm',
                                    name: 'continue',
                                    message: 'Add another parameter?',
                                    default: false,
                                },
                            ]);

                            addMore = cont;
                        }
                    }

                    const { register } = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'register',
                            message: 'Auto-register in src/index.ts?',
                            default: true,
                        },
                    ]);

                    toolOptions.register = register;
                }

                const spinner = ora(`Creating tool '${name}'...`).start();
                const generator = new ToolGenerator(projectDir);
                await generator.generate(toolOptions);

                spinner.succeed(chalk.green(`✅ Tool '${name}' created successfully!`));
                console.log(chalk.gray(`   📄 src/tools/${name}.ts`));
                if (toolOptions.register !== false) {
                    console.log(chalk.gray(`   ✅ Registered in src/index.ts`));
                }

            } else if (type === 'resource') {
                let resourceOptions: any = {
                    name,
                    description: options.description,
                    register: options.register,
                };

                if (options.interactive) {
                    const answers = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'description',
                            message: 'Resource description:',
                            default: options.description || `${name} resource`,
                        },
                        {
                            type: 'input',
                            name: 'uri',
                            message: 'Resource URI:',
                            default: `resource:///${name}`,
                        },
                        {
                            type: 'list',
                            name: 'mimeType',
                            message: 'MIME type:',
                            choices: ['text/plain', 'application/json', 'text/html', 'text/markdown'],
                            default: 'text/plain',
                        },
                        {
                            type: 'confirm',
                            name: 'register',
                            message: 'Auto-register in src/index.ts?',
                            default: true,
                        },
                    ]);

                    resourceOptions = { ...resourceOptions, ...answers };
                }

                const spinner = ora(`Creating resource '${name}'...`).start();
                const generator = new ResourceGenerator(projectDir);
                await generator.generate(resourceOptions);

                spinner.succeed(chalk.green(`✅ Resource '${name}' created successfully!`));
                console.log(chalk.gray(`   📄 src/resources/${name}.ts`));
                if (resourceOptions.register !== false) {
                    console.log(chalk.gray(`   ✅ Registered in src/index.ts`));
                }

            } else if (type === 'prompt') {
                let promptOptions: any = {
                    name,
                    description: options.description,
                    register: options.register,
                };

                if (options.interactive) {
                    const answers = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'description',
                            message: 'Prompt description:',
                            default: options.description || `${name} prompt`,
                        },
                        {
                            type: 'confirm',
                            name: 'register',
                            message: 'Auto-register in src/index.ts?',
                            default: true,
                        },
                    ]);

                    promptOptions = { ...promptOptions, ...answers };
                }

                const spinner = ora(`Creating prompt '${name}'...`).start();
                const generator = new PromptGenerator(projectDir);
                await generator.generate(promptOptions);

                spinner.succeed(chalk.green(`✅ Prompt '${name}' created successfully!`));
                console.log(chalk.gray(`   📄 src/prompts/${name}.ts`));
                if (promptOptions.register !== false) {
                    console.log(chalk.gray(`   ✅ Registered in src/index.ts`));
                }
            }

        } catch (error: any) {
            console.error(chalk.red(`❌ Failed to create ${type}: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('generate <spec>')
    .description('Generate MCP server from OpenAPI specification')
    .option('--name <name>', 'Project name (default: from spec title)')
    .option('--output <dir>', 'Output directory (default: current directory)')
    .option('--base-url <url>', 'Override API base URL')
    .option('--auth <type>', 'Authentication type: none, api-key, bearer', 'none')
    .option('--filter <pattern>', 'Filter endpoints by tag or path pattern')
    .option('--max-tools <number>', 'Limit number of tools (default: 30)', '30')
    .action(async (spec, options) => {
        const ora = (await import('ora')).default;
        const { OpenAPIToolGenerator } = await import('@mcp-intent/core');

        const spinner = ora('Analyzing OpenAPI specification...').start();

        try {
            const generator = new OpenAPIToolGenerator();

            const result = await generator.generate({
                specInput: spec,
                projectName: options.name,
                outputDir: options.output,
                baseUrl: options.baseUrl,
                authType: options.auth,
                filter: options.filter,
                maxTools: parseInt(options.maxTools),
            });

            spinner.succeed(chalk.green('✅ MCP server generated successfully!'));

            console.log(chalk.blue('\n📊 Generation Summary:'));
            console.log(chalk.gray(`  API: ${result.spec.info.title} v${result.spec.info.version}`));
            console.log(chalk.gray(`  Tools generated: ${result.toolsGenerated}`));
            console.log(chalk.gray(`  Project: ${result.projectPath}`));

            console.log(chalk.blue('\n📦 Next steps:'));
            console.log(chalk.gray(`  cd ${result.projectPath.split('/').pop()}`));
            console.log(chalk.gray('  npm install'));
            console.log(chalk.gray('  cp .env.example .env'));
            console.log(chalk.gray('  # Edit .env with your API credentials'));
            console.log(chalk.gray('  npm run dev'));

        } catch (error: any) {
            spinner.fail(chalk.red('❌ Failed to generate MCP server'));
            console.error(chalk.red(error.message));
            if (error.stack) {
                console.error(chalk.gray(error.stack));
            }
            process.exit(1);
        }
    });

program.parse();
