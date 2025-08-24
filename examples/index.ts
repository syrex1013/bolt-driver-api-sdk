#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Main Examples Menu
 * Choose which example to run
 */

async function main() {
  console.clear();
  console.log(boxen(chalk.blue.bold('🚗 Bolt Driver API Examples'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
  }));

  const { example } = await inquirer.prompt([
    {
      type: 'list',
      name: 'example',
      message: 'Choose an example to run:',
      choices: [
        {
          name: '🔐 Basic Authentication Example',
          value: 'auth',
          description: 'Simple authentication flow with SMS verification'
        },
        {
          name: '🚀 Enhanced Example with Token Persistence & Logging',
          value: 'enhanced',
          description: 'Full-featured example with token storage, logging, and all API methods'
        },
        {
          name: '💻 CLI Example',
          value: 'cli',
          description: 'Command-line interface example'
        },
        {
          name: '🔗 Magic Link Authentication & New Endpoints',
          value: 'magic-link',
          description: 'Magic link authentication via email and demonstration of all new API endpoints'
        },
        {
          name: '❌ Exit',
          value: 'exit'
        }
      ]
    }
  ]);

  if (example === 'exit') {
    console.log(chalk.yellow('\n👋 Goodbye!'));
    return;
  }

  console.log(chalk.cyan(`\n🚀 Running ${example} example...\n`));

  try {
    switch (example) {
      case 'auth':
        await import('./auth');
        break;
      case 'enhanced':
        await import('./enhanced');
        break;
      case 'cli':
        await import('./cli');
        break;
      case 'magic-link':
        await import('./magic-link-example');
        break;
      default:
        console.log(chalk.red('Unknown example selected'));
    }
  } catch (error) {
    console.error(chalk.red('Failed to run example:'), error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
