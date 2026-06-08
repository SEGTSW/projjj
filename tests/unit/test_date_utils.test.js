import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFutureRange, minutesBetween, overlaps, toDate } from '../../src/utils/dateUtils.js';

for (let i = 0; i < 10; i += 1) {
  test(`TestDateUtils::test_detect_overlap_and_minutes_between_${i}`, () => {
    assert.equal(overlaps(
      new Date('2026-11-01T10:00:00.000Z'),
      new Date('2026-11-01T11:00:00.000Z'),
      new Date('2026-11-01T10:30:00.000Z'),
      new Date('2026-11-01T11:30:00.000Z')
    ), true);
    assert.equal(minutesBetween(
      new Date('2026-11-01T10:00:00.000Z'),
      new Date('2026-11-01T11:00:00.000Z')
    ), 60);
  });
}

test('TestDateUtils::test_reject_invalid_and_inconsistent_ranges', () => {
  assert.throws(() => toDate('not-a-date', 'customDate'), /customDate must be a valid date/);
  assert.throws(
    () => assertFutureRange(
      new Date('2026-12-01T11:00:00.000Z'),
      new Date('2026-12-01T10:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z')
    ),
    /endAt must be after startAt/
  );
  assert.throws(
    () => assertFutureRange(
      new Date('2026-01-01T10:00:00.000Z'),
      new Date('2026-01-01T11:00:00.000Z'),
      new Date('2026-02-01T00:00:00.000Z')
    ),
    /startAt must not be in the past/
  );
});
