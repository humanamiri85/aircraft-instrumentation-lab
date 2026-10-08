# Autonomous development

Codex → feature branch → implementation → local tests → commit → push.

GitHub Actions → create/update PR → CI → request squash auto-merge → main when repository requirements permit.

Codex Cloud does not need `api.github.com` access or a working GitHub CLI login. It uses native Git fetch/push and the platform's existing Git authentication. GitHub-hosted runners use their repository-scoped `GITHUB_TOKEN` for API operations; no personal access token is needed.

## One-time repository prerequisites

A repository administrator must enable **Allow GitHub Actions to create and approve pull requests**, **Allow auto-merge**, and squash merging in repository settings. Protect `main` with a required pull request and the **Aircraft Lab Validation** status check. Prevent direct pushes and bypasses. Select the check from the Validate workflow after its first successful run; automation does not change these settings. Mandatory human reviews or a merge queue may prevent fully unattended merging; keep them if required by repository policy. Missing permissions/settings cause an explicit workflow failure, never a bypass.

`gh pr merge --auto` can merge immediately when GitHub considers requirements satisfied. Requiring Aircraft Lab Validation on main is therefore essential for future commits to an already auto-enabled PR. The workflow also waits for successful validation of its exact push SHA and uses `--match-head-commit` to reject stale heads. Do not disable protection or permit feature branches to bypass it.

## Local workflow

Fetch `origin/main`, preserve local changes, and create a descriptive `feature-*`, `phase-*`, or `chore-*` branch from it. Never work directly on main. Use the existing isolated checkout, not a new worktree unless requested.

The application has no npm runtime dependencies or build step. Node.js 24 and Python 3.12 support the current tooling. Install optional browser tooling outside the checkout, preserving the manifest and avoiding a repository lockfile:

```sh
npm install --prefix /workspace/cloud-onboarding-tools --no-save --package-lock=false --cache /workspace/.npm-cache playwright@1.56.1
npm run check
npm test
PLAYWRIGHT_MODULE=/workspace/cloud-onboarding-tools/node_modules/playwright/index.mjs \
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

If Chromium is not preinstalled, use the installed Playwright CLI to install Chromium and its supported system dependencies. Set `CHROMIUM_PATH` to the result of Playwright's `chromium.executablePath()`. CI does this on Ubuntu 24.04. The full browser runner owns an ephemeral Python HTTP server, validates normal startup and intentional failures, and writes screenshots to `/tmp`. Expected errors in injected-failure and WebGL-disabled scenarios are distinct from regressions.

Fix failures without weakening tests. Review `git diff` and scientific conventions, independent inputs, accessibility, responsive behavior, reduced motion and optional-feature isolation. Commit with a concise title and a body covering implementation, tests, scientific/educational assumptions and known limitations, then push the feature branch. Successful local validation authorizes routine commit/push unless the user has restricted it.

## Actions behavior

`validate.yml` runs the stable **Aircraft Lab Validation** job on feature-pattern pushes and PRs targeting main. It installs pinned external Playwright tooling and Chromium, runs syntax checks, all unit tests and the complete browser regression. Any command failure fails the job.

`auto-pr.yml` runs only on feature-pattern pushes, with contents/pull-requests write and Actions read permissions. It creates one open PR to main or updates the existing PR, using the latest commit subject for the title and branch commit notes for the body. It waits for the Validate push run for the exact SHA, records the passing checks, verifies the PR head, then requests squash auto-merge. Failed, canceled, timed-out or absent validation never reaches that step. New pushes cancel older automation runs and validate the new head.

PR events generated with `GITHUB_TOKEN` do not trigger other workflows. Therefore branch-push validation is intentional, not optional: it supplies the check on the PR head without depending on the bot-created PR event. Human-created PRs also run PR validation against GitHub's merge ref. Existing repository requirements may add checks or block merges; this automation does not bypass them. This arrangement validates the automated feature head rather than guaranteeing a test of every later combination with main; require up-to-date branches if that guarantee is needed.

Both workflow files must be present on feature branches; branch from current main after the initial automation change is merged. If a run fails, inspect its Actions logs, fix the branch and push again. If the PR is already merged, start a new task branch. Squash merging and retaining feature branches leave an auditable history without force pushes or automatic branch deletion.
