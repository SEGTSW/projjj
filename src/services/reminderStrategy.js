import { addMinutes } from '../utils/dateUtils.js';

export class DefaultReminderStrategy {
  buildSchedule(event) {
    return event.reminderMinutes.map((minutes) => ({
      eventId: event.id,
      minutesBeforeStart: minutes,
      scheduledAt: addMinutes(event.startAt, -minutes)
    }));
  }
}

export class PriorityReminderStrategy {
  buildSchedule(event) {
    const extra = event.priority === 'critical' ? [1440, 240, 60] : [60];
    const minutes = [...new Set([...event.reminderMinutes, ...extra])].sort((a, b) => b - a);
    return minutes.map((value) => ({
      eventId: event.id,
      minutesBeforeStart: value,
      scheduledAt: addMinutes(event.startAt, -value)
    }));
  }
}
