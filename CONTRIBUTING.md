# Contributing to Test Nexus

Thank you for considering a contribution! This guide explains how to get set up and how we work.

---

## Getting Started

1. **Fork** this repository and clone your fork locally.
2. Follow the [Quick Start](README.md#quick-start) instructions to get the project running.
3. Create a dedicated branch from `main` for your change.

---

## Branching Strategy

| Branch prefix | Purpose |
|--------------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Tooling, deps, CI changes |
| `docs/` | Documentation only |
| `test/` | Adding or improving tests |

Example: `feat/add-jira-integration` or `fix/excel-sync-403`.

---

## Development Workflow

```bash
# Create a branch
git checkout -b feat/my-feature

# Start dev servers
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Pull Request Guidelines

- **One concern per PR** — keep changes focused.
- **Write tests** — new features and bug fixes should include tests. The repo is evaluated on task capacity; test-paired commits are what matter.
- **Update the CHANGELOG** — add a line under `[Unreleased]` describing your change.
- **Fill in the PR template** — title, problem, solution, screenshots if UI.
- **Green CI required** — all PRs must pass the GitHub Actions CI check before merging.

---

## Code Style

This project uses **Prettier** for formatting. Run `npm run lint` before committing.

Key conventions:
- Single quotes in JS/JSX
- 2-space indentation
- No unused imports
- Meaningful variable names — avoid `data`, `res`, `obj` as standalone names

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add burndown chart export to PDF
fix: correct 403 status code on excel sync
chore: upgrade exceljs to v4.4.0
docs: update README quick start section
test: add Supertest integration for defects route
```

---

## Questions?

Open a GitHub Discussion or tag the project owner in an issue. We're happy to help.
