# git-tidy recipes & output

All examples are dry-run (safe) unless they include `--execute`. Add `--execute --yes`
to actually delete once the preview looks right.

## Recipes

```bash
# Safe local cleanup: branches merged into the default branch
git-tidy --merged --scope local --json

# Old merged branches on origin (merged AND >= 90 days) — classic housekeeping
git-tidy --match all --merged --age 90 --scope remote --json

# Stale auto-sync branches: sync-* older than a week
git-tidy --match all --pattern 'sync-*' --age 7 --scope remote --json

# The inverse — sync-* created within the last week
git-tidy --match all --pattern 'sync-*' --newer-than 7 --scope remote --json

# Broad OR sweep: anything merged OR stale 30d OR matching a pattern
git-tidy --merged --stale 30 --pattern 'wip/*' --scope local --json

# Merged feature branches older than 60 days, on origin, actually delete
git-tidy --match all --merged --pattern 'feature/*' --age 60 --scope remote --execute --yes --json
```

## JSON output shape

```json
{
  "dryRun": true,
  "scope": "remote",
  "defaultBranch": "main",
  "match": "all",
  "criteria": ["merged", "age>90d"],
  "matched": [
    { "name": "feature/old-thing", "merged": true, "location": "remote", "lastCommit": "2025-01-04T12:00:00.000Z" }
  ],
  "deleted": [],
  "errors": []
}
```

- `matched` — branches selected by the filters (what *would* be deleted in dry-run).
- `deleted` — populated only with `--execute`; `errors` lists per-branch failures.
- On invalid input (e.g. bad `--scope`/`--match`) the process prints an error and exits non-zero.

## Agent tips

- **Verify your view is complete** before reporting: there is no substitute for the tool's own output, but if you cross-check with raw git, use `git branch -r` or `git ls-remote --heads origin` (a `for-each-ref 'refs/remotes/origin/*'` glob silently skips names containing `/`).
- **Never delete on `remote`/`both` without explicit user confirmation** of the count and scope — these changes hit the shared origin and are irreversible.
- **`--merged` only protects work** when it's merged into the *default* branch. Branches merged only into a non-default integration branch still count as unmerged here, so they're preserved.
- To get accurate default-branch detection on GitHub repos, pass `--token` or set `GITHUB_TOKEN`.
