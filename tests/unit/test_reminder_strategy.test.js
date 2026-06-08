import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarEvent } from '../../src/models/event.js';
import { EventPriority } from '../../src/models/enums.js';
import { DefaultReminderStrategy, PriorityReminderStrategy } from '../../src/services/reminderStrategy.js';
import { command } from '../helpers/eventTestUtils.js';

for (let i = 0; i < 18; i += 1) {
  test(`TestPriorityReminderStrategy::test_adds_critical_reminders_${i}`, () => {
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
  test(`TestDefaultReminderStrategy::test_keeps_configured_values_${i}`, () => {
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
