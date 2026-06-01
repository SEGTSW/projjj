import { NotificationChannel } from '../models/enums.js';
import { NotificationMessage } from '../models/notification.js';

export class NotificationObserver {
  update(_message) {
    throw new Error('NotificationObserver.update must be implemented');
  }
}

export class RecordingNotificationObserver extends NotificationObserver {
  constructor(channel = NotificationChannel.IN_APP) {
    super();
    this.channel = channel;
    this.messages = [];
  }

  update(message) {
    if (message.channel === this.channel) {
      this.messages.push(message);
    }
  }
}

export class NotificationCenter {
  #observers;

  constructor() {
    this.#observers = new Set();
  }

  subscribe(observer) {
    this.#observers.add(observer);
  }

  unsubscribe(observer) {
    this.#observers.delete(observer);
  }

  notify(message) {
    this.#observers.forEach((observer) => observer.update(message));
  }

  notifyEvent(event, subject, body, channels = [NotificationChannel.IN_APP]) {
    const recipients = [event.organizerId, ...event.participantIds];
    const messages = recipients.flatMap((recipientId) => channels.map((channel) => new NotificationMessage({
      eventId: event.id,
      recipientId,
      channel,
      subject,
      body
    })));
    messages.forEach((message) => this.notify(message));
    return messages;
  }
}
