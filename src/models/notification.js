export class NotificationMessage {
  constructor({ eventId, recipientId, channel, subject, body, scheduledAt = new Date() }) {
    this.eventId = eventId;
    this.recipientId = recipientId;
    this.channel = channel;
    this.subject = subject;
    this.body = body;
    this.scheduledAt = scheduledAt;
  }
}
