import { CalendarEvent } from '../models/event.js';
import { EventPriority, EventType } from '../models/enums.js';

export class EventBuilder {
  #data;

  constructor(idGenerator) {
    this.idGenerator = idGenerator;
    this.#data = {
      participantIds: [],
      location: 'Online',
      type: EventType.MEETING,
      priority: EventPriority.NORMAL,
      reminderMinutes: [30],
      capacity: 20
    };
  }

  titled(title) {
    this.#data.title = title;
    return this;
  }

  describedAs(description) {
    this.#data.description = description;
    return this;
  }

  organizedBy(organizerId) {
    this.#data.organizerId = organizerId;
    return this;
  }

  from(startAt) {
    this.#data.startAt = startAt;
    return this;
  }

  to(endAt) {
    this.#data.endAt = endAt;
    return this;
  }

  at(location) {
    this.#data.location = location;
    return this;
  }

  asType(type) {
    this.#data.type = type;
    return this;
  }

  withPriority(priority) {
    this.#data.priority = priority;
    return this;
  }

  withParticipants(participantIds) {
    this.#data.participantIds = [...participantIds];
    return this;
  }

  withCapacity(capacity) {
    this.#data.capacity = capacity;
    return this;
  }

  withReminders(reminderMinutes) {
    this.#data.reminderMinutes = [...reminderMinutes];
    return this;
  }

  build() {
    return new CalendarEvent({
      id: this.#data.id ?? this.idGenerator.next(),
      ...this.#data
    });
  }
}
