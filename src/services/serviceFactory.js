import { Participant } from '../models/participant.js';
import { InMemoryRepository } from '../storage/inMemoryRepository.js';
import { SequentialIdGenerator } from '../utils/idGenerator.js';
import { EventBuilder } from './eventBuilder.js';
import { StrictCancellationPolicy } from './cancellationPolicy.js';
import { NoParticipantOverlapPolicy, SameLocationOverlapPolicy } from './conflictPolicy.js';
import { NotificationCenter } from './notificationCenter.js';
import { PriorityReminderStrategy } from './reminderStrategy.js';
import { EventService } from './eventService.js';

export function createDefaultEventService() {
  const participantRepository = new InMemoryRepository([
    new Participant({ id: 'u-1', name: 'Анна Організатор', email: 'anna@example.com' }),
    new Participant({ id: 'u-2', name: 'Максим Учасник', email: 'maksym@example.com', phone: '+380501111111' }),
    new Participant({ id: 'u-3', name: 'Ірина Спікер', email: 'iryna@example.com' })
  ]);
  const eventRepository = new InMemoryRepository();
  const idGenerator = new SequentialIdGenerator('event');
  const notificationCenter = new NotificationCenter();
  return {
    eventRepository,
    participantRepository,
    notificationCenter,
    service: new EventService({
      eventRepository,
      participantRepository,
      eventBuilderFactory: () => new EventBuilder(idGenerator),
      conflictPolicies: [new NoParticipantOverlapPolicy(), new SameLocationOverlapPolicy()],
      cancellationPolicy: new StrictCancellationPolicy(),
      reminderStrategy: new PriorityReminderStrategy(),
      notificationCenter
    })
  };
}
