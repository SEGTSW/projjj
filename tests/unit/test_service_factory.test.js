import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultEventService } from '../../src/services/serviceFactory.js';
import { command } from '../helpers/eventTestUtils.js';

test('TestServiceFactory::test_wires_repositories_and_policies', () => {
  const runtime = createDefaultEventService();
  const event = runtime.service.createEvent(command(301, {
    organizerId: 'u-1',
    participantIds: ['u-2'],
    startAt: new Date('2026-12-01T10:00:00.000Z'),
    endAt: new Date('2026-12-01T11:00:00.000Z')
  }));

  assert.equal(runtime.participantRepository.findAll().length, 3);
  assert.equal(runtime.eventRepository.findById(event.id), event);
  assert.equal(runtime.notificationCenter.notifyEvent(event, 'Manual', 'Check').length, 2);
});
