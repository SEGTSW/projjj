import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarEvent } from '../../src/models/event.js';
import { NotificationChannel } from '../../src/models/enums.js';
import { NotificationCenter, NotificationObserver, RecordingNotificationObserver } from '../../src/services/notificationCenter.js';
import { command } from '../helpers/eventTestUtils.js';

for (let i = 0; i < 12; i += 1) {
  test(`TestNotificationCenter::test_dispatches_by_channel_${i}`, () => {
    const center = new NotificationCenter();
    const emailObserver = new RecordingNotificationObserver(NotificationChannel.EMAIL);
    const appObserver = new RecordingNotificationObserver(NotificationChannel.IN_APP);
    center.subscribe(emailObserver);
    center.subscribe(appObserver);
    const event = new CalendarEvent(command(i, { id: `notify-${i}` }));
    center.notifyEvent(event, 'Subject', 'Body', [NotificationChannel.EMAIL, NotificationChannel.IN_APP]);
    assert.equal(emailObserver.messages.length, 2);
    assert.equal(appObserver.messages.length, 2);
    center.unsubscribe(appObserver);
    center.notifyEvent(event, 'Subject 2', 'Body 2', [NotificationChannel.IN_APP]);
    assert.equal(appObserver.messages.length, 2);
  });
}

test('TestNotificationObserver::test_base_class_requires_update_implementation', () => {
  assert.throws(() => new NotificationObserver().update({}), /must be implemented/);
});
