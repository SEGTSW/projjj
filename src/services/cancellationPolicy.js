import { EventPriority } from '../models/enums.js';
import { minutesBetween } from '../utils/dateUtils.js';

export class FlexibleCancellationPolicy {
  canCancel(_event, _now = new Date()) {
    return { allowed: true, reason: 'cancellation is allowed' };
  }
}

export class StrictCancellationPolicy {
  canCancel(event, now = new Date()) {
    const minutesBeforeStart = minutesBetween(now, event.startAt);
    if (event.priority === EventPriority.CRITICAL && minutesBeforeStart < 120) {
      return { allowed: false, reason: 'critical event requires at least 120 minutes notice' };
    }
    if (minutesBeforeStart < 15) {
      return { allowed: false, reason: 'event requires at least 15 minutes notice' };
    }
    return { allowed: true, reason: 'strict cancellation window passed' };
  }
}
