# Архітектура

Проєкт побудований як невелика layered architecture.

## Шари

- Models: `CalendarEvent`, `Participant`, `NotificationMessage`.
- Services: `EventService`, `EventBuilder`, policies, strategies, notification center.
- Storage: `Repository`, `InMemoryRepository`.
- React UI: робочий інтерфейс для створення, перенесення та скасування подій.

## GoF патерни

- Builder: `EventBuilder` дає гнучку конфігурацію подій без довгого конструктора в UI.
- Strategy: `StrictCancellationPolicy`, `FlexibleCancellationPolicy`, `DefaultReminderStrategy`, `PriorityReminderStrategy`.
- Observer: `NotificationCenter` і `RecordingNotificationObserver`.

## SOLID

- SRP: кожен сервіс відповідає за одну частину бізнес-логіки.
- OCP: нові політики конфліктів, скасування чи нагадувань додаються без зміни `EventService`.
- LSP: альтернативні strategy/policy класи мають однаковий контракт.
- ISP: репозиторій має малий контракт.
- DIP: `EventService` отримує залежності через constructor injection.
