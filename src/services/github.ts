import { Octokit } from '@octokit/rest';

let octokit: Octokit | null = null;

/**
 * Initialize GitHub API client with token
 */
export function initGitHub(token?: string): Octokit {
  const authToken = token || process.env.GITHUB_TOKEN;

  octokit = new Octokit({
    auth: authToken,
  });

  return octokit;
}

/**
 * Check if GitHub client is authenticated
 */
export function isAuthenticated(): boolean {
  return octokit !== null;
}

/**
 * Get the default branch for a repository
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  if (!octokit) {
    return 'main'; // Fallback if not authenticated
  }

  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data.default_branch;
  } catch (error) {
    console.error('Error fetching default branch:', error);
    return 'main';
  }
}

/**
 * Check if a branch has any open pull requests
 */
export async function branchHasOpenPR(
  owner: string,
  repo: string,
  branchName: string
): Promise<boolean> {
  if (!octokit) {
    return false;
  }

  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      head: `${owner}:${branchName}`,
    });
    return data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Delete a branch via GitHub API
 */
export async function deleteBranchViaAPI(
  owner: string,
  repo: string,
  branchName: string
): Promise<void> {
  if (!octokit) {
    throw new Error('GitHub client not initialized');
  }

  await octokit.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
  });
}

/**
 * Get repository information
 */
export async function getRepoInfo(owner: string, repo: string): Promise<{
  defaultBranch: string;
  private: boolean;
  description: string | null;
} | null> {
  if (!octokit) {
    return null;
  }

  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return {
      defaultBranch: data.default_branch,
      private: data.private,
      description: data.description,
    };
  } catch {
    return null;
  }
}

/**
 * List all branches from GitHub API
 */
export async function listBranches(
  owner: string,
  repo: string
): Promise<Array<{ name: string; protected: boolean }>> {
  if (!octokit) {
    return [];
  }

  try {
    const branches: Array<{ name: string; protected: boolean }> = [];
    let page = 1;

    while (true) {
      const { data } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      for (const branch of data) {
        branches.push({
          name: branch.name,
          protected: branch.protected,
        });
      }

      if (data.length < 100) break;
      page++;
    }

    return branches;
  } catch {
    return [];
  }
}
