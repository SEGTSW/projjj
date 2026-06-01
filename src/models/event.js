import { EventPriority, EventStatus, EventType } from './enums.js';
import { assertFutureRange, toDate } from '../utils/dateUtils.js';
import { ValidationError } from '../utils/errors.js';

export class CalendarEvent {
  constructor({
    id,
    title,
    description = '',
    organizerId,
    participantIds = [],
    startAt,
    endAt,
    location = 'Online',
    type = EventType.MEETING,
    priority = EventPriority.NORMAL,
    reminderMinutes = [30],
    capacity = 20,
    status = EventStatus.SCHEDULED,
    cancellationReason = ''
  }) {
    if (!id || !title || !organizerId) {
      throw new ValidationError('event requires id, title and organizerId');
    }
    assertFutureRange(startAt, endAt, new Date('2000-01-01T00:00:00.000Z'));
    this.id = id;
    this.title = title;
    this.description = description;
    this.organizerId = organizerId;
    this.participantIds = [...new Set(participantIds)];
    this.startAt = toDate(startAt, 'startAt');
    this.endAt = toDate(endAt, 'endAt');
    this.location = location;
    this.type = type;
    this.priority = priority;
    this.reminderMinutes = [...new Set(reminderMinutes)].sort((a, b) => b - a);
    this.capacity = capacity;
    this.status = status;
    this.cancellationReason = cancellationReason;
    this.version = 1;
  }

  addParticipant(participantId) {
    if (this.status === EventStatus.CANCELLED) {
      throw new ValidationError('cancelled event cannot accept participants');
    }
    if (this.participantIds.length >= this.capacity && !this.participantIds.includes(participantId)) {
      throw new ValidationError('event capacity exceeded');
    }
    this.participantIds = [...new Set([...this.participantIds, participantId])];
    this.version += 1;
  }

  removeParticipant(participantId) {
    this.participantIds = this.participantIds.filter((id) => id !== participantId);
    this.version += 1;
  }

  reschedule(startAt, endAt) {
    assertFutureRange(startAt, endAt, new Date('2000-01-01T00:00:00.000Z'));
    this.startAt = toDate(startAt, 'startAt');
    this.endAt = toDate(endAt, 'endAt');
    this.status = EventStatus.RESCHEDULED;
    this.version += 1;
  }

  cancel(reason) {
    if (!reason || reason.trim().length < 3) {
      throw new ValidationError('cancellation reason must contain at least 3 characters');
    }
    this.status = EventStatus.CANCELLED;
    this.cancellationReason = reason.trim();
    this.version += 1;
  }

  isActive() {
    return this.status !== EventStatus.CANCELLED;
  }

  clone() {
    return new CalendarEvent({
      id: this.id,
      title: this.title,
      description: this.description,
      organizerId: this.organizerId,
      participantIds: this.participantIds,
      startAt: this.startAt,
      endAt: this.endAt,
      location: this.location,
      type: this.type,
      priority: this.priority,
      reminderMinutes: this.reminderMinutes,
      capacity: this.capacity,
      status: this.status,
      cancellationReason: this.cancellationReason
    });
  }
}
