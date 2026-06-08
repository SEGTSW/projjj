# Security and Quality Gate

## Dependency vulnerabilities

Поточний репозиторій `SEGTSW/projjj` не містить пакетів `tough-cookie` або `lodash`.

Перевірка:

```bash
npm ls tough-cookie lodash --all
npm audit --audit-level=low
```

Локальний результат:

- `npm ls tough-cookie lodash --all`: packages are absent.
- `npm audit --audit-level=low`: `found 0 vulnerabilities`.

## SonarQube / SonarCloud

Проєкт налаштований на Sonar через `sonar-project.properties`.

Quality Gate має перевіряти:

- Bugs: 0.
- Vulnerabilities: 0.
- Security Hotspots reviewed.
- Coverage: at least 90%.
- Code Smells rating: A або B.

CI запускає SonarCloud scan через `.github/workflows/ci-pipeline.yml`.
Секрет `SONAR_TOKEN` має бути доданий у GitHub repository secrets. Якщо секрет відсутній, pipeline не повинен вважатися успішним, бо Sonar Quality Gate фактично не перевірявся.

## Coverage

Покриття генерується реальним інструментом `c8`, а не вручну створеним файлом.

Команда:

```bash
npm run test:ci
```

Генерує:

- `coverage/lcov.info` для SonarQube/SonarCloud.
- `coverage/coverage.xml` у Cobertura XML форматі.
- `coverage/index.html` для ручного перегляду.
- `reports/junit.xml`.
- `reports/sonar-test-report.xml`.

Локальний результат останнього прогону:

- Statements: 99.69%.
- Branches: 94.44%.
- Functions: 100%.
- Lines: 99.69%.
- Tests: 312 passed.
