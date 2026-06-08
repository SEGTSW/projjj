import { ValidationError } from './errors.js';

export function toDate(value, fieldName = 'date') {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}

export function minutesBetween(start, end) {
  return Math.round((toDate(end, 'end') - toDate(start, 'start')) / 60000);
}

export function addMinutes(date, minutes) {
  return new Date(toDate(date).getTime() + minutes * 60000);
}

export function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
  return toDate(firstStart) < toDate(secondEnd) && toDate(secondStart) < toDate(firstEnd);
}

export function assertFutureRange(startAt, endAt, now = new Date()) {
  const start = toDate(startAt, 'startAt');
  const end = toDate(endAt, 'endAt');
  if (end <= start) {
    throw new ValidationError('endAt must be after startAt');
  }
  if (start < now) {
    throw new ValidationError('startAt must not be in the past');
  }
}
