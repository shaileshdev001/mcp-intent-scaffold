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
    .action((projectName, options) => {
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

        console.log(chalk.blue(`🚀 Creating MCP server: ${projectName}`));
        console.log(chalk.gray(`   Auth: ${options.auth}`));
        console.log(chalk.gray(`   Transport: ${options.transport}`));
        if (options.withExamples) {
            console.log(chalk.gray('   Examples: included'));
        }
        console.log(chalk.yellow('\n⚠️  Implementation coming soon...'));
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
