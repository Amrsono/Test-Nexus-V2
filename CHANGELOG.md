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

### Added
- **Comprehensive Offline Test Suites**: Expanded test coverage across client and server with mocked Prisma and zero external dependencies:
  - `server/routes/__tests__/testCases.test.js` (CRUD, status transitions, batch updates, schema validation)
  - `server/routes/__tests__/reports.test.js` (PPT report generator, 404/200 handling)
  - `server/routes/__tests__/auth.test.js` (Registration, login, password hashing, JWT)
  - `server/routes/__tests__/projects.test.js` (Project CRUD, validation)
  - `server/middleware/__tests__/errorHandler.test.js` (Typed `AppError` hierarchy)
  - `client/src/components/__tests__/AdminDashboard.test.jsx` (Overview, Users, Settings tab flows)
  - `client/src/components/__tests__/BurndownPanel.test.jsx` (Chart and statistics rendering)
  - `client/src/components/__tests__/ExecutiveHero.test.jsx` (Quality gate calculation)
  - `client/src/components/__tests__/TeamModal.test.jsx` (Tester and capacity management)
  - `client/src/components/__tests__/AIInsightsPanel.test.jsx` (Risk feed and suggested actions)
- **Centralized API Client** (`client/src/services/api.js`): Axios client with auth interceptors and normalized error extraction.
- **Modern Toast Notification System** (`client/src/hooks/useToast.js` & `client/src/components/ToastNotification.jsx`): Non-blocking alert replacement.
- **Typed Error Hierarchy** (`server/middleware/errorHandler.js`): `AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`.
- **Validation Schema Registry** (`server/middleware/schemas.js`): Standardized schemas across all endpoints.

### Changed
- **Modularized Excel Services**: Split `server/services/testCaseExcelService.js` (754 LOC) into focused submodules (`excelStyles.js`, `excelExport.js`, `excelBurndownSheet.js`, `excelSync.js`), all <400 LOC.
- **Refactored `AdminDashboard.jsx`**: Decomposed from 555 LOC monolithic component down to ~180 LOC by extracting `AdminInsightsTab.jsx`, `AdminUsersTab.jsx`, and `AdminSettingsTab.jsx`.
- **Modular Frontend Architecture**: Extracted `ExecutiveHero.jsx`, `BurndownPanel.jsx`, `AIInsightsPanel.jsx`, `TeamModal.jsx`, `ScenarioEditorModal.jsx`, `HeaderNav.jsx`, `DefectModal.jsx`.
- **Optimized CI Workflow**: Split `.github/workflows/ci.yml` into fast offline unit tests, DB integration tests, linting, build, and dependency audit jobs.
- **Coverage Configuration**: Configured Jest `--coverage` in workspace packages.

