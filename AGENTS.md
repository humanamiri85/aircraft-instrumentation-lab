# Autonomous development

- Use the existing cloud checkout; tasks are already isolated. Do not create a worktree unless requested.
- Never develop directly on `main`. Before new work, fetch `origin/main`, preserve existing changes, and create one descriptive feature branch from the latest main: `feature-*`, `phase-*`, or `chore-*`.
- Preserve existing behavior unless the task explicitly changes it.
- Run `npm run check`, the full `npm test` suite, and the complete `npm run test:browser` suite. See `docs/autonomous-development.md` for browser setup.
- Fix failures before committing. Never remove, disable, or weaken tests to obtain passing results.
- Review the final diff, including unintended files and application behavior changes.
- Preserve scientific correctness and documented teaching simplifications. Distinguish physical models, educational models, and visual mappings; preserve aviation sign conventions; avoid unintended variable coupling; reuse existing models; never present conceptual geometry as certified hardware.
- Preserve accessibility, Teaching Focus, responsive layouts, reduced motion, and optional-feature failure isolation.
- After successful validation, commit and push the completed feature branch without waiting for routine human approval, unless the user explicitly restricts those actions. Describe the objective, implementation, test results, assumptions, and limitations in the commit body so PR automation can carry them forward.
- GitHub Actions creates or updates the PR, validates the exact pushed commit, and requests squash auto-merge. Do not depend on GitHub API access or `gh` authentication from Codex Cloud.
- Never force-push main, push feature content directly to main, bypass failed CI, disable branch protection, or use external long-lived tokens for this workflow. Use repository-scoped `GITHUB_TOKEN` in Actions.

Repository rules and CI remain authoritative gates; see the documented one-time repository configuration prerequisites.
