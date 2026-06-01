import { Repository } from './repository.js';

export class InMemoryRepository extends Repository {
  #items;

  constructor(initialItems = []) {
    super();
    this.#items = new Map();
    initialItems.forEach((item) => this.save(item));
  }

  save(entity) {
    this.#items.set(entity.id, entity);
    return entity;
  }

  findById(id) {
    return this.#items.get(id) ?? null;
  }

  findAll() {
    return [...this.#items.values()];
  }

  delete(id) {
    return this.#items.delete(id);
  }

  clear() {
    this.#items.clear();
  }
}
