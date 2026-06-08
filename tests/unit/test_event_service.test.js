import nodeTest from 'node:test';
import assert from 'node:assert/strict';

const TEST_FILE = 'tests/unit/test_event_service.test.js';

function test(name, fn) {
  return nodeTest(`${TEST_FILE}::${name}`, fn);
}

import { EventPriority, EventStatus, EventType } from '../../src/models/enums.js';
import { CalendarEvent } from '../../src/models/event.js';
import { FlexibleCancellationPolicy, StrictCancellationPolicy } from '../../src/services/cancellationPolicy.js';
import { addMinutes, minutesBetween } from '../../src/utils/dateUtils.js';
import { command, runtime } from '../helpers/eventTestUtils.js';

for (let i = 0; i < 45; i += 1) {
  test(`TestEventServiceCreate::test_create_valid_event_variant_${i}`, () => {
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
  test(`TestEventServiceConflicts::test_reject_participant_overlap_${i}`, () => {
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
  test(`TestEventServiceConflicts::test_reject_same_location_overlap_${i}`, () => {
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
  test(`TestEventServiceMutation::test_update_fields_and_version_${i}`, () => {
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
  test(`TestEventServiceMutation::test_reschedule_without_conflicts_${i}`, () => {
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
  test(`TestCancellationPolicy::test_strict_blocks_late_critical_event_${i}`, () => {
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
  test(`TestCancellationPolicy::test_flexible_allows_event_${i}`, () => {
    const { service } = runtime({ cancellationPolicy: new FlexibleCancellationPolicy() });
    const event = service.createEvent(command(i));
    const cancelled = service.cancelEvent(event.id, 'No longer needed');
    assert.equal(cancelled.status, EventStatus.CANCELLED);
    assert.equal(cancelled.cancellationReason, 'No longer needed');
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`TestEventServiceParticipants::test_add_and_remove_participants_${i}`, () => {
    const { service } = runtime();
    const event = service.createEvent(command(i, { participantIds: ['u-2'], capacity: 4 }));
    service.addParticipant(event.id, 'u-3');
    assert.deepEqual(service.listEvents()[0].participantIds.sort(), ['u-2', 'u-3']);
    service.removeParticipant(event.id, 'u-2');
    assert.deepEqual(service.listEvents()[0].participantIds, ['u-3']);
  });
}

for (let i = 0; i < 18; i += 1) {
  test(`TestEventServiceParticipants::test_reject_blocked_participant_${i}`, () => {
    const { service } = runtime();
    assert.throws(() => service.createEvent(command(i, { participantIds: ['blocked'] })), /blocked/);
  });
}

test('TestEventServiceBranches::test_not_found_cancellation_and_reminder_branches', () => {
  const { service } = runtime();

  assert.throws(() => service.updateEvent('missing', { title: 'Nope' }), /Event with id missing/);
  assert.throws(() => service.createEvent(command(306, { organizerId: 'missing-user' })), /Participant with id missing-user/);

  const event = service.createEvent(command(307));
  assert.equal(service.getReminderSchedule(event.id).length, 2);
  assert.equal(service.listEvents({ status: EventStatus.SCHEDULED }).length, 1);
  assert.equal(service.listEvents({ organizerId: 'u-1' }).length, 1);

  const cancelled = service.cancelEvent(event.id, 'cancelled early', new Date('2026-01-01T10:00:00.000Z'));
  assert.equal(cancelled.status, EventStatus.CANCELLED);
  assert.throws(() => service.updateEvent(event.id, { title: 'Blocked' }), /cancelled event cannot be changed/);
});

test('TestCancellationPolicy::test_strict_rejects_generic_event_inside_minimum_window', () => {
  const event = new CalendarEvent(command(308, {
    id: 'soon',
    startAt: new Date('2026-12-10T10:00:00.000Z'),
    endAt: new Date('2026-12-10T11:00:00.000Z')
  }));
  const decision = new StrictCancellationPolicy().canCancel(event, new Date('2026-12-10T09:50:00.000Z'));

  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /15 minutes/);
});
