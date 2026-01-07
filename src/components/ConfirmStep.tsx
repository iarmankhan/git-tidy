import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { Branch } from '../types/index.js';

interface ConfirmStepProps {
  branches: Branch[];
  isDryRun: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmStep({
  branches,
  isDryRun,
  onConfirm,
  onCancel,
}: ConfirmStepProps) {
  const localCount = branches.filter((b) => b.isLocal).length;
  const remoteCount = branches.filter((b) => b.isRemote).length;

  useInput((input, key) => {
    if (key.return) {
      onConfirm();
    }
    if (key.escape || input === 'n' || input === 'N') {
      onCancel();
    }
    if (input === 'y' || input === 'Y') {
      onConfirm();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          Step 4:
        </Text>
        <Text> Confirm deletion</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="yellow"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text bold>Ready to delete {branches.length} branch(es)</Text>

        <Box marginTop={1} gap={2}>
          <Text>
            Local: <Text color="cyan">{localCount}</Text>
          </Text>
          <Text>
            Remote: <Text color="magenta">{remoteCount}</Text>
          </Text>
        </Box>

        {isDryRun && (
          <Box marginTop={1}>
            <Text color="yellow" bold>
              DRY RUN MODE - No branches will actually be deleted
            </Text>
          </Box>
        )}

        {!isDryRun && (
          <Box marginTop={1}>
            <Text color="red" bold>
              WARNING: This will permanently delete these branches!
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="column">
        <Text color="gray">Branches to delete:</Text>
        <Box marginLeft={2} flexDirection="column">
          {branches.slice(0, 10).map((branch) => (
            <Text key={branch.name} color="gray">
              - {branch.name}{' '}
              <Text dimColor>
                ({branch.isLocal && 'local'}
                {branch.isLocal && branch.isRemote && ', '}
                {branch.isRemote && 'remote'})
              </Text>
            </Text>
          ))}
          {branches.length > 10 && (
            <Text color="gray" dimColor>
              ... and {branches.length - 10} more
            </Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1} gap={2}>
        <Text color="green">[Enter/Y] Confirm</Text>
        <Text color="red">[Esc/N] Cancel</Text>
      </Box>
    </Box>
  );
}
