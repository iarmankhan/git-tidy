import type { Branch, FilterOptions, BranchScope } from '../types/index.js';
import { isOlderThan } from '../utils/date.js';
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

    // If 'both', merge remote info with local branches
    if (scope === 'both') {
      for (const remoteBranch of remoteBranches) {
        const existingIndex = branches.findIndex(
          (b) => b.name === remoteBranch.name
        );
        if (existingIndex >= 0) {
          // Branch exists locally and remotely
          branches[existingIndex].isRemote = true;
        } else {
          // Remote-only branch
          branches.push(remoteBranch);
        }
      }
    } else {
      branches = remoteBranches;
    }
  }

  return branches;
}

/**
 * Apply all filters to branches
 */
export function filterBranches(
  branches: Branch[],
  filters: FilterOptions
): Branch[] {
  let filtered = [...branches];

  // Always exclude protected and current branches
  filtered = filtered.filter((b) => !b.isProtected && !b.isCurrentBranch);

  // If no filters selected, return all non-protected branches
  const hasFilters =
    filters.merged || filters.stale || filters.pattern || filters.age;

  if (!hasFilters) {
    return filtered;
  }

  // Apply filters (OR logic - branch matches if it matches ANY filter)
  filtered = filtered.filter((branch) => {
    const matches: boolean[] = [];

    if (filters.merged) {
      matches.push(branch.isMerged);
    }

    if (filters.stale) {
      matches.push(isOlderThan(branch.lastCommitDate, filters.staleDays));
    }

    if (filters.age) {
      matches.push(isOlderThan(branch.lastCommitDate, filters.ageDays));
    }

    if (filters.pattern && filters.patternValue) {
      matches.push(matchesPattern(branch.name, filters.patternValue));
    }

    // Return true if branch matches any of the active filters
    return matches.some((m) => m === true);
  });

  return filtered;
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
