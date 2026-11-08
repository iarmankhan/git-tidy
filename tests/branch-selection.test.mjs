import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('../bin/git-tidy.js', import.meta.url));
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test Author',
  GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Test Committer',
  GIT_COMMITTER_EMAIL: 'test@example.invalid',
};
delete gitEnv.GITHUB_TOKEN;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8' });
}

function preview(cwd, ...args) {
  const output = execFileSync(process.execPath, [cli, '--json', ...args], {
    cwd,
    env: gitEnv,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

test('remote merge status and same-name local branches are evaluated separately', () => {
  const root = mkdtempSync(join(tmpdir(), 'git-tidy-branches-'));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');

  try {
    git(root, 'init', '--bare', origin);
    git(root, 'init', '-b', 'trunk', work);
    writeFileSync(join(work, 'README.md'), 'initial\n');
    git(work, 'add', 'README.md');
    git(work, 'commit', '-m', 'initial');
    git(work, 'remote', 'add', 'origin', origin);
    git(work, 'push', '-u', 'origin', 'trunk');
    git(origin, 'symbolic-ref', 'HEAD', 'refs/heads/trunk');
    git(work, 'remote', 'set-head', 'origin', '-a');

    git(work, 'switch', '-c', 'merged-remote');
    writeFileSync(join(work, 'merged.txt'), 'merged\n');
    git(work, 'add', 'merged.txt');
    git(work, 'commit', '-m', 'merged branch');
    git(work, 'push', '-u', 'origin', 'merged-remote');
    git(work, 'switch', 'trunk');
    git(work, 'merge', '--no-ff', 'merged-remote', '-m', 'merge branch');
    git(work, 'push', 'origin', 'trunk');
    git(work, 'branch', '-D', 'merged-remote');

    git(work, 'switch', '-c', 'unmerged-remote');
    writeFileSync(join(work, 'unmerged.txt'), 'unmerged\n');
    git(work, 'add', 'unmerged.txt');
    git(work, 'commit', '-m', 'unmerged branch');
    git(work, 'push', '-u', 'origin', 'unmerged-remote');
    git(work, 'switch', 'trunk');
    git(work, 'branch', '-D', 'unmerged-remote');

    git(work, 'switch', '-c', 'shared');
    writeFileSync(join(work, 'shared.txt'), 'remote only\n');
    git(work, 'add', 'shared.txt');
    git(work, 'commit', '-m', 'remote shared branch');
    git(work, 'push', '-u', 'origin', 'shared');
    git(work, 'switch', 'trunk');
    git(work, 'branch', '-D', 'shared');
    git(work, 'branch', 'shared', 'trunk');

    const remote = preview(work, '--scope', 'remote', '--merged');
    assert.equal(remote.dryRun, true);
    assert.equal(remote.defaultBranch, 'trunk');
    assert(remote.matched.some((b) => b.name === 'merged-remote' && b.location === 'remote'));
    assert(!remote.matched.some((b) => b.name === 'unmerged-remote'));
    assert(!remote.matched.some((b) => b.name === 'shared'));

    const both = preview(work, '--scope', 'both', '--merged');
    assert(both.matched.some((b) => b.name === 'shared' && b.location === 'local'));
    assert(!both.matched.some((b) => b.name === 'shared' && b.location === 'remote'));

    const all = preview(work, '--scope', 'both');
    assert.deepEqual(
      all.matched.filter((b) => b.name === 'shared').map((b) => b.location).sort(),
      ['local', 'remote'],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
