export function NotificationMessage({ eventId, recipientId, channel, subject, body, scheduledAt = new Date() }) {
  return {
    eventId,
    recipientId,
    channel,
    subject,
    body,
    scheduledAt
  };
}
