import { Command } from 'commander';
import type { BranchScope, CLIOptions } from './types/index.js';
import { DEFAULT_STALE_DAYS, DEFAULT_AGE_DAYS } from './utils/config.js';

const VALID_SCOPES: BranchScope[] = ['local', 'remote', 'both'];

/**
 * Parse an optional numeric flag value (e.g. `--stale` or `--stale 14`).
 * `value` is `undefined` when absent, `true` when bare, or a string when given.
 */
function parseOptionalDays(value: unknown, fallback: number): number {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

export function createCLI(): CLIOptions {
  const program = new Command();

  program
    .name('git-tidy')
    .description(
      'Interactive CLI tool for cleaning up unused git branches.\n\n' +
        'Run with no selection flags to launch the interactive wizard. Pass any of\n' +
        '--merged/--stale/--age/--pattern (or --json) to run non-interactively — ideal\n' +
        'for scripts and agents. Defaults to a dry run; add --execute to delete.'
    )
    .version('1.0.1')
    .option('-x, --execute', 'Actually delete branches (default: dry-run mode)', false)
    .option('--dry-run', 'Preview only; never delete (this is the default)', false)
    .option('-y, --yes', 'Skip all confirmations (for scripting)', false)
    .option('-t, --token <token>', 'GitHub personal access token (or use GITHUB_TOKEN env)')
    .option('--json', 'Output machine-readable JSON (implies non-interactive mode)', false)
    .option('--scope <scope>', 'Branch scope: local, remote, or both', 'both')
    .option('--merged', 'Select branches already merged into the default branch', false)
    .option('--stale [days]', `Select branches with no commits in N days (default: ${DEFAULT_STALE_DAYS})`)
    .option('--age [days]', `Select branches older than N days (default: ${DEFAULT_AGE_DAYS})`)
    .option('--pattern <glob>', 'Select branches whose name matches a glob (e.g. "feature/*")')
    .parse();

  const opts = program.opts();

  const scope = String(opts.scope) as BranchScope;
  if (!VALID_SCOPES.includes(scope)) {
    program.error(
      `error: invalid --scope "${opts.scope}" (expected one of: ${VALID_SCOPES.join(', ')})`
    );
  }

  const staleProvided = opts.stale !== undefined;
  const ageProvided = opts.age !== undefined;
  const merged = Boolean(opts.merged);
  const patternProvided = typeof opts.pattern === 'string' && opts.pattern.length > 0;
  const json = Boolean(opts.json);

  // Headless mode is triggered by any selection flag or by requesting JSON.
  // Bare `git-tidy` (and flags like --execute/--token alone) keep the wizard.
  const headless = merged || staleProvided || ageProvided || patternProvided || json;

  return {
    execute: Boolean(opts.execute) && !opts.dryRun,
    yes: Boolean(opts.yes),
    token: opts.token,
    headless,
    json,
    scope,
    merged,
    stale: staleProvided,
    staleDays: parseOptionalDays(opts.stale, DEFAULT_STALE_DAYS),
    age: ageProvided,
    ageDays: parseOptionalDays(opts.age, DEFAULT_AGE_DAYS),
    pattern: patternProvided,
    patternValue: patternProvided ? String(opts.pattern) : '',
  };
}
