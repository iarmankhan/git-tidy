import type { Branch, FilterOptions, BranchScope } from '../types/index.js';
import { isOlderThan, isNewerThan } from '../utils/date.js';
import {
  getLocalBranches,
  getRemoteBranches,
} from './git.js';

/**
 * Fetch branches based on scope
 */
export async function fetchBranches(
  scope: BranchScope,
  defaultBranch: string,
  currentBranch: string
): Promise<Branch[]> {
  let branches: Branch[] = [];

  if (scope === 'local' || scope === 'both') {
    const localBranches = await getLocalBranches(defaultBranch, currentBranch);
    branches = [...branches, ...localBranches];
  }

  if (scope === 'remote' || scope === 'both') {
    const remoteBranches = await getRemoteBranches(defaultBranch);
    // A local branch and its remote namesake can point to different commits.
    // Keep their filter results and deletion choices separate.
    branches = [...branches, ...remoteBranches];
  }

  return branches;
}

/**
 * Apply all filters to branches.
 *
 * Protected and current branches are always excluded. Active filters combine
 * according to `filters.matchMode`: 'any' (OR — matches any active filter, the
 * default) or 'all' (AND — must match every active filter). With no active
 * filters, all non-protected branches are returned.
 */
export function filterBranches(
  branches: Branch[],
  filters: FilterOptions
): Branch[] {
  // Always exclude protected and current branches
  const candidates = branches.filter(
    (b) => !b.isProtected && !b.isCurrentBranch
  );

  const hasFilters =
    filters.merged ||
    filters.stale ||
    filters.age ||
    filters.newerThan ||
    (filters.pattern && Boolean(filters.patternValue));

  if (!hasFilters) {
    return candidates;
  }

  return candidates.filter((branch) => {
    // Each active filter contributes one predicate result.
    const results: boolean[] = [];

    if (filters.merged) {
      results.push(branch.isMerged);
    }
    if (filters.stale) {
      results.push(isOlderThan(branch.lastCommitDate, filters.staleDays));
    }
    if (filters.age) {
      results.push(isOlderThan(branch.lastCommitDate, filters.ageDays));
    }
    if (filters.newerThan) {
      results.push(isNewerThan(branch.lastCommitDate, filters.newerThanDays));
    }
    if (filters.pattern && filters.patternValue) {
      results.push(matchesPattern(branch.name, filters.patternValue));
    }

    return filters.matchMode === 'all'
      ? results.every((m) => m === true)
      : results.some((m) => m === true);
  });
}

/**
 * Check if branch name matches a glob-like pattern
 */
export function matchesPattern(branchName: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // Supports: * (any characters), ? (single character)
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // * -> .*
    .replace(/\?/g, '.'); // ? -> .

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(branchName);
}

/**
 * Sort branches by date (oldest first)
 */
export function sortByAge(branches: Branch[]): Branch[] {
  return [...branches].sort(
    (a, b) => a.lastCommitDate.getTime() - b.lastCommitDate.getTime()
  );
}

/**
 * Sort branches by name
 */
export function sortByName(branches: Branch[]): Branch[] {
  return [...branches].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get branch statistics
 */
export function getBranchStats(branches: Branch[]): {
  total: number;
  local: number;
  remote: number;
  merged: number;
  protected: number;
} {
  return {
    total: branches.length,
    local: branches.filter((b) => b.isLocal).length,
    remote: branches.filter((b) => b.isRemote).length,
    merged: branches.filter((b) => b.isMerged).length,
    protected: branches.filter((b) => b.isProtected).length,
  };
}
