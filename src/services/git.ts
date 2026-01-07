import simpleGit, { SimpleGit } from 'simple-git';
import type { Branch, RepoInfo } from '../types/index.js';
import { matchesProtectedPattern } from '../utils/config.js';

let git: SimpleGit;

/**
 * Initialize git instance for the current directory
 */
export function initGit(cwd?: string): SimpleGit {
  git = simpleGit(cwd);
  return git;
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  const result = await git.revparse(['--abbrev-ref', 'HEAD']);
  return result.trim();
}

/**
 * Get remote URL and extract owner/repo for GitHub
 */
export async function getRemoteInfo(): Promise<{ owner: string; repo: string; isGitHub: boolean } | null> {
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');

    if (!origin?.refs?.fetch) {
      return null;
    }

    const url = origin.refs.fetch;

    // Parse GitHub URL (SSH or HTTPS)
    // SSH: git@github.com:owner/repo.git
    // HTTPS: https://github.com/owner/repo.git
    const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
    const httpsMatch = url.match(/https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);

    const match = sshMatch || httpsMatch;
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        isGitHub: true,
      };
    }

    return { owner: '', repo: '', isGitHub: false };
  } catch {
    return null;
  }
}

/**
 * Get all local branches with their last commit dates
 */
export async function getLocalBranches(defaultBranch: string, currentBranch: string): Promise<Branch[]> {
  const branches: Branch[] = [];

  try {
    // Get all local branches
    const branchSummary = await git.branchLocal();

    for (const branchName of branchSummary.all) {
      // Get last commit date for this branch
      const logResult = await git.log({
        [branchName]: null,
        maxCount: 1,
        format: { date: '%aI' },
      });

      const lastCommitDate = logResult.latest?.date
        ? new Date(logResult.latest.date)
        : new Date();

      // Check if branch is merged into default branch
      const isMerged = await isBranchMerged(branchName, defaultBranch);

      // Check if protected
      const isProtected =
        branchName === defaultBranch || matchesProtectedPattern(branchName);

      branches.push({
        name: branchName,
        isLocal: true,
        isRemote: false,
        lastCommitDate,
        isMerged,
        isProtected,
        isCurrentBranch: branchName === currentBranch,
      });
    }
  } catch (error) {
    console.error('Error getting local branches:', error);
  }

  return branches;
}

/**
 * Get all remote branches
 */
export async function getRemoteBranches(defaultBranch: string): Promise<Branch[]> {
  const branches: Branch[] = [];

  try {
    // Fetch to ensure we have latest remote info
    await git.fetch(['--prune']);

    // Get all remote branches
    const result = await git.branch(['-r']);

    for (const branchName of result.all) {
      // Skip HEAD pointer
      if (branchName.includes('HEAD')) continue;

      // Remove 'origin/' prefix for display
      const shortName = branchName.replace(/^origin\//, '');

      // Skip if it's the default branch
      if (shortName === defaultBranch) continue;

      // Get last commit date
      const logResult = await git.log({
        [branchName]: null,
        maxCount: 1,
        format: { date: '%aI' },
      });

      const lastCommitDate = logResult.latest?.date
        ? new Date(logResult.latest.date)
        : new Date();

      // Check if merged into default branch
      const isMerged = await isBranchMerged(branchName, `origin/${defaultBranch}`);

      // Check if protected
      const isProtected =
        shortName === defaultBranch || matchesProtectedPattern(shortName);

      branches.push({
        name: shortName,
        isLocal: false,
        isRemote: true,
        lastCommitDate,
        isMerged,
        isProtected,
        isCurrentBranch: false,
      });
    }
  } catch (error) {
    console.error('Error getting remote branches:', error);
  }

  return branches;
}

/**
 * Check if a branch is merged into the target branch
 */
export async function isBranchMerged(branch: string, target: string): Promise<boolean> {
  try {
    const result = await git.raw(['branch', '--merged', target]);
    const mergedBranches = result
      .split('\n')
      .map((b) => b.trim().replace(/^\*\s*/, ''));
    return mergedBranches.includes(branch) || mergedBranches.includes(branch.replace(/^origin\//, ''));
  } catch {
    return false;
  }
}

/**
 * Delete a local branch
 */
export async function deleteLocalBranch(branchName: string, force = false): Promise<void> {
  const flag = force ? '-D' : '-d';
  await git.branch([flag, branchName]);
}

/**
 * Delete a remote branch
 */
export async function deleteRemoteBranch(branchName: string, remote = 'origin'): Promise<void> {
  await git.push([remote, '--delete', branchName]);
}

/**
 * Get full repository info
 */
export async function getRepoInfo(defaultBranch?: string): Promise<RepoInfo | null> {
  try {
    const currentBranch = await getCurrentBranch();
    const remoteInfo = await getRemoteInfo();

    return {
      owner: remoteInfo?.owner || '',
      repo: remoteInfo?.repo || '',
      defaultBranch: defaultBranch || 'main',
      currentBranch,
      isGitHub: remoteInfo?.isGitHub || false,
    };
  } catch {
    return null;
  }
}
