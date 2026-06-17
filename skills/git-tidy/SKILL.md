---
name: git-tidy
description: Safely clean up stale, merged, or pattern-matched git branches using the git-tidy CLI in non-interactive mode. Use when asked to tidy/clean up/prune/delete git branches, remove merged or stale branches, clean a repo's branch list, or do branch housekeeping on local or remote (origin) branches.
---

# git-tidy — safe branch cleanup for agents

`git-tidy` deletes unused git branches. In headless mode it takes filter flags and
emits JSON, so an agent can preview and act without the interactive wizard.

Requires `git-tidy-cli` (`npm i -g git-tidy-cli`, needs Node ≥ 22). Run from inside the repo.

## Safety model (read first)

- **Dry-run by default.** Without `--execute`, nothing is deleted — it only reports what *would* be.
- **Protected branches are always excluded:** `main`, `master`, `develop`, `development`, `staging`, `production`, `release/*`, and the current branch.
- **"Merged" means merged into the default branch** — deleting such a branch loses no work (its commits live on in the default branch). This is the safest criterion.
- **Remote deletions are irreversible and affect the whole team.** Always dry-run first, and confirm with the user before `--execute` on `--scope remote`/`both`.
- Exit code is non-zero on any deletion failure or invalid input.

## Workflow

1. **Preview** with `--json` (dry-run). Parse `matched[]`.
2. **Review** the list. For remote or large (>~20) sets, show the user and get explicit confirmation.
3. **Execute** by re-running the same flags plus `--execute --yes`.
4. **Verify** with another `--json` run (should match 0) or `git ls-remote --heads origin`.

## Key flags

| Flag | Meaning |
|---|---|
| `--json` | Machine-readable output; implies non-interactive mode |
| `--scope local\|remote\|both` | Where to look (default `both`) |
| `--merged` | Branches merged into the default branch (safe to delete) |
| `--stale [days]` / `--age [days]` | No commits in / older than N days |
| `--newer-than [days]` | Commit within the last N days (inverse of `--age`) |
| `--pattern <glob>` | Name matches a glob, e.g. `'sync-*'`, `'feature/*'` |
| `--match any\|all` | Combine filters with OR (`any`, default) or AND (`all`) |
| `--execute` / `--dry-run` | Actually delete / preview only (default) |
| `--yes` | Skip confirmations (use with `--execute` in scripts) |
| `-t, --token` | GitHub token (or `GITHUB_TOKEN` env) for default-branch detection |

**Use `--match all` for precise intersections** (e.g. `sync-*` AND older than a week). With the default `any`, adding `--age` to `--pattern` *broadens* the set (OR) — a common footgun.

## Most common task

```bash
# 1. preview merged branches older than 90 days on origin
git-tidy --match all --merged --age 90 --scope remote --json
# 2. (after user confirms) delete them
git-tidy --match all --merged --age 90 --scope remote --execute --yes --json
```

See [EXAMPLES.md](EXAMPLES.md) for more recipes and the JSON output shape.
