// Default configuration values
export const DEFAULT_STALE_DAYS = 30;
export const DEFAULT_AGE_DAYS = 60;

// Protected branch patterns (in addition to auto-detected default branch)
export const PROTECTED_PATTERNS = [
  'main',
  'master',
  'develop',
  'development',
  'staging',
  'production',
  'release/*',
];

/**
 * Check if a branch name matches any protected pattern
 */
export function matchesProtectedPattern(branchName: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return branchName.startsWith(prefix + '/');
    }
    return branchName === pattern;
  });
}
