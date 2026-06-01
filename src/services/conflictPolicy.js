import { overlaps } from '../utils/dateUtils.js';

export class NoParticipantOverlapPolicy {
  findConflicts(candidate, events) {
    const candidatePeople = new Set([candidate.organizerId, ...candidate.participantIds]);
    return events.filter((event) => {
      if (event.id === candidate.id || !event.isActive()) {
        return false;
      }
      const eventPeople = [event.organizerId, ...event.participantIds];
      const sharesPerson = eventPeople.some((personId) => candidatePeople.has(personId));
      return sharesPerson && overlaps(candidate.startAt, candidate.endAt, event.startAt, event.endAt);
    });
  }
}

export class SameLocationOverlapPolicy {
  findConflicts(candidate, events) {
    return events.filter((event) => {
      if (event.id === candidate.id || !event.isActive()) {
        return false;
      }
      return event.location === candidate.location
        && candidate.location !== 'Online'
        && overlaps(candidate.startAt, candidate.endAt, event.startAt, event.endAt);
    });
  }
}
