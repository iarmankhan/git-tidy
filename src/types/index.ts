// Branch scope options
export type BranchScope = 'local' | 'remote' | 'both';

// Filter criteria types
export type FilterCriteria = 'merged' | 'stale' | 'pattern' | 'age';

export interface FilterOptions {
  merged: boolean;
  stale: boolean;
  staleDays: number;
  pattern: boolean;
  patternValue: string;
  age: boolean;
  ageDays: number;
}

// Branch information
export interface Branch {
  name: string;
  isLocal: boolean;
  isRemote: boolean;
  lastCommitDate: Date;
  isMerged: boolean;
  isProtected: boolean;
  isCurrentBranch: boolean;
}

// Branch with selection state for UI
export interface SelectableBranch extends Branch {
  selected: boolean;
}

// Deletion result for a single branch
export interface DeletionResult {
  branch: Branch;
  success: boolean;
  error?: string;
  deletedLocal: boolean;
  deletedRemote: boolean;
}

// Summary of all deletions
export interface DeletionSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: DeletionResult[];
}

// Repository information
export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  currentBranch: string;
  isGitHub: boolean;
}

// Wizard step names
export type WizardStep =
  | 'init'
  | 'scope'
  | 'criteria'
  | 'loading'
  | 'select'
  | 'confirm'
  | 'execute'
  | 'summary';

// CLI options from command line
export interface CLIOptions {
  execute: boolean;
  yes: boolean;
  token?: string;
}

// App state
export interface AppState {
  step: WizardStep;
  repoInfo: RepoInfo | null;
  scope: BranchScope;
  filters: FilterOptions;
  branches: Branch[];
  selectedBranches: Branch[];
  deletionSummary: DeletionSummary | null;
  error: string | null;
}
