import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import type { BranchScope } from '../types/index.js';

interface ScopeStepProps {
  onSelect: (scope: BranchScope) => void;
}

export function ScopeStep({ onSelect }: ScopeStepProps) {
  const options = [
    {
      label: 'Both local and remote branches',
      value: 'both' as BranchScope,
    },
    {
      label: 'Local branches only',
      value: 'local' as BranchScope,
    },
    {
      label: 'Remote branches only',
      value: 'remote' as BranchScope,
    },
  ];

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          Step 1:
        </Text>
        <Text> What would you like to clean up?</Text>
      </Box>

      <Box marginLeft={2}>
        <Select
          options={options}
          onChange={(value) => onSelect(value as BranchScope)}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Use ↑↓ to navigate, Enter to select
        </Text>
      </Box>
    </Box>
  );
}
