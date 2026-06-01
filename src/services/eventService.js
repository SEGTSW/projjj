import { EventStatus, NotificationChannel } from '../models/enums.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';

export class EventService {
  constructor({
    eventRepository,
    participantRepository,
    eventBuilderFactory,
    conflictPolicies,
    cancellationPolicy,
    reminderStrategy,
    notificationCenter
  }) {
    this.eventRepository = eventRepository;
    this.participantRepository = participantRepository;
    this.eventBuilderFactory = eventBuilderFactory;
    this.conflictPolicies = conflictPolicies;
    this.cancellationPolicy = cancellationPolicy;
    this.reminderStrategy = reminderStrategy;
    this.notificationCenter = notificationCenter;
  }

  createEvent(command) {
    this.#assertParticipantsAvailable([command.organizerId, ...(command.participantIds ?? [])]);
    const event = this.eventBuilderFactory()
      .titled(command.title)
      .describedAs(command.description ?? '')
      .organizedBy(command.organizerId)
      .withParticipants(command.participantIds ?? [])
      .from(command.startAt)
      .to(command.endAt)
      .at(command.location ?? 'Online')
      .asType(command.type)
      .withPriority(command.priority)
      .withCapacity(command.capacity ?? 20)
      .withReminders(command.reminderMinutes ?? [30])
      .build();
    this.#assertNoConflicts(event);
    this.eventRepository.save(event);
    this.notificationCenter.notifyEvent(
      event,
      'Event created',
      `${event.title} was scheduled`,
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    );
    return event;
  }

  updateEvent(id, patch) {
    const event = this.#getEvent(id);
    if (event.status === EventStatus.CANCELLED) {
      throw new ValidationError('cancelled event cannot be changed');
    }
    if (patch.title !== undefined) event.title = patch.title;
    if (patch.description !== undefined) event.description = patch.description;
    if (patch.location !== undefined) event.location = patch.location;
    if (patch.priority !== undefined) event.priority = patch.priority;
    if (patch.reminderMinutes !== undefined) event.reminderMinutes = [...patch.reminderMinutes];
    if (patch.startAt !== undefined || patch.endAt !== undefined) {
      event.reschedule(patch.startAt ?? event.startAt, patch.endAt ?? event.endAt);
    } else {
      event.version += 1;
    }
    this.#assertNoConflicts(event);
    this.eventRepository.save(event);
    this.notificationCenter.notifyEvent(event, 'Event updated', `${event.title} was changed`);
    return event;
  }

  cancelEvent(id, reason, now = new Date()) {
    const event = this.#getEvent(id);
    const decision = this.cancellationPolicy.canCancel(event, now);
    if (!decision.allowed) {
      throw new ValidationError(decision.reason);
    }
    event.cancel(reason);
    this.eventRepository.save(event);
    this.notificationCenter.notifyEvent(event, 'Event cancelled', reason, [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS
    ]);
    return event;
  }

  addParticipant(eventId, participantId) {
    const event = this.#getEvent(eventId);
    this.#assertParticipantsAvailable([participantId]);
    event.addParticipant(participantId);
    this.#assertNoConflicts(event);
    this.eventRepository.save(event);
    this.notificationCenter.notifyEvent(event, 'Participant added', participantId);
    return event;
  }

  removeParticipant(eventId, participantId) {
    const event = this.#getEvent(eventId);
    event.removeParticipant(participantId);
    this.eventRepository.save(event);
    this.notificationCenter.notifyEvent(event, 'Participant removed', participantId);
    return event;
  }

  listEvents(filter = {}) {
    return this.eventRepository.findAll()
      .filter((event) => filter.status ? event.status === filter.status : true)
      .filter((event) => filter.organizerId ? event.organizerId === filter.organizerId : true)
      .sort((left, right) => left.startAt - right.startAt);
  }

  getReminderSchedule(eventId) {
    return this.reminderStrategy.buildSchedule(this.#getEvent(eventId));
  }

  #getEvent(id) {
    const event = this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event', id);
    }
    return event;
  }

  #assertParticipantsAvailable(participantIds) {
    participantIds.forEach((participantId) => {
      const participant = this.participantRepository.findById(participantId);
      if (!participant) {
        throw new NotFoundError('Participant', participantId);
      }
      if (participant.blocked) {
        throw new ValidationError(`participant ${participantId} is blocked`);
      }
    });
  }

  #assertNoConflicts(candidate) {
    const events = this.eventRepository.findAll();
    const conflicts = this.conflictPolicies.flatMap((policy) => policy.findConflicts(candidate, events));
    if (conflicts.length > 0) {
      throw new ConflictError('event has scheduling conflicts', conflicts);
    }
  }
}
