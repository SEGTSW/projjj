export class DomainError extends Error {
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity, id) {
    super(`${entity} with id ${id} was not found`, 'NOT_FOUND');
    this.entity = entity;
    this.id = id;
  }
}

export class ValidationError extends DomainError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends DomainError {
  constructor(message, conflicts = []) {
    super(message, 'CONFLICT_ERROR');
    this.conflicts = conflicts;
  }
}
