import { ValidationError } from '../utils/errors.js';

export class Participant {
  constructor({ id, name, email, phone = '', blocked = false }) {
    if (!id || !name || !email) {
      throw new ValidationError('participant requires id, name and email');
    }
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.blocked = blocked;
  }

  block() {
    this.blocked = true;
  }

  unblock() {
    this.blocked = false;
  }
}
