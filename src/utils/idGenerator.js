export class SequentialIdGenerator {
  #prefix;
  #next;

  constructor(prefix = 'id', start = 1) {
    this.#prefix = prefix;
    this.#next = start;
  }

  next() {
    const value = `${this.#prefix}-${String(this.#next).padStart(4, '0')}`;
    this.#next += 1;
    return value;
  }
}
