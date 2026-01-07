import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { MultiSelect } from '@inkjs/ui';
import type { Branch } from '../types/index.js';
import { formatDaysAgo } from '../utils/date.js';

interface BranchSelectStepProps {
  branches: Branch[];
  onSelect: (selected: Branch[]) => void;
  onBack: () => void;
}

export function BranchSelectStep({
  branches,
  onSelect,
  onBack,
}: BranchSelectStepProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectKey, setSelectKey] = useState(0);

  // Create options for MultiSelect
  const options = useMemo(() => {
    return branches.map((branch) => {
      const location = branch.isLocal && branch.isRemote
        ? 'local+remote'
        : branch.isLocal
          ? 'local'
          : 'remote';

      const status = branch.isMerged ? 'merged' : 'not merged';
      const age = formatDaysAgo(branch.lastCommitDate);

      return {
        label: `${branch.name}`,
        value: branch.name,
        hint: `(${status}, ${age}, ${location})`,
      };
    });
  }, [branches]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    // Submit on Enter
    if (key.return && selectedValues.length > 0) {
      const selected = branches.filter((b) => selectedValues.includes(b.name));
      onSelect(selected);
      return;
    }

    // Select all
    if (input === 'a') {
      setSelectedValues(branches.map((b) => b.name));
      setSelectKey(k => k + 1);
    }

    // Select none
    if (input === 'n') {
      setSelectedValues([]);
      setSelectKey(k => k + 1);
    }

    // Invert selection
    if (input === 'i') {
      const inverted = branches
        .filter((b) => !selectedValues.includes(b.name))
        .map((b) => b.name);
      setSelectedValues(inverted);
      setSelectKey(k => k + 1);
    }
  });

  const handleChange = (values: string[]) => {
    setSelectedValues(values);
  };

  const handleSubmit = () => {
    const selected = branches.filter((b) => selectedValues.includes(b.name));
    onSelect(selected);
  };

  if (branches.length === 0) {
    return (
      <Box flexDirection="column" gap={1}>
        <Box>
          <Text color="cyan" bold>
            Step 3:
          </Text>
          <Text> Select branches to delete</Text>
        </Box>
        <Box marginLeft={2}>
          <Text color="yellow">No branches match your criteria.</Text>
        </Box>
        <Text color="gray" dimColor>
          Press Esc to go back and adjust filters
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          Step 3:
        </Text>
        <Text> Select branches to delete ({branches.length} found)</Text>
      </Box>

      <Box marginLeft={2} gap={2}>
        <Text color="gray">[a] Select all</Text>
        <Text color="gray">[n] Select none</Text>
        <Text color="gray">[i] Invert</Text>
      </Box>

      <Box marginLeft={2} flexDirection="column">
        <MultiSelect
          key={selectKey}
          options={options}
          defaultValue={selectedValues}
          onChange={handleChange}
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>
          ↑↓ navigate, Space toggle, Enter confirm, Esc back
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={selectedValues.length > 0 ? 'green' : 'gray'}>
          {selectedValues.length} branch(es) selected
        </Text>
        {selectedValues.length > 0 && (
          <Text color="gray"> - Press Enter to continue</Text>
        )}
      </Box>
    </Box>
  );
}
