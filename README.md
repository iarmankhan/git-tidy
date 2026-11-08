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
- **Default branch detection** - Uses the local `origin/HEAD` reference, or the GitHub API when a token is available
- **Batch selection** - Select all, none, or invert selection with keyboard shortcuts
- **Local & remote** - Delete both local and remote branches in one go
- **Delete after dry-run** - Option to execute deletion right after reviewing dry-run results
- **Non-interactive mode** - Run headless with flags and JSON output for scripts, CI, and AI agents

## Usage

No install needed — run it directly in any git repository with `npx`:

```bash
npx git-tidy-cli
```

> The examples below use `git-tidy` for brevity. If you haven't installed it globally,
> just prefix any command with `npx git-tidy-cli` instead — e.g. `npx git-tidy-cli --merged --json`.

### Install (optional)

Prefer a shorter command? Install it globally so you can run `git-tidy` directly:

```bash
npm install -g git-tidy-cli
git-tidy
```

<details>
<summary>From source</summary>

```bash
git clone https://github.com/iarmankhan/git-tidy.git
cd git-tidy
npm install
npm run build
npm link
```
</details>

### Options

| Flag | Description |
|------|-------------|
| `-x, --execute` | Actually delete branches (default: dry-run mode) |
| `--dry-run` | Preview only; never delete (this is the default) |
| `-y, --yes` | Skip confirmations (for scripting) |
| `-t, --token <token>` | GitHub personal access token (or use `GITHUB_TOKEN` env) |
| `--json` | Output machine-readable JSON (implies non-interactive mode) |
| `--scope <scope>` | Branch scope: `local`, `remote`, or `both` (default: `both`). In `both`, local and remote branches are listed separately, even when they share a name. |
| `--match <mode>` | How filters combine: `any` (OR, default) or `all` (AND) |
| `--merged` | Select branches already merged into the default branch |
| `--stale [days]` | Select branches with no commits in N days (default: 30) |
| `--age [days]` | Select branches whose tip commit's author date is older than N days (default: 60) |
| `--newer-than [days]` | Select branches with a commit within the last N days (default: 7) |
| `--pattern <glob>` | Select branches whose name matches a glob (e.g. `"feature/*"`) |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

Merge status is checked against the detected default branch. If `origin/HEAD` is absent and no GitHub token is provided, the CLI falls back to `main`; check the reported default branch before deleting anything.

### Examples

```bash
# Interactive mode (dry-run by default) — no install needed
npx git-tidy-cli

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

### Combining filters: `--match any` (OR) vs `--match all` (AND)

By default, multiple filters are OR'd — a branch matches if it matches **any**
of them. Use `--match all` to require **all** active filters (AND), which lets
you target a precise intersection like "sync branches older than a week" or
"merged feature branches older than 90 days":

```bash
# AND: sync-* branches older than 1 week (not just any sync branch)
git-tidy --match all --pattern 'sync-*' --age 7 --json

# AND: sync-* branches NEWER than 1 week (--newer-than is the inverse of --age)
git-tidy --match all --pattern 'sync-*' --newer-than 7 --json

# AND: feature branches merged into the default branch AND older than 90 days
git-tidy --match all --merged --pattern 'feature/*' --age 90 --scope remote --json
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

## Agent skill

git-tidy ships a skill at [`skills/git-tidy/`](skills/git-tidy/) that teaches an AI agent
to use git-tidy safely — the preview-first workflow, the safety model, and the filter
recipes.

Install it into your agent's skills directory:

```bash
cp -r skills/git-tidy ~/.claude/skills/
```

If you installed git-tidy from npm, it's bundled at `node_modules/git-tidy-cli/skills/git-tidy/`.

Then ask your agent things like *"tidy up the merged branches older than 90 days on
origin"* — it'll dry-run, show you the matches, and delete only after you confirm.

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

## How it is structured

- `src/cli.ts` parses the command line and selects the interactive or headless path.
- `src/services/branch-analyzer.ts` gathers branch facts and applies the selected criteria.
- `src/services/git.ts` performs local and remote Git operations; `src/services/github.ts` helps identify the default branch.
- `src/app.tsx` and `src/components/` implement the terminal wizard, while `src/headless.ts` formats non-interactive results.

The same selection logic serves both interfaces. The default is preview-only; an explicit execute action is required before deletion. For a quick check without touching branches, run `npx git-tidy-cli --merged --scope local --json` in a repository.

This repository does not currently include a committed screenshot or automated test suite. The available checks are `npm run typecheck` and `npm run build`.

## Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [@inkjs/ui](https://github.com/vadimdemedes/ink-ui) - UI components (Select, MultiSelect, Spinner)
- [simple-git](https://github.com/steveukx/git-js) - Git operations
- [@octokit/rest](https://github.com/octokit/rest.js) - GitHub API
- [Commander.js](https://github.com/tj/commander.js) - CLI argument parsing
- TypeScript + tsup

## License

MIT
