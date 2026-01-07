import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';

import { Header } from './components/Header.js';
import { ScopeStep } from './components/ScopeStep.js';
import { CriteriaStep } from './components/CriteriaStep.js';
import { BranchSelectStep } from './components/BranchSelectStep.js';
import { ConfirmStep } from './components/ConfirmStep.js';
import { ExecutionStep } from './components/ExecutionStep.js';
import { SummaryStep } from './components/SummaryStep.js';

import { useWizard } from './hooks/useWizard.js';
import { initGit, isGitRepo, getRepoInfo } from './services/git.js';
import { initGitHub, getDefaultBranch } from './services/github.js';
import { fetchBranches, filterBranches } from './services/branch-analyzer.js';

import type {
  RepoInfo,
  BranchScope,
  FilterOptions,
  Branch,
  DeletionSummary,
  CLIOptions,
} from './types/index.js';
import { DEFAULT_STALE_DAYS, DEFAULT_AGE_DAYS } from './utils/config.js';

interface AppProps {
  options: CLIOptions;
}

export function App({ options }: AppProps) {
  const { step, goToStep } = useWizard('init');

  // State
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [scope, setScope] = useState<BranchScope>('both');
  const [filters, setFilters] = useState<FilterOptions>({
    merged: false,
    stale: false,
    staleDays: DEFAULT_STALE_DAYS,
    pattern: false,
    patternValue: '',
    age: false,
    ageDays: DEFAULT_AGE_DAYS,
  });
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [executeForReal, setExecuteForReal] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize git
        initGit();

        // Check if we're in a git repo
        const isRepo = await isGitRepo();
        if (!isRepo) {
          setError('Not a git repository. Please run this command in a git repository.');
          return;
        }

        // Initialize GitHub if token is provided
        if (options.token || process.env.GITHUB_TOKEN) {
          initGitHub(options.token);
        }

        // Get repo info
        setLoadingMessage('Detecting repository...');
        let info = await getRepoInfo();

        if (info?.isGitHub && (options.token || process.env.GITHUB_TOKEN)) {
          // Get default branch from GitHub API
          setLoadingMessage('Fetching repository info from GitHub...');
          const defaultBranch = await getDefaultBranch(info.owner, info.repo);
          info = { ...info, defaultBranch };
        }

        setRepoInfo(info);
        goToStep('scope');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    initialize();
  }, [options.token, goToStep]);

  // Handle scope selection
  const handleScopeSelect = useCallback((selectedScope: BranchScope) => {
    setScope(selectedScope);
    goToStep('criteria');
  }, [goToStep]);

  // Handle criteria selection
  const handleCriteriaSelect = useCallback(async (selectedFilters: FilterOptions) => {
    setFilters(selectedFilters);
    goToStep('loading');
    setLoadingMessage('Fetching branches...');

    try {
      if (!repoInfo) {
        throw new Error('Repository info not available');
      }

      // Fetch branches
      const branches = await fetchBranches(
        scope,
        repoInfo.defaultBranch,
        repoInfo.currentBranch
      );
      setAllBranches(branches);

      // Apply filters
      setLoadingMessage('Analyzing branches...');
      const filtered = filterBranches(branches, selectedFilters);
      setFilteredBranches(filtered);

      goToStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    }
  }, [repoInfo, scope, goToStep]);

  // Handle branch selection
  const handleBranchSelect = useCallback((selected: Branch[]) => {
    setSelectedBranches(selected);
    goToStep('confirm');
  }, [goToStep]);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    goToStep('execute');
  }, [goToStep]);

  // Handle deletion complete
  const handleDeletionComplete = useCallback((summary: DeletionSummary) => {
    setDeletionSummary(summary);
    goToStep('summary');
  }, [goToStep]);

  // Handle delete for real after dry run
  const handleDeleteForReal = useCallback(() => {
    setExecuteForReal(true);
    setDeletionSummary(null);
    goToStep('execute');
  }, [goToStep]);

  // Handle cancel/back
  const handleBack = useCallback(() => {
    switch (step) {
      case 'criteria':
        goToStep('scope');
        break;
      case 'select':
        goToStep('criteria');
        break;
      case 'confirm':
        goToStep('select');
        break;
      default:
        break;
    }
  }, [step, goToStep]);

  // Render error state
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          Error: {error}
        </Text>
      </Box>
    );
  }

  // Render based on current step
  return (
    <Box flexDirection="column" padding={1}>
      <Header repoInfo={repoInfo} />

      {step === 'init' && (
        <Box gap={1}>
          <Spinner label={loadingMessage} />
        </Box>
      )}

      {step === 'loading' && (
        <Box gap={1}>
          <Spinner label={loadingMessage} />
        </Box>
      )}

      {step === 'scope' && <ScopeStep onSelect={handleScopeSelect} />}

      {step === 'criteria' && (
        <CriteriaStep onSelect={handleCriteriaSelect} onBack={handleBack} />
      )}

      {step === 'select' && (
        <BranchSelectStep
          branches={filteredBranches}
          onSelect={handleBranchSelect}
          onBack={handleBack}
        />
      )}

      {step === 'confirm' && (
        <ConfirmStep
          branches={selectedBranches}
          isDryRun={!options.execute}
          onConfirm={handleConfirm}
          onCancel={handleBack}
        />
      )}

      {step === 'execute' && (
        <ExecutionStep
          branches={selectedBranches}
          isDryRun={!options.execute && !executeForReal}
          onComplete={handleDeletionComplete}
        />
      )}

      {step === 'summary' && deletionSummary && (
        <SummaryStep
          summary={deletionSummary}
          isDryRun={!options.execute && !executeForReal}
          onDeleteForReal={handleDeleteForReal}
        />
      )}
    </Box>
  );
}
