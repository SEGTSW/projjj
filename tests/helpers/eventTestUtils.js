import { EventPriority, EventType, NotificationChannel } from '../../src/models/enums.js';
import { Participant } from '../../src/models/participant.js';
import { InMemoryRepository } from '../../src/storage/inMemoryRepository.js';
import { SequentialIdGenerator } from '../../src/utils/idGenerator.js';
import { EventBuilder } from '../../src/services/eventBuilder.js';
import { EventService } from '../../src/services/eventService.js';
import { StrictCancellationPolicy } from '../../src/services/cancellationPolicy.js';
import { NoParticipantOverlapPolicy, SameLocationOverlapPolicy } from '../../src/services/conflictPolicy.js';
import { NotificationCenter, RecordingNotificationObserver } from '../../src/services/notificationCenter.js';
import { PriorityReminderStrategy } from '../../src/services/reminderStrategy.js';

export function participant(id, blocked = false) {
  return new Participant({ id, name: `User ${id}`, email: `${id}@example.com`, blocked });
}

export function runtime({ cancellationPolicy = new StrictCancellationPolicy(), reminderStrategy = new PriorityReminderStrategy() } = {}) {
  const participantRepository = new InMemoryRepository([
    participant('u-1'),
    participant('u-2'),
    participant('u-3'),
    participant('u-4'),
    participant('blocked', true)
  ]);
  const eventRepository = new InMemoryRepository();
  const idGenerator = new SequentialIdGenerator('event');
  const notificationCenter = new NotificationCenter();
  const observer = new RecordingNotificationObserver(NotificationChannel.IN_APP);
  notificationCenter.subscribe(observer);
  const service = new EventService({
    eventRepository,
    participantRepository,
    eventBuilderFactory: () => new EventBuilder(idGenerator),
    conflictPolicies: [new NoParticipantOverlapPolicy(), new SameLocationOverlapPolicy()],
    cancellationPolicy,
    reminderStrategy,
    notificationCenter
  });
  return { service, participantRepository, eventRepository, observer };
}

export function command(index, overrides = {}) {
  const day = String(10 + (index % 10)).padStart(2, '0');
  const hour = String(8 + (index % 8)).padStart(2, '0');
  return {
    title: `Planning ${index}`,
    description: `Scenario ${index}`,
    organizerId: 'u-1',
    participantIds: ['u-2'],
    startAt: new Date(`2026-07-${day}T${hour}:00:00.000Z`),
    endAt: new Date(`2026-07-${day}T${hour}:45:00.000Z`),
    location: `Room ${index}`,
    type: EventType.MEETING,
    priority: EventPriority.NORMAL,
    reminderMinutes: [60, 30],
    capacity: 5,
    ...overrides
  };
}
