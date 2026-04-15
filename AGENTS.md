
# Agents.md

Repository-level workflow guidance for human developers and automated coding agents.
Project-agnostic defaults: if the repo has stricter rules elsewhere, those take precedence.

## Scope and precedence
- Follow repo-specific docs first (CONTRIBUTING.md, SECURITY.md, CODEOWNERS, docs/, etc.).
- Do not bypass required CI checks, branch rules, or security controls.
- Keep changes reviewable: smallest coherent diff that meets the goal.

## Mandatory vs recommended checks

| Category | Mandatory (must pass to merge) | Recommended (run when relevant) |
| --- | --- | --- |
| Formatting | formatter in CI “check” mode; no style drift | full-repo reformat only as a dedicated PR |
| Lint & static analysis | configured linters / type checks | deeper SAST / security linters / policy checks |
| Tests | unit tests for changed logic | integration/e2e, fuzzing, perf/load tests |
| Supply chain | dependency lock/pinning checks (if configured) | SBOM generation, provenance/signing verification |

## Standard workflow (humans and agents)
1. Understand intent and constraints; do the minimal change that satisfies them.
2. Change code + tests + docs together when behavior changes.
3. Run mandatory checks locally before opening/updating a PR.
4. If a mandatory check fails: fix it or document why it does not apply.
5. Open a PR with:
   - what changed and why
   - risk notes (what could break)
   - proof (commands run + results)

## Pre-commit checks (linting/formatting)
- If the repo uses pre-commit hooks, treat them as mandatory:
  - Install hooks: `pre-commit install`
  - Run everything: `pre-commit run --all-files`
- Do not mix refactors with formatter-only churn unless required by the formatter.
- Prefer deterministic formatting (stable output across machines/CI).

## Testing expectations
- When behavior/logic changes, add or update tests in the same PR (except true emergencies).
- After any logic change, run unit tests. Run integration tests when touching boundaries:
  - I/O (filesystem), network/API calls, concurrency, persistence, authn/authz, migrations.
- Keep tests deterministic:
  - avoid time-based sleeps; isolate clock/randomness/network behind fakes where practical
  - no hidden reliance on CI-only environment

## CI requirements and merge gates
- Default/protected branches should require:
  - passing status checks (lint + tests at minimum)
  - human review (at least one approver; use CODEOWNERS if available)
- CI should run on pull requests (fast checks) and on merges to default branch (full checks).
- Cache dependencies for speed, but treat caches/artifacts as untrusted input (no secrets in caches).


## Dependency management and supply chain hygiene

-   Use lockfiles or equivalent pinning (reproducible installs). Avoid floating ranges for production deps.
-   Prefer automated dependency update PRs (e.g., Dependabot/Renovate); review and merge regularly.
-   Avoid “curl | bash” style installs in CI/build scripts. Pin downloads by version and (when feasible) hash.
-   Prefer deterministic builds; aim for verifiable provenance, and reproducible builds where feasible.
-   Avoid committing generated binaries; build artifacts should come from CI/release pipelines.

## Secrets handling

-   Never commit secrets (keys, tokens, credentials) or “example” secrets that could be real.
-   Use secret managers / CI secret stores; rotate on exposure.
-   Treat CI logs as public-by-default:
    -   never print tokens/secrets
    -   avoid dumping full env/context payloads
    -   scrub PII
-   Do not expose secrets to untrusted code paths (e.g., fork PRs); separate privileged workflows.

## Logging, observability, and operational robustness

-   Emit structured logs with stable fields (timestamp, level, component, request/task id).
-   Prefer vendor-neutral telemetry (logs/metrics/traces) and correlate signals when supported.
-   Handle transient failures with bounded retries + exponential backoff + jitter.
-   Never retry blindly on non-idempotent operations; design externally visible operations to be idempotent when possible (dedupe keys, upserts, compare-and-swap).

## Security and access control

-   Apply least privilege everywhere (CI job tokens, service accounts, API keys).
-   Pin CI dependencies (especially third-party actions) to immutable identifiers (e.g., commit SHA) when possible.
-   Consider signing commits/tags and release artifacts when the ecosystem supports it.
-   Maintain SECURITY.md describing how to report vulnerabilities privately (and supported versions).

## PR etiquette and code review quality

-   Keep PRs small, focused, and easy to review.
-   Include rationale, test evidence, and rollback notes for risky changes.
-   Avoid drive-by refactors.
-   Do a self-review before requesting review:
    -   scan for secrets, debug prints, accidental API changes, and unnecessary churn.

## Branching, commits, versioning, and changelogs

-   Prefer trunk-based development with short-lived branches.
-   Use a consistent commit convention (Conventional Commits recommended).
-   Use SemVer (or a repo-defined scheme) consistently for releases.
-   Keep CHANGELOG.md human-readable (Keep a Changelog recommended):
    -   maintain an “Unreleased” section and promote it at release time.

## Agent-specific notes (how agents should invoke checks)

-   Agents must explicitly report:
    -   which commands/checks they ran
    -   pass/fail results (and summaries of failures)
-   Agents should prefer repo-defined task runners (Make/Task/Just/npm scripts/etc.). If absent, infer commands from config files and keep changes minimal.
-   Agents must not:
    -   disable checks or loosen security settings to “make CI green”
    -   introduce new tooling or sweeping refactors unless explicitly requested
