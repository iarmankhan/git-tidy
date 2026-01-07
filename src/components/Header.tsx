import React from 'react';
import { Box, Text } from 'ink';
import type { RepoInfo } from '../types/index.js';

interface HeaderProps {
  repoInfo: RepoInfo | null;
}

export function Header({ repoInfo }: HeaderProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={0}
      marginBottom={1}
    >
      <Box>
        <Text color="cyan" bold>
          git-tidy
        </Text>
        <Text color="gray"> - Branch Cleanup Tool</Text>
      </Box>

      {repoInfo && (
        <Box gap={2}>
          <Text color="gray">
            Repository:{' '}
            <Text color="white">
              {repoInfo.owner}/{repoInfo.repo}
            </Text>
          </Text>
          <Text color="gray">
            Branch:{' '}
            <Text color="green">{repoInfo.currentBranch}</Text>
          </Text>
          <Text color="gray">
            Default:{' '}
            <Text color="yellow">{repoInfo.defaultBranch}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
}
