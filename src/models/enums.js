export const EventStatus = Object.freeze({
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled'
});

export const EventType = Object.freeze({
  MEETING: 'meeting',
  WORKSHOP: 'workshop',
  WEBINAR: 'webinar',
  PERSONAL: 'personal'
});

export const EventPriority = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
});

export const NotificationChannel = Object.freeze({
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in-app'
});
