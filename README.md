# git-tidy

An interactive CLI tool for cleaning up unused git branches. Built with [Ink](https://github.com/vadimdemedes/ink) for a beautiful terminal UI experience.

## Features

- **Interactive wizard** - Step-by-step guided cleanup process
- **Dry-run by default** - Safe mode that shows what would be deleted without actually deleting
- **Multiple filter criteria** - Filter branches by:
  - Merged status (already merged into default branch)
  - Stale branches (no commits in X days)
  - Age-based (branches older than X days)
  - Pattern matching (e.g., `feature/*`, `hotfix/*`)
- **Smart defaults** - Auto-detects default branch via GitHub API
- **Batch selection** - Select all, none, or invert selection with keyboard shortcuts
- **Local & remote** - Delete both local and remote branches in one go
- **Delete after dry-run** - Option to execute deletion right after reviewing dry-run results

## Installation

```bash
# Install globally from npm
npm install -g git-tidy-cli
```

### From source

```bash
# Clone the repository
git clone https://github.com/ArmandBrworworworx/git-tidy.git
cd git-tidy

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

## Usage

Simply run `git-tidy` in any git repository:

```bash
git-tidy
```

### Options

| Flag | Description |
|------|-------------|
| `-x, --execute` | Actually delete branches (default: dry-run mode) |
| `-y, --yes` | Skip confirmations (for scripting) |
| `-t, --token <token>` | GitHub personal access token (or use `GITHUB_TOKEN` env) |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

### Examples

```bash
# Interactive mode (dry-run by default)
git-tidy

# Actually delete branches
git-tidy --execute

# Use with GitHub token for better API access
git-tidy --token ghp_xxxxxxxxxxxx
# or
GITHUB_TOKEN=ghp_xxxxxxxxxxxx git-tidy
```

## Workflow

1. **Scope Selection** - Choose to clean local, remote, or both
2. **Filter Criteria** - Select which branches to include (merged, stale, pattern, etc.)
3. **Branch Selection** - Review and select specific branches to delete
4. **Confirmation** - Review summary before deletion
5. **Execution** - Watch progress as branches are deleted
6. **Summary** - See results with option to delete for real after dry-run

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate |
| `Space` | Toggle selection |
| `Enter` | Confirm / Proceed |
| `Esc` | Go back |
| `a` | Select all (in branch selection) |
| `n` | Select none (in branch selection) |
| `i` | Invert selection (in branch selection) |
| `d` | Delete for real (after dry-run) |
| `q` | Quit |

## Safety

- **Dry-run by default** - No branches are deleted unless you pass `--execute` or press `d` after a dry-run
- **Protected branches** - Automatically protects `main`, `master`, `develop`, and the repository's default branch
- **Current branch protection** - Never deletes the branch you're currently on
- **Confirmation step** - Always shows a summary before any deletion

## Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [@inkjs/ui](https://github.com/vadimdemedes/ink-ui) - UI components (Select, MultiSelect, Spinner)
- [simple-git](https://github.com/steveukx/git-js) - Git operations
- [@octokit/rest](https://github.com/octokit/rest.js) - GitHub API
- [Commander.js](https://github.com/tj/commander.js) - CLI argument parsing
- TypeScript + tsup

## License

MIT
