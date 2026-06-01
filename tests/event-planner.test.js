import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarEvent } from '../src/models/event.js';
import { EventPriority, EventStatus, EventType, NotificationChannel } from '../src/models/enums.js';
import { Participant } from '../src/models/participant.js';
import { InMemoryRepository } from '../src/storage/inMemoryRepository.js';
import { SequentialIdGenerator } from '../src/utils/idGenerator.js';
import { EventBuilder } from '../src/services/eventBuilder.js';
import { EventService } from '../src/services/eventService.js';
import { FlexibleCancellationPolicy, StrictCancellationPolicy } from '../src/services/cancellationPolicy.js';
import { NoParticipantOverlapPolicy, SameLocationOverlapPolicy } from '../src/services/conflictPolicy.js';
import { NotificationCenter, RecordingNotificationObserver } from '../src/services/notificationCenter.js';
import { DefaultReminderStrategy, PriorityReminderStrategy } from '../src/services/reminderStrategy.js';
import { addMinutes, minutesBetween, overlaps } from '../src/utils/dateUtils.js';

function participant(id, blocked = false) {
  return new Participant({ id, name: `User ${id}`, email: `${id}@example.com`, blocked });
}

function runtime({ cancellationPolicy = new StrictCancellationPolicy(), reminderStrategy = new PriorityReminderStrategy() } = {}) {
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

function command(index, overrides = {}) {
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

for (let i = 0; i < 45; i += 1) {
  test(`creates valid event variant ${i}`, () => {
    const { service, observer } = runtime();
    const event = service.createEvent(command(i, {
      priority: Object.values(EventPriority)[i % Object.values(EventPriority).length],
      type: Object.values(EventType)[i % Object.values(EventType).length]
    }));
    assert.equal(event.status, EventStatus.SCHEDULED);
    assert.equal(service.listEvents().length, 1);
    assert.equal(observer.messages.length, 2);
  });
}

for (let i = 0; i < 30; i += 1) {
  test(`rejects participant overlap conflict ${i}`, () => {
    const { service } = runtime();
    service.createEvent(command(i, { location: `A-${i}` }));
    assert.throws(() => service.createEvent(command(i, {
      location: `B-${i}`,
      startAt: new Date(command(i).startAt.getTime() + 5 * 60000),
      endAt: new Date(command(i).endAt.getTime() + 5 * 60000)
    })), /scheduling conflicts/);
  });
}

for (let i = 0; i < 25; i += 1) {
  test(`rejects same physical location overlap ${i}`, () => {
    const { service } = runtime();
    service.createEvent(command(i, { organizerId: 'u-1', participantIds: ['u-2'], location: 'Main Hall' }));
    assert.throws(() => service.createEvent(command(i, {
      organizerId: 'u-3',
      participantIds: ['u-4'],
      location: 'Main Hall',
      startAt: new Date(command(i).startAt.getTime() + 10 * 60000),
      endAt: new Date(command(i).endAt.getTime() + 10 * 60000)
    })), /scheduling conflicts/);
  });
}

for (let i = 0; i < 25; i += 1) {
  test(`updates event fields and version ${i}`, () => {
    const { service } = runtime();
    const event = service.createEvent(command(i));
    const updated = service.updateEvent(event.id, {
      title: `Updated ${i}`,
      description: 'Changed',
      location: `Updated Room ${i}`,
      reminderMinutes: [15]
    });
    assert.equal(updated.title, `Updated ${i}`);
    assert.equal(updated.description, 'Changed');
    assert.equal(updated.location, `Updated Room ${i}`);
    assert.deepEqual(updated.reminderMinutes, [15]);
    assert.equal(updated.version, 2);
  });
}

for (let i = 0; i < 20; i += 1) {
  test(`reschedules event without conflicts ${i}`, () => {
    const { service } = runtime();
    const event = service.createEvent(command(i));
    const updated = service.updateEvent(event.id, {
      startAt: addMinutes(event.startAt, 90),
      endAt: addMinutes(event.endAt, 90)
    });
    assert.equal(updated.status, EventStatus.RESCHEDULED);
    assert.equal(minutesBetween(event.startAt, event.endAt), 45);
  });
}

for (let i = 0; i < 16; i += 1) {
  test(`strict cancellation policy blocks late critical event ${i}`, () => {
    const policy = new StrictCancellationPolicy();
    const event = new CalendarEvent(command(i, {
      id: `critical-${i}`,
      priority: EventPriority.CRITICAL,
      startAt: new Date('2026-08-01T10:00:00.000Z'),
      endAt: new Date('2026-08-01T11:00:00.000Z')
    }));
    const decision = policy.canCancel(event, new Date('2026-08-01T09:00:00.000Z'));
    assert.equal(decision.allowed, false);
  });
}

for (let i = 0; i < 16; i += 1) {
  test(`flexible cancellation allows event ${i}`, () => {
    const { service } = runtime({ cancellationPolicy: new FlexibleCancellationPolicy() });
    const event = service.createEvent(command(i));
    const cancelled = service.cancelEvent(event.id, 'No longer needed');
    assert.equal(cancelled.status, EventStatus.CANCELLED);
    assert.equal(cancelled.cancellationReason, 'No longer needed');
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`adds and removes participants ${i}`, () => {
    const { service } = runtime();
    const event = service.createEvent(command(i, { participantIds: ['u-2'], capacity: 4 }));
    service.addParticipant(event.id, 'u-3');
    assert.deepEqual(service.listEvents()[0].participantIds.sort(), ['u-2', 'u-3']);
    service.removeParticipant(event.id, 'u-2');
    assert.deepEqual(service.listEvents()[0].participantIds, ['u-3']);
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`rejects blocked participant ${i}`, () => {
    const { service } = runtime();
    assert.throws(() => service.createEvent(command(i, { participantIds: ['blocked'] })), /blocked/);
  });
}

for (let i = 0; i < 20; i += 1) {
  test(`repository saves finds lists and deletes ${i}`, () => {
    const repository = new InMemoryRepository();
    const item = { id: `item-${i}`, value: i };
    repository.save(item);
    assert.equal(repository.findById(item.id), item);
    assert.equal(repository.findAll().length, 1);
    assert.equal(repository.delete(item.id), true);
    assert.equal(repository.findById(item.id), null);
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`builder configures event ${i}`, () => {
    const builder = new EventBuilder(new SequentialIdGenerator('b'));
    const built = builder
      .titled(`Built ${i}`)
      .organizedBy('u-1')
      .withParticipants(['u-2', 'u-2'])
      .from(new Date('2026-09-01T10:00:00.000Z'))
      .to(new Date('2026-09-01T11:00:00.000Z'))
      .at('Design Lab')
      .asType(EventType.WORKSHOP)
      .withPriority(EventPriority.HIGH)
      .withCapacity(12)
      .withReminders([10, 60, 10])
      .build();
    assert.equal(built.title, `Built ${i}`);
    assert.equal(built.participantIds.length, 1);
    assert.deepEqual(built.reminderMinutes, [60, 10]);
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`priority reminder strategy adds critical reminders ${i}`, () => {
    const strategy = new PriorityReminderStrategy();
    const event = new CalendarEvent(command(i, {
      id: `rem-${i}`,
      priority: EventPriority.CRITICAL,
      startAt: new Date('2026-10-01T12:00:00.000Z'),
      endAt: new Date('2026-10-01T13:00:00.000Z'),
      reminderMinutes: [30]
    }));
    const schedule = strategy.buildSchedule(event);
    assert.deepEqual(schedule.map((item) => item.minutesBeforeStart), [1440, 240, 60, 30]);
  });
}

for (let i = 0; i < 12; i += 1) {
  test(`default reminder strategy keeps configured values ${i}`, () => {
    const strategy = new DefaultReminderStrategy();
    const event = new CalendarEvent(command(i, {
      id: `default-rem-${i}`,
      startAt: new Date('2026-10-02T12:00:00.000Z'),
      endAt: new Date('2026-10-02T13:00:00.000Z'),
      reminderMinutes: [45, 15]
    }));
    assert.deepEqual(strategy.buildSchedule(event).map((item) => item.minutesBeforeStart), [45, 15]);
  });
}

for (let i = 0; i < 12; i += 1) {
  test(`notification center dispatches by channel ${i}`, () => {
    const center = new NotificationCenter();
    const emailObserver = new RecordingNotificationObserver(NotificationChannel.EMAIL);
    const appObserver = new RecordingNotificationObserver(NotificationChannel.IN_APP);
    center.subscribe(emailObserver);
    center.subscribe(appObserver);
    const event = new CalendarEvent(command(i, { id: `notify-${i}` }));
    center.notifyEvent(event, 'Subject', 'Body', [NotificationChannel.EMAIL, NotificationChannel.IN_APP]);
    assert.equal(emailObserver.messages.length, 2);
    assert.equal(appObserver.messages.length, 2);
    center.unsubscribe(appObserver);
    center.notifyEvent(event, 'Subject 2', 'Body 2', [NotificationChannel.IN_APP]);
    assert.equal(appObserver.messages.length, 2);
  });
}

for (let i = 0; i < 10; i += 1) {
  test(`date utilities detect overlap ${i}`, () => {
    assert.equal(overlaps(
      new Date('2026-11-01T10:00:00.000Z'),
      new Date('2026-11-01T11:00:00.000Z'),
      new Date('2026-11-01T10:30:00.000Z'),
      new Date('2026-11-01T11:30:00.000Z')
    ), true);
    assert.equal(minutesBetween(
      new Date('2026-11-01T10:00:00.000Z'),
      new Date('2026-11-01T11:00:00.000Z')
    ), 60);
  });
}
