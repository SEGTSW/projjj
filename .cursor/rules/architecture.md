# Architecture Rules

The project is a Node.js + React event planner using in-memory architecture.

## Layers

- `src/models`: domain entities and enums. Models validate their own invariants.
- `src/services`: use cases and replaceable policies. Services depend on abstractions and injected collaborators.
- `src/storage`: repository contracts and in-memory implementations.
- `src/utils`: pure helpers and domain errors.
- `src/App.jsx`: React UI that calls the domain service but does not contain scheduling rules.

## Required patterns

- Builder: `EventBuilder` creates flexible event configurations.
- Strategy: cancellation and reminder algorithms are replaceable.
- Observer: `NotificationCenter` dispatches messages to subscribed notification observers.

## Hard constraints

- No external database.
- No external API calls in business logic.
- No direct mutation of repository internals outside repository methods.
- New repositories must expose `save`, `findById`, `findAll` and `delete`.
