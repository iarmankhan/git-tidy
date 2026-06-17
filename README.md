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
- **Non-interactive mode** - Run headless with flags and JSON output for scripts, CI, and AI agents

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
| `--dry-run` | Preview only; never delete (this is the default) |
| `-y, --yes` | Skip confirmations (for scripting) |
| `-t, --token <token>` | GitHub personal access token (or use `GITHUB_TOKEN` env) |
| `--json` | Output machine-readable JSON (implies non-interactive mode) |
| `--scope <scope>` | Branch scope: `local`, `remote`, or `both` (default: `both`) |
| `--merged` | Select branches already merged into the default branch |
| `--stale [days]` | Select branches with no commits in N days (default: 30) |
| `--age [days]` | Select branches older than N days (default: 60) |
| `--pattern <glob>` | Select branches whose name matches a glob (e.g. `"feature/*"`) |
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

## Non-interactive mode (scripts & agents)

Passing any selection flag (`--merged`, `--stale`, `--age`, `--pattern`) or `--json`
switches git-tidy into a headless mode — no wizard, no prompts. It stays **dry-run by
default**; add `--execute` to actually delete. This makes it easy to drive from scripts,
CI pipelines, or AI agents.

```bash
# List local merged branches that would be deleted (dry-run, human-readable)
git-tidy --merged --scope local

# Same, as JSON for machine parsing
git-tidy --merged --scope local --json

# Combine criteria (OR logic): stale OR matching a pattern
git-tidy --stale 30 --pattern 'feature/*' --json

# Actually delete local merged branches, no prompts
git-tidy --merged --scope local --execute --yes
```

Example `--json` output:

```json
{
  "dryRun": true,
  "scope": "local",
  "defaultBranch": "main",
  "criteria": ["merged"],
  "matched": [
    { "name": "feature/login", "merged": true, "location": "local", "lastCommit": "2026-06-17T08:18:11.000Z" }
  ],
  "deleted": [],
  "errors": []
}
```

The process exits non-zero if a deletion fails (or on invalid input), so scripts can
check the exit code. Protected and current branches are always excluded automatically.

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
