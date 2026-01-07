import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import type { Branch, DeletionResult, DeletionSummary } from '../types/index.js';
import {
  deleteLocalBranch,
  deleteRemoteBranch as deleteRemoteBranchGit,
} from '../services/git.js';

interface ExecutionStepProps {
  branches: Branch[];
  isDryRun: boolean;
  onComplete: (summary: DeletionSummary) => void;
}

export function ExecutionStep({
  branches,
  isDryRun,
  onComplete,
}: ExecutionStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<DeletionResult[]>([]);
  const [isDeleting, setIsDeleting] = useState(true);

  useEffect(() => {
    const deleteBranches = async () => {
      const allResults: DeletionResult[] = [];

      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];
        setCurrentIndex(i);

        const result: DeletionResult = {
          branch,
          success: true,
          deletedLocal: false,
          deletedRemote: false,
        };

        if (isDryRun) {
          // Simulate deletion in dry run mode
          await new Promise((resolve) => setTimeout(resolve, 100));
          result.deletedLocal = branch.isLocal;
          result.deletedRemote = branch.isRemote;
        } else {
          // Actually delete the branch
          try {
            if (branch.isLocal) {
              await deleteLocalBranch(branch.name, true);
              result.deletedLocal = true;
            }
          } catch (error) {
            result.success = false;
            result.error = `Local: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }

          try {
            if (branch.isRemote) {
              await deleteRemoteBranchGit(branch.name);
              result.deletedRemote = true;
            }
          } catch (error) {
            if (!result.error) {
              result.success = false;
              result.error = `Remote: ${error instanceof Error ? error.message : 'Unknown error'}`;
            } else {
              result.error += `; Remote: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }
        }

        allResults.push(result);
        setResults([...allResults]);
      }

      setIsDeleting(false);

      // Create summary
      const summary: DeletionSummary = {
        total: branches.length,
        successful: allResults.filter((r) => r.success).length,
        failed: allResults.filter((r) => !r.success).length,
        skipped: 0,
        results: allResults,
      };

      // Small delay before completing to show final state
      await new Promise((resolve) => setTimeout(resolve, 500));
      onComplete(summary);
    };

    deleteBranches();
  }, [branches, isDryRun, onComplete]);

  const currentBranch = branches[currentIndex];
  const completedCount = results.length;

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          Step 5:
        </Text>
        <Text> {isDryRun ? 'Simulating deletion...' : 'Deleting branches...'}</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
      >
        {isDeleting && currentBranch && (
          <Box gap={1}>
            <Spinner label="" />
            <Text>
              {isDryRun ? 'Processing' : 'Deleting'} {currentBranch.name}
            </Text>
            <Text color="gray">
              ({completedCount + 1}/{branches.length})
            </Text>
          </Box>
        )}

        {!isDeleting && (
          <Text color="green">
            {isDryRun ? 'Simulation' : 'Deletion'} complete!
          </Text>
        )}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color="gray">Results:</Text>
        <Box marginLeft={2} flexDirection="column">
          {results.slice(-8).map((result, index) => (
            <Box key={result.branch.name} gap={1}>
              <Text color={result.success ? 'green' : 'red'}>
                {result.success ? '✓' : '✗'}
              </Text>
              <Text color={result.success ? 'gray' : 'red'}>
                {result.branch.name}
              </Text>
              {result.deletedLocal && <Text color="cyan" dimColor>(local)</Text>}
              {result.deletedRemote && <Text color="magenta" dimColor>(remote)</Text>}
              {result.error && (
                <Text color="red" dimColor>
                  - {result.error}
                </Text>
              )}
            </Box>
          ))}
          {results.length > 8 && (
            <Text color="gray" dimColor>
              ... and {results.length - 8} more
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
