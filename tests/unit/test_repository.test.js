import nodeTest from 'node:test';
import assert from 'node:assert/strict';

const TEST_FILE = 'tests/unit/test_repository.test.js';

function test(name, fn) {
  return nodeTest(`${TEST_FILE}::${name}`, fn);
}

import { Repository } from '../../src/storage/repository.js';
import { InMemoryRepository } from '../../src/storage/inMemoryRepository.js';

for (let i = 0; i < 20; i += 1) {
  test(`TestInMemoryRepository::test_save_find_list_and_delete_${i}`, () => {
    const repository = new InMemoryRepository();
    const item = { id: `item-${i}`, value: i };
    repository.save(item);
    assert.equal(repository.findById(item.id), item);
    assert.equal(repository.findAll().length, 1);
    assert.equal(repository.delete(item.id), true);
    assert.equal(repository.findById(item.id), null);
  });
}

test('TestRepositoryInterface::test_methods_require_implementation', () => {
  const repository = new Repository();

  assert.throws(() => repository.save({ id: 'x' }), /Repository\.save/);
  assert.throws(() => repository.findById('x'), /Repository\.findById/);
  assert.throws(() => repository.findAll(), /Repository\.findAll/);
  assert.throws(() => repository.delete('x'), /Repository\.delete/);
});

test('TestInMemoryRepository::test_clear_removes_stored_values', () => {
  const repository = new InMemoryRepository([{ id: 'one' }, { id: 'two' }]);

  repository.clear();

  assert.deepEqual(repository.findAll(), []);
});
