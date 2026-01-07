import { Command } from 'commander';
import type { CLIOptions } from './types/index.js';

export function createCLI(): CLIOptions {
  const program = new Command();

  program
    .name('git-tidy')
    .description('Interactive CLI tool for cleaning up unused git branches')
    .version('1.0.0')
    .option('-x, --execute', 'Actually delete branches (default: dry-run mode)', false)
    .option('-y, --yes', 'Skip all confirmations (for scripting)', false)
    .option('-t, --token <token>', 'GitHub personal access token (or use GITHUB_TOKEN env)')
    .parse();

  const opts = program.opts();

  return {
    execute: opts.execute || false,
    yes: opts.yes || false,
    token: opts.token,
  };
}
