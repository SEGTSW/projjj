import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarEvent } from '../../src/models/event.js';
import { EventPriority, EventType } from '../../src/models/enums.js';
import { Participant } from '../../src/models/participant.js';
import { EventBuilder } from '../../src/services/eventBuilder.js';
import { SequentialIdGenerator } from '../../src/utils/idGenerator.js';
import { command, participant } from '../helpers/eventTestUtils.js';

for (let i = 0; i < 18; i += 1) {
  test(`TestEventBuilder::test_builder_configures_event_${i}`, () => {
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

test('TestParticipantModel::test_validate_required_fields_and_toggle_blocked_state', () => {
  assert.throws(() => new Participant({ id: 'u-x', name: '', email: '' }), /participant requires/);

  const user = participant('toggle');
  user.block();
  assert.equal(user.blocked, true);
  user.unblock();
  assert.equal(user.blocked, false);
});

test('TestCalendarEventModel::test_validate_required_fields_and_protect_invalid_mutations', () => {
  assert.throws(() => new CalendarEvent(command(302, { id: '', title: '', organizerId: '' })), /event requires/);

  const fullEvent = new CalendarEvent(command(303, {
    id: 'full',
    participantIds: ['u-2'],
    capacity: 1
  }));
  assert.throws(() => fullEvent.addParticipant('u-3'), /capacity exceeded/);

  const cancelled = new CalendarEvent(command(304, { id: 'cancelled' }));
  cancelled.cancel('not needed');
  assert.equal(cancelled.isActive(), false);
  assert.throws(() => cancelled.addParticipant('u-3'), /cancelled event/);
  assert.throws(() => new CalendarEvent(command(305, { id: 'bad-reason' })).cancel('x'), /at least 3 characters/);

  const clone = fullEvent.clone();
  assert.notEqual(clone, fullEvent);
  assert.deepEqual(clone.participantIds, fullEvent.participantIds);
});
