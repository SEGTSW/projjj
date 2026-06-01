# Testing Rules

- Use the built-in `node:test` runner.
- Keep tests in `tests/*.test.js`.
- Run `npm test` for fast local checks.
- Run `npm run test:ci` before submitting; it creates:
  - `reports/junit.xml`
  - `reports/sonar-test-report.xml`
  - `coverage/coverage.xml`
  - `coverage/lcov.info`
  - `coverage/index.html`
- Keep at least 200 test cases.
- Cover edge cases: overlapping schedules, blocked participants, cancelled events, capacity limits, reminder strategies and cancellation windows.
- Prefer isolated tests with fresh in-memory repositories per scenario.
