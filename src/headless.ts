import {
  initGit,
  isGitRepo,
  getRepoInfo,
  deleteLocalBranch,
  deleteRemoteBranch,
} from './services/git.js';
import { initGitHub, getDefaultBranch } from './services/github.js';
import { fetchBranches, filterBranches } from './services/branch-analyzer.js';
import { formatDaysAgo } from './utils/date.js';
import type { Branch, CLIOptions, FilterOptions } from './types/index.js';

type Location = 'local' | 'remote' | 'local+remote';

function locationOf(branch: Branch): Location {
  if (branch.isLocal && branch.isRemote) return 'local+remote';
  if (branch.isLocal) return 'local';
  return 'remote';
}

function activeCriteria(filters: FilterOptions): string[] {
  const criteria: string[] = [];
  if (filters.merged) criteria.push('merged');
  if (filters.stale) criteria.push(`stale>${filters.staleDays}d`);
  if (filters.age) criteria.push(`age>${filters.ageDays}d`);
  if (filters.pattern) criteria.push(`pattern:${filters.patternValue}`);
  return criteria;
}

/**
 * Run git-tidy non-interactively. Resolves to the process exit code.
 */
export async function runHeadless(options: CLIOptions): Promise<number> {
  const filters: FilterOptions = {
    merged: options.merged,
    stale: options.stale,
    staleDays: options.staleDays,
    age: options.age,
    ageDays: options.ageDays,
    pattern: options.pattern,
    patternValue: options.patternValue,
  };
  const criteria = activeCriteria(filters);

  const fail = (message: string): number => {
    if (options.json) {
      console.log(JSON.stringify({ error: message }, null, 2));
    } else {
      console.error(`Error: ${message}`);
    }
    return 1;
  };

  // Initialize git and confirm we're inside a repository.
  initGit();
  if (!(await isGitRepo())) {
    return fail('Not a git repository. Please run this command in a git repository.');
  }

  const hasToken = Boolean(options.token || process.env.GITHUB_TOKEN);
  if (hasToken) {
    initGitHub(options.token);
  }

  let info = await getRepoInfo();
  if (!info) {
    return fail('Could not read repository information.');
  }
  if (info.isGitHub && hasToken) {
    info = { ...info, defaultBranch: await getDefaultBranch(info.owner, info.repo) };
  }

  const allBranches = await fetchBranches(options.scope, info.defaultBranch, info.currentBranch);
  const matched = filterBranches(allBranches, filters);

  const dryRun = !options.execute;
  const deleted: Array<{ name: string; location: Location }> = [];
  const errors: Array<{ name: string; error: string }> = [];

  if (!dryRun) {
    for (const branch of matched) {
      try {
        if (branch.isLocal) await deleteLocalBranch(branch.name, true);
        if (branch.isRemote) await deleteRemoteBranch(branch.name);
        deleted.push({ name: branch.name, location: locationOf(branch) });
      } catch (err) {
        errors.push({
          name: branch.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          dryRun,
          scope: options.scope,
          defaultBranch: info.defaultBranch,
          criteria,
          matched: matched.map((branch) => ({
            name: branch.name,
            merged: branch.isMerged,
            location: locationOf(branch),
            lastCommit: branch.lastCommitDate.toISOString(),
          })),
          deleted,
          errors,
        },
        null,
        2
      )
    );
    return errors.length > 0 ? 1 : 0;
  }

  // Human-readable text output.
  const repoLabel = info.owner && info.repo ? `${info.owner}/${info.repo}` : info.currentBranch;
  console.log(`Repository: ${repoLabel}  (default: ${info.defaultBranch})`);
  console.log(`Scope: ${options.scope}  Criteria: ${criteria.length ? criteria.join(', ') : '(none — all unprotected branches)'}`);
  console.log('');

  if (matched.length === 0) {
    console.log('No branches match the given criteria.');
    return 0;
  }

  console.log(`Matched ${matched.length} branch(es):`);
  for (const branch of matched) {
    const status = branch.isMerged ? 'merged' : 'not merged';
    console.log(`  - ${branch.name}  (${status}, ${formatDaysAgo(branch.lastCommitDate)}, ${locationOf(branch)})`);
  }
  console.log('');

  if (dryRun) {
    console.log(`Dry run — nothing deleted. Re-run with --execute to delete ${matched.length} branch(es).`);
    return 0;
  }

  for (const result of deleted) {
    console.log(`  ✓ deleted ${result.name} (${result.location})`);
  }
  for (const result of errors) {
    console.error(`  ✗ failed  ${result.name}: ${result.error}`);
  }
  console.log('');
  console.log(`Deleted ${deleted.length} branch(es)${errors.length ? `, ${errors.length} failed` : ''}.`);
  return errors.length > 0 ? 1 : 0;
}
