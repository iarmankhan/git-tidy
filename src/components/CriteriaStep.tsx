import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { MultiSelect, TextInput } from '@inkjs/ui';
import type { FilterOptions, FilterCriteria } from '../types/index.js';
import { DEFAULT_STALE_DAYS, DEFAULT_AGE_DAYS } from '../utils/config.js';

interface CriteriaStepProps {
  onSelect: (filters: FilterOptions) => void;
  onBack: () => void;
}

type InputMode = 'select' | 'staleDays' | 'ageDays' | 'pattern';

export function CriteriaStep({ onSelect, onBack }: CriteriaStepProps) {
  const [selectedCriteria, setSelectedCriteria] = useState<FilterCriteria[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('select');
  const [staleDays, setStaleDays] = useState(String(DEFAULT_STALE_DAYS));
  const [ageDays, setAgeDays] = useState(String(DEFAULT_AGE_DAYS));
  const [pattern, setPattern] = useState('feature/*');
  const [inputError, setInputError] = useState<string | null>(null);

  // Validate numeric input
  const validateNumber = (value: string): number | null => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      return null;
    }
    return num;
  };

  const options = [
    {
      label: 'Merged branches (already merged into default branch)',
      value: 'merged' as FilterCriteria,
    },
    {
      label: `Stale branches (no commits in ${staleDays} days)`,
      value: 'stale' as FilterCriteria,
    },
    {
      label: `Branches older than ${ageDays} days`,
      value: 'age' as FilterCriteria,
    },
    {
      label: `Pattern matching: ${pattern}`,
      value: 'pattern' as FilterCriteria,
    },
  ];

  useInput((input, key) => {
    if (key.escape) {
      if (inputMode !== 'select') {
        setInputMode('select');
      } else {
        onBack();
      }
    }

    // Handle Enter to submit when in select mode
    if (key.return && inputMode === 'select') {
      handleSubmit();
    }
  });

  const handleCriteriaChange = (values: string[]) => {
    setSelectedCriteria(values as FilterCriteria[]);
  };

  const handleSubmit = () => {
    // Check if we need additional input
    if (selectedCriteria.includes('stale') && inputMode === 'select') {
      setInputMode('staleDays');
      return;
    }
    if (selectedCriteria.includes('age') && inputMode === 'staleDays') {
      setInputMode('ageDays');
      return;
    }
    if (selectedCriteria.includes('pattern') && inputMode === 'ageDays') {
      setInputMode('pattern');
      return;
    }
    if (selectedCriteria.includes('pattern') && inputMode === 'select') {
      setInputMode('pattern');
      return;
    }

    // All inputs collected, proceed
    const filters: FilterOptions = {
      merged: selectedCriteria.includes('merged'),
      stale: selectedCriteria.includes('stale'),
      staleDays: parseInt(staleDays, 10) || DEFAULT_STALE_DAYS,
      pattern: selectedCriteria.includes('pattern'),
      patternValue: pattern,
      age: selectedCriteria.includes('age'),
      ageDays: parseInt(ageDays, 10) || DEFAULT_AGE_DAYS,
    };

    onSelect(filters);
  };

  if (inputMode === 'staleDays') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="cyan">How many days without commits is considered stale?</Text>
        <Box>
          <TextInput
            defaultValue={staleDays}
            onSubmit={(value) => {
              const num = validateNumber(value);
              if (num === null) {
                setInputError('Please enter a valid number greater than 0');
                return;
              }
              setInputError(null);
              setStaleDays(String(num));
              if (selectedCriteria.includes('age')) {
                setInputMode('ageDays');
              } else if (selectedCriteria.includes('pattern')) {
                setInputMode('pattern');
              } else {
                handleSubmit();
              }
            }}
          />
          <Text color="gray"> days</Text>
        </Box>
        {inputError && <Text color="red">{inputError}</Text>}
      </Box>
    );
  }

  if (inputMode === 'ageDays') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="cyan">How many days old should a branch be?</Text>
        <Box>
          <TextInput
            defaultValue={ageDays}
            onSubmit={(value) => {
              const num = validateNumber(value);
              if (num === null) {
                setInputError('Please enter a valid number greater than 0');
                return;
              }
              setInputError(null);
              setAgeDays(String(num));
              if (selectedCriteria.includes('pattern')) {
                setInputMode('pattern');
              } else {
                handleSubmit();
              }
            }}
          />
          <Text color="gray"> days</Text>
        </Box>
        {inputError && <Text color="red">{inputError}</Text>}
      </Box>
    );
  }

  if (inputMode === 'pattern') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="cyan">Enter branch name pattern (use * as wildcard):</Text>
        <TextInput
          defaultValue={pattern}
          onSubmit={(value) => {
            setPattern(value);
            const filters: FilterOptions = {
              merged: selectedCriteria.includes('merged'),
              stale: selectedCriteria.includes('stale'),
              staleDays: parseInt(staleDays, 10) || DEFAULT_STALE_DAYS,
              pattern: selectedCriteria.includes('pattern'),
              patternValue: value,
              age: selectedCriteria.includes('age'),
              ageDays: parseInt(ageDays, 10) || DEFAULT_AGE_DAYS,
            };
            onSelect(filters);
          }}
        />
        <Text color="gray" dimColor>
          Examples: feature/*, hotfix/*, *-old, test-*
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="cyan" bold>
          Step 2:
        </Text>
        <Text> Which branches should be included? (select multiple)</Text>
      </Box>

      <Box marginLeft={2}>
        <MultiSelect
          options={options}
          onChange={handleCriteriaChange}
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>
          Use ↑↓ to navigate, Space to toggle, Enter to confirm
        </Text>
        <Text color="gray" dimColor>
          Press Esc to go back
        </Text>
      </Box>

      {selectedCriteria.length > 0 && (
        <Box marginTop={1}>
          <Text color="green">
            Press Enter to continue with {selectedCriteria.length} filter(s)
          </Text>
        </Box>
      )}
    </Box>
  );
}
