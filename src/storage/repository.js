export class Repository {
  save(_entity) {
    throw new Error('Repository.save must be implemented');
  }

  findById(_id) {
    throw new Error('Repository.findById must be implemented');
  }

  findAll() {
    throw new Error('Repository.findAll must be implemented');
  }

  delete(_id) {
    throw new Error('Repository.delete must be implemented');
  }
}
