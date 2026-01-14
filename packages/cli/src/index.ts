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
    .description('Add a new component (tool, resource, prompt, auth-provider)')
    .option('-i, --interactive', 'Interactive mode')
    .action((type, name, _options) => {
        console.log(chalk.blue(`➕ Adding ${type}: ${name}`));
        console.log(chalk.yellow('⚠️  Implementation coming soon...'));
    });

program.parse();
