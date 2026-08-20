# Changelog

All notable changes to **Test Nexus** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-08-20

### Added
- **Multi-project tabs** with per-project theme colour, logo thumbnail, and dynamic contrast text
- **Custom React hooks** — `useSocket` (Socket.io wrapper) and `useBurndown` (analytics data)
- **Excel service module** (`server/services/testCaseExcelService.js`) — centralises all ExcelJS import/export/sync logic
- **Structured logger** (`server/lib/logger.js`) — JSON-formatted log lines with timestamp and level
- **Global Express error handler** (`server/middleware/errorHandler.js`) — consistent error responses
- **Input validation middleware** (`server/middleware/validate.js`) — schema-driven request validation applied to POST /api/defects
- **Jest test suite** — unit tests for `SubscriptionScreen` (React Testing Library) and integration tests for `/api/defects` (Supertest)
- **Docker Compose** configuration for Postgres + Express + React
- **`.env.example`** template for safe onboarding
- **`README.md`** with quick-start, Docker, and project structure docs
- **`CONTRIBUTING.md`** with branching strategy and PR guidelines
- **GitHub Actions CI** workflow — installs, lints, and tests on every push/PR
- **Dependabot** configuration for automated dependency updates

### Changed
- `client/src/App.jsx` — reduced god-file by extracting socket and burndown logic into custom hooks
- `server/routes/testCases.js` — delegated Excel sync handler to `testCaseExcelService`
- `server/index.js` — 404 handler now delegates to `next(err)` for unified error responses; startup log uses structured logger

### Fixed
- Excel sync route now correctly propagates 403/404 errors instead of always returning 500

---

## [Unreleased]

- Pending items will be recorded here as work continues.
