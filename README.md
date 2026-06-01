# Event Planner Architecture

[![CI Quality Gate](https://github.com/OWNER/REPOSITORY/actions/workflows/ci-pipeline.yml/badge.svg)](https://github.com/OWNER/REPOSITORY/actions/workflows/ci-pipeline.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=event-planner-architecture&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=event-planner-architecture)

Додаток для планування подій на Node.js + React. Проєкт демонструє створення, зміну, перенесення та скасування подій з in-memory сховищем, патернами GoF, SOLID-архітектурою, 200+ тестами, CI/CD артефактами та Sonar-конфігурацією.

## Функціональність

- Створення подій з типом, пріоритетом, місткістю, локацією та нагадуваннями.
- Зміна і перенесення подій.
- Скасування подій через замінну cancellation policy.
- Перевірка конфліктів за учасниками та фізичною кімнатою.
- Блокування користувачів.
- Observer-сповіщення через in-app, email та SMS канали.

## Архітектура

```text
src/
  models/       Domain entities and enums
  services/     Use cases, Builder, Strategy, Observer
  storage/      Repository interface and in-memory implementation
  utils/        Errors, dates, ids
tests/          303 unit/integration tests
docs/           Requirements, architecture and UML diagrams
```

Використані патерни:

- Builder: `EventBuilder`
- Strategy: cancellation та reminder policies
- Observer: `NotificationCenter`

## Запуск

```bash
npm install
npm run dev
```

Для перевірки:

```bash
npm test
npm run lint
npm run test:ci
npm run build
```

`npm run test:ci` генерує:

- `reports/junit.xml`
- `reports/sonar-test-report.xml`
- `coverage/coverage.xml`
- `coverage/lcov.info`
- `coverage/index.html`

## Якість

Локально перевірено:

- 303 tests passed
- static check passed
- CI report generation passed

SonarCloud/SonarQube читає налаштування з `sonar-project.properties`. Для реального репозиторію потрібно додати `SONAR_TOKEN` у GitHub Secrets і замінити `OWNER/REPOSITORY` у badges.

## Документація

- Вимоги: `docs/requirements.md`
- Архітектура: `docs/architecture.md`
- UML:
  - `docs/diagrams/use-case.puml`
  - `docs/diagrams/domain-model.puml`
  - `docs/diagrams/class-diagram.puml`

## Branch Protection

Для захисту `main` у GitHub потрібно увімкнути:

- Require status checks to pass before merging.
- Required check: `quality`.
- Require branches to be up to date before merging.
- Block merge when Quality Gate або CI pipeline failed.
