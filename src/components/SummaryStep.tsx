import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { DeletionSummary } from '../types/index.js';

interface SummaryStepProps {
  summary: DeletionSummary;
  isDryRun: boolean;
  onDeleteForReal?: () => void;
}

export function SummaryStep({ summary, isDryRun, onDeleteForReal }: SummaryStepProps) {
  const { exit } = useApp();

  useInput((input, key) => {
    // Delete for real after dry run
    if (isDryRun && (input === 'd' || input === 'D')) {
      onDeleteForReal?.();
      return;
    }

    // Exit on any other key
    if (input === 'q' || input === 'Q' || key.escape) {
      exit();
      return;
    }

    // If not dry run, any key exits
    if (!isDryRun) {
      exit();
    }
  });

  const successColor = summary.successful > 0 ? 'green' : 'gray';
  const failedColor = summary.failed > 0 ? 'red' : 'gray';

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          {isDryRun ? 'Dry Run Complete!' : 'Cleanup Complete!'}
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={summary.failed > 0 ? 'yellow' : 'green'}
        paddingX={2}
        paddingY={1}
      >
        <Box flexDirection="column" gap={0}>
          <Box gap={1}>
            <Text color={successColor}>✓</Text>
            <Text>
              {summary.successful} branch(es){' '}
              {isDryRun ? 'would be deleted' : 'deleted successfully'}
            </Text>
          </Box>

          {summary.failed > 0 && (
            <Box gap={1}>
              <Text color={failedColor}>✗</Text>
              <Text color={failedColor}>{summary.failed} branch(es) failed</Text>
            </Box>
          )}

          {summary.skipped > 0 && (
            <Box gap={1}>
              <Text color="gray">○</Text>
              <Text color="gray">{summary.skipped} branch(es) skipped</Text>
            </Box>
          )}
        </Box>
      </Box>

      {isDryRun && summary.successful > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={2}>
            <Text color="red" bold>[d] Delete for real</Text>
            <Text color="gray">[q] Quit</Text>
          </Box>
        </Box>
      )}

      {isDryRun && summary.successful === 0 && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press any key to exit
          </Text>
        </Box>
      )}

      {summary.failed > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red">Failed branches:</Text>
          <Box marginLeft={2} flexDirection="column">
            {summary.results
              .filter((r) => !r.success)
              .slice(0, 5)
              .map((result) => (
                <Text key={result.branch.name} color="red">
                  - {result.branch.name}: {result.error}
                </Text>
              ))}
            {summary.results.filter((r) => !r.success).length > 5 && (
              <Text color="gray" dimColor>
                ... and {summary.results.filter((r) => !r.success).length - 5} more
              </Text>
            )}
          </Box>
        </Box>
      )}

      {!isDryRun && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press any key to exit
          </Text>
        </Box>
      )}
    </Box>
  );
}
